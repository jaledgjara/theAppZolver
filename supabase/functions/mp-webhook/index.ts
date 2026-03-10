import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getErrorMessage } from "../_shared/errorUtils.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rateLimit.ts";

// ============================================================================
// EDGE FUNCTION: mp-webhook
// ============================================================================
//
// RESPONSABILIDAD: Recibir notificaciones de Mercado Pago (webhooks) cuando
// el estado de un pago cambia. Actualiza la tabla 'payments' y ejecuta
// side-effects (confirmar/cancelar reserva, notificar al usuario).
//
// FLUJO:
//   1. Rate limit check
//   2. Parsear notificación entrante (JSON body o query params)
//   3. Validar firma HMAC SHA256 (X-Signature header)
//   4. Idempotency check (skip already-processed webhooks)
//   5. Consultar pago completo a MP API
//   6. Buscar pago en nuestra DB por provider_payment_id
//   7. Actualizar status si cambió
//   8. Ejecutar side-effects (reserva, notificaciones)
//   9. SIEMPRE retornar 200 (MP reintenta en non-200)
//
// IMPORTANTE: Este endpoint NO requiere Authorization header de Supabase.
// Es llamado directamente por los servidores de Mercado Pago.
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 60 requests per minute per IP (MP sends bursts)
const RATE_LIMIT = { maxRequests: 60, windowMs: 60_000 };

// ─── STATUS MAPPING: MP → Zolver ───
const MP_TO_ZOLVER_STATUS: Record<string, string> = {
  approved: "approved",
  authorized: "approved",
  in_process: "pending",
  pending: "pending",
  rejected: "rejected",
  cancelled: "rejected",
  refunded: "refunded",
  charged_back: "refunded",
};

// ─── HMAC SHA256 SIGNATURE VALIDATION ───
async function validateSignature(
  xSignature: string,
  xRequestId: string | null,
  dataId: string,
  secret: string,
): Promise<boolean> {
  try {
    const parts: Record<string, string> = {};
    for (const segment of xSignature.split(",")) {
      const eqIndex = segment.indexOf("=");
      if (eqIndex > 0) {
        parts[segment.substring(0, eqIndex).trim()] = segment.substring(eqIndex + 1).trim();
      }
    }

    if (!parts.ts || !parts.v1) {
      console.warn("[mp-webhook] Signature missing ts or v1.");
      return false;
    }

    const manifest = `id:${dataId};request-id:${xRequestId || ""};ts:${parts.ts};`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(manifest),
    );

    const computedHash = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedHash === parts.v1;
  } catch (err: unknown) {
    console.error("[mp-webhook] Error validating signature:", err);
    return false;
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ─── RATE LIMITING ───
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip, RATE_LIMIT);
  if (!rateCheck.allowed) {
    console.warn(`[mp-webhook] Rate limited IP: ${ip}`);
    return rateLimitResponse(rateCheck.retryAfterMs, corsHeaders);
  }

  try {
    // ─────────────────────────────────────────────────────────────────────
    // 1. PARSEAR NOTIFICACIÓN
    // ─────────────────────────────────────────────────────────────────────
    const url = new URL(req.url);
    let paymentId: string | null = null;
    let topic: string | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        const body = await req.json();
        paymentId = body.data?.id?.toString() ?? null;
        topic = body.type ?? body.topic ?? null;
        console.log(
          `[mp-webhook] JSON notification → topic: ${topic}, paymentId: ${paymentId}, action: ${body.action}`,
        );
      } catch {
        console.warn("[mp-webhook] Failed to parse JSON body.");
      }
    }

    // Fallback: query params (IPN v1 compatibility)
    if (!paymentId) {
      paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
      topic = url.searchParams.get("type") || url.searchParams.get("topic") || topic;
      console.log(`[mp-webhook] Query params → topic: ${topic}, paymentId: ${paymentId}`);
    }

    // Solo procesamos notificaciones de tipo "payment"
    if (topic !== "payment" || !paymentId) {
      console.log(`[mp-webhook] Ignored: topic=${topic}, paymentId=${paymentId}`);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. VALIDAR FIRMA (X-Signature)
    // ─────────────────────────────────────────────────────────────────────
    const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET");
    const environment = Deno.env.get("ENVIRONMENT") || "development";
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    if (!webhookSecret && environment !== "development") {
      console.error("[mp-webhook] CRITICAL: MP_WEBHOOK_SECRET not set. Rejecting webhook.");
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (webhookSecret && xSignature) {
      const isValid = await validateSignature(xSignature, xRequestId, paymentId, webhookSecret);

      if (!isValid) {
        console.error(`[mp-webhook] FIRMA INVÁLIDA. Posible ataque. PaymentId: ${paymentId}`);
        return new Response("Unauthorized", { status: 401 });
      }
      console.log("[mp-webhook] Firma validada correctamente.");
    } else if (webhookSecret && !xSignature) {
      console.warn("[mp-webhook] Secret configurado pero request sin X-Signature. Rechazando.");
      return new Response("Unauthorized: missing X-Signature", { status: 401 });
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. IDEMPOTENCY CHECK
    //
    // Skip already-processed webhooks to prevent duplicate side-effects
    // on race conditions or MP retries.
    // ─────────────────────────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const webhookKey = `${paymentId}_${xRequestId || "no-req-id"}`;
    const { data: existingWebhook } = await supabase
      .from("processed_webhooks")
      .select("webhook_id")
      .eq("webhook_id", webhookKey)
      .maybeSingle();

    if (existingWebhook) {
      console.log(`[mp-webhook] Duplicate webhook skipped: ${webhookKey}`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─────────────────────────────────────────────────────────────────────
    // 4. CONSULTAR PAGO COMPLETO A MP API
    // ─────────────────────────────────────────────────────────────────────
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    if (!mpAccessToken) {
      console.error("[mp-webhook] CRITICAL: MP_ACCESS_TOKEN no configurado.");
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    });

    if (!mpRes.ok) {
      const errBody = await mpRes.text();
      console.error(`[mp-webhook] MP API error (${mpRes.status}): ${errBody}`);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpPayment = await mpRes.json();
    const mpStatus = mpPayment.status;
    const mpStatusDetail = mpPayment.status_detail || "";
    const zolverStatus = MP_TO_ZOLVER_STATUS[mpStatus] || "pending";

    console.log(
      `[mp-webhook] MP Payment ${paymentId} → status: ${mpStatus}, detail: ${mpStatusDetail}, zolver: ${zolverStatus}`,
    );

    // ─────────────────────────────────────────────────────────────────────
    // 5. BUSCAR PAGO EN NUESTRA DB
    // ─────────────────────────────────────────────────────────────────────
    const { data: existingPayment, error: findErr } = await supabase
      .from("payments")
      .select("id, status, reservation_id, client_id, professional_id")
      .eq("provider_payment_id", paymentId)
      .single();

    if (findErr || !existingPayment) {
      console.warn(
        `[mp-webhook] Payment ${paymentId} not found in DB. Ignoring. Error: ${findErr?.message}`,
      );
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const previousStatus = existingPayment.status;

    // ─────────────────────────────────────────────────────────────────────
    // 6. ACTUALIZAR STATUS SI CAMBIÓ
    // ─────────────────────────────────────────────────────────────────────
    if (previousStatus === zolverStatus) {
      console.log(`[mp-webhook] Status unchanged (${previousStatus}). No action needed.`);
      // Record idempotency even for no-change (prevents reprocessing)
      await supabase.from("processed_webhooks").insert({
        webhook_id: webhookKey,
        payment_id: paymentId,
        status_transition: `${previousStatus} → ${zolverStatus} (no change)`,
      });
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[mp-webhook] Status change: ${previousStatus} → ${zolverStatus}`);

    const { error: updateErr } = await supabase
      .from("payments")
      .update({
        status: zolverStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingPayment.id);

    if (updateErr) {
      console.error(
        `[mp-webhook] Error updating payment ${existingPayment.id}:`,
        updateErr.message,
      );
    }

    // Record processed webhook for idempotency
    await supabase.from("processed_webhooks").insert({
      webhook_id: webhookKey,
      payment_id: paymentId,
      status_transition: `${previousStatus} → ${zolverStatus}`,
    });

    // ─────────────────────────────────────────────────────────────────────
    // 7. SIDE EFFECTS SEGÚN TRANSICIÓN DE ESTADO
    // ─────────────────────────────────────────────────────────────────────

    // ── A) PENDING → APPROVED (pago confirmado por banco/3D Secure)
    if (zolverStatus === "approved" && previousStatus === "pending") {
      console.log(`[mp-webhook] Confirming reservation ${existingPayment.reservation_id}`);

      await supabase
        .from("reservations")
        .update({ status: "pending_approval" })
        .eq("id", existingPayment.reservation_id);

      await supabase.from("notifications").insert({
        user_id: existingPayment.professional_id,
        title: "Pago recibido",
        body: "Se confirmó un pago. Revisá tu nueva reserva.",
        type: "payment_received",
        data: {
          reservation_id: existingPayment.reservation_id,
          screen: "/(professional)/(tabs)/home",
        },
      });

      await supabase.from("notifications").insert({
        user_id: existingPayment.client_id,
        title: "Pago aprobado",
        body: "Tu pago fue confirmado exitosamente.",
        type: "payment_approved",
        data: {
          reservation_id: existingPayment.reservation_id,
          screen: "/(client)/(tabs)/reservations",
        },
      });
    }

    // ── B) PENDING/APPROVED → REJECTED
    if (
      zolverStatus === "rejected" &&
      (previousStatus === "pending" || previousStatus === "approved")
    ) {
      console.warn(
        `[mp-webhook] Payment REJECTED. Cancelling reservation ${existingPayment.reservation_id}`,
      );

      await supabase
        .from("reservations")
        .update({
          status: "canceled_client",
          description: `Pago rechazado por Mercado Pago. Detalle: ${mpStatusDetail}`,
        })
        .eq("id", existingPayment.reservation_id);

      await supabase.from("notifications").insert({
        user_id: existingPayment.client_id,
        title: "Pago rechazado",
        body: "Tu pago no pudo ser procesado. Intentá con otro medio de pago.",
        type: "payment_rejected",
        data: {
          reservation_id: existingPayment.reservation_id,
          screen: "/(client)/(tabs)/reservations",
        },
      });
    }

    // ── C) APPROVED → REFUNDED
    if (zolverStatus === "refunded" && previousStatus === "approved") {
      console.log(
        `[mp-webhook] Refund confirmed for reservation ${existingPayment.reservation_id}`,
      );

      await supabase.from("notifications").insert({
        user_id: existingPayment.client_id,
        title: "Reembolso procesado",
        body: "Tu dinero fue devuelto exitosamente.",
        type: "payment_refunded",
        data: {
          reservation_id: existingPayment.reservation_id,
          screen: "/(client)/(tabs)/reservations",
        },
      });
    }

    // ── D) CHARGEBACK
    if (mpStatus === "charged_back") {
      console.error(
        `[mp-webhook] CHARGEBACK on payment ${paymentId}. Reservation: ${existingPayment.reservation_id}. REQUIRES MANUAL REVIEW.`,
      );

      await supabase
        .from("reservations")
        .update({
          status: "disputed",
          description: `Contracargo recibido. ID MP: ${paymentId}. Requiere revisión manual.`,
        })
        .eq("id", existingPayment.reservation_id);

      await supabase.from("notifications").insert({
        user_id: existingPayment.professional_id,
        title: "Contracargo recibido",
        body: "Un cliente disputó un pago. El equipo de Zolver lo está revisando.",
        type: "chargeback",
        data: {
          reservation_id: existingPayment.reservation_id,
          screen: "/(professional)/(tabs)/home",
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────────
    // 8. SIEMPRE RETORNAR 200
    // ─────────────────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({ received: true, status_update: `${previousStatus} → ${zolverStatus}` }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    console.error("[mp-webhook] Unhandled error:", error);
    return new Response(JSON.stringify({ received: true, error: "internal" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
