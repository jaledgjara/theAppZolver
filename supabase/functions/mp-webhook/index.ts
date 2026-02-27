// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// EDGE FUNCTION: mp-webhook
// ============================================================================
//
// RESPONSABILIDAD: Recibir notificaciones de Mercado Pago (webhooks) cuando
// el estado de un pago cambia. Actualiza la tabla 'payments' y ejecuta
// side-effects (confirmar/cancelar reserva, notificar al usuario).
//
// FLUJO:
//   1. Parsear notificación entrante (JSON body o query params)
//   2. Validar firma HMAC SHA256 (X-Signature header)
//   3. Consultar pago completo a MP API
//   4. Buscar pago en nuestra DB por provider_payment_id
//   5. Actualizar status si cambió
//   6. Ejecutar side-effects (reserva, notificaciones)
//   7. SIEMPRE retornar 200 (MP reintenta en non-200)
//
// IMPORTANTE: Este endpoint NO requiere Authorization header de Supabase.
// Es llamado directamente por los servidores de Mercado Pago.
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
  secret: string
): Promise<boolean> {
  try {
    // MP sends: x-signature: ts=1234567890,v1=abc123hex...
    const parts: Record<string, string> = {};
    for (const segment of xSignature.split(",")) {
      const eqIndex = segment.indexOf("=");
      if (eqIndex > 0) {
        parts[segment.substring(0, eqIndex).trim()] =
          segment.substring(eqIndex + 1).trim();
      }
    }

    if (!parts.ts || !parts.v1) {
      console.warn("[mp-webhook] Signature missing ts or v1.");
      return false;
    }

    // Manifest format defined by MP:
    // id:{data.id};request-id:{x-request-id};ts:{ts};
    const manifest = `id:${dataId};request-id:${xRequestId || ""};ts:${parts.ts};`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(manifest)
    );

    const computedHash = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedHash === parts.v1;
  } catch (err) {
    console.error("[mp-webhook] Error validating signature:", err);
    return false;
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ─────────────────────────────────────────────────────────────────────
    // 1. PARSEAR NOTIFICACIÓN
    //
    // MP envía webhooks en 2 formatos posibles:
    //   - JSON body: { action: "payment.updated", type: "payment", data: { id: "123" } }
    //   - Query params (IPN legacy): ?id=123&topic=payment
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
          `[mp-webhook] JSON notification → topic: ${topic}, paymentId: ${paymentId}, action: ${body.action}`
        );
      } catch {
        console.warn("[mp-webhook] Failed to parse JSON body.");
      }
    }

    // Fallback: query params (IPN v1 compatibility)
    if (!paymentId) {
      paymentId =
        url.searchParams.get("data.id") || url.searchParams.get("id");
      topic =
        url.searchParams.get("type") || url.searchParams.get("topic") || topic;
      console.log(
        `[mp-webhook] Query params → topic: ${topic}, paymentId: ${paymentId}`
      );
    }

    // Solo procesamos notificaciones de tipo "payment"
    if (topic !== "payment" || !paymentId) {
      console.log(
        `[mp-webhook] Ignored: topic=${topic}, paymentId=${paymentId}`
      );
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─────────────────────────────────────────────────────────────────────
    // 2. VALIDAR FIRMA (X-Signature)
    //
    // Mercado Pago envía un HMAC SHA256 en el header X-Signature.
    // Si tenemos el webhook secret configurado, RECHAZAMOS firmas inválidas.
    // ─────────────────────────────────────────────────────────────────────
    const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET");
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    if (webhookSecret && xSignature) {
      const isValid = await validateSignature(
        xSignature,
        xRequestId,
        paymentId,
        webhookSecret
      );

      if (!isValid) {
        console.error(
          `[mp-webhook] FIRMA INVÁLIDA. Posible ataque. PaymentId: ${paymentId}`
        );
        return new Response("Unauthorized", { status: 401 });
      }
      console.log("[mp-webhook] Firma validada correctamente.");
    } else if (webhookSecret && !xSignature) {
      console.warn(
        "[mp-webhook] Secret configurado pero request sin X-Signature. Procesando igualmente."
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 3. CONSULTAR PAGO COMPLETO A MP API
    //
    // El webhook solo envía el ID. Debemos consultar el estado real
    // directamente a la API de MP (source of truth).
    // ─────────────────────────────────────────────────────────────────────
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    if (!mpAccessToken) {
      console.error("[mp-webhook] CRITICAL: MP_ACCESS_TOKEN no configurado.");
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${mpAccessToken}` } }
    );

    if (!mpRes.ok) {
      const errBody = await mpRes.text();
      console.error(
        `[mp-webhook] MP API error (${mpRes.status}): ${errBody}`
      );
      // Retornamos 200 para que MP no reintente si el pago no existe
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
      `[mp-webhook] MP Payment ${paymentId} → status: ${mpStatus}, detail: ${mpStatusDetail}, zolver: ${zolverStatus}`
    );

    // ─────────────────────────────────────────────────────────────────────
    // 4. BUSCAR PAGO EN NUESTRA DB
    // ─────────────────────────────────────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: existingPayment, error: findErr } = await supabase
      .from("payments")
      .select("id, status, reservation_id, client_id, professional_id")
      .eq("provider_payment_id", paymentId)
      .single();

    if (findErr || !existingPayment) {
      console.warn(
        `[mp-webhook] Payment ${paymentId} not found in DB. Ignoring. Error: ${findErr?.message}`
      );
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const previousStatus = existingPayment.status;

    // ─────────────────────────────────────────────────────────────────────
    // 5. ACTUALIZAR STATUS SI CAMBIÓ
    // ─────────────────────────────────────────────────────────────────────
    if (previousStatus === zolverStatus) {
      console.log(
        `[mp-webhook] Status unchanged (${previousStatus}). No action needed.`
      );
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(
      `[mp-webhook] Status change: ${previousStatus} → ${zolverStatus}`
    );

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
        updateErr.message
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // 6. SIDE EFFECTS SEGÚN TRANSICIÓN DE ESTADO
    // ─────────────────────────────────────────────────────────────────────

    // ── A) PENDING → APPROVED (pago confirmado por banco/3D Secure)
    if (zolverStatus === "approved" && previousStatus === "pending") {
      console.log(
        `[mp-webhook] Confirming reservation ${existingPayment.reservation_id}`
      );

      // Actualizar reserva a pending_approval (el profesional debe aceptar)
      await supabase
        .from("reservations")
        .update({ status: "pending_approval" })
        .eq("id", existingPayment.reservation_id);

      // Notificar al profesional
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

      // Notificar al cliente
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

    // ── B) PENDING/APPROVED → REJECTED (pago rechazado post-procesamiento)
    if (
      zolverStatus === "rejected" &&
      (previousStatus === "pending" || previousStatus === "approved")
    ) {
      console.warn(
        `[mp-webhook] Payment REJECTED. Cancelling reservation ${existingPayment.reservation_id}`
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

    // ── C) APPROVED → REFUNDED (reembolso procesado — puede venir de cancel-reservation-refund o desde MP)
    if (zolverStatus === "refunded" && previousStatus === "approved") {
      console.log(
        `[mp-webhook] Refund confirmed for reservation ${existingPayment.reservation_id}`
      );

      // Solo notificamos, no cancelamos reserva (cancel-reservation-refund ya lo hace)
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

    // ── D) CHARGEBACK (contracargo — el cliente disputó con su banco)
    if (mpStatus === "charged_back") {
      console.error(
        `[mp-webhook] ⚠️ CHARGEBACK on payment ${paymentId}. Reservation: ${existingPayment.reservation_id}. REQUIRES MANUAL REVIEW.`
      );

      // Cancelar la reserva
      await supabase
        .from("reservations")
        .update({
          status: "disputed",
          description: `Contracargo recibido. ID MP: ${paymentId}. Requiere revisión manual.`,
        })
        .eq("id", existingPayment.reservation_id);

      // Notificar al admin/profesional
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
    // 7. SIEMPRE RETORNAR 200
    //
    // Si retornamos otro código, MP reintentará la notificación.
    // Solo retornamos non-200 para firmas inválidas (seguridad).
    // ─────────────────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({ received: true, status_update: `${previousStatus} → ${zolverStatus}` }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[mp-webhook] Unhandled error:", error);
    // Retornamos 200 incluso en errores internos para evitar reintentos infinitos
    return new Response(
      JSON.stringify({ received: true, error: "internal" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
