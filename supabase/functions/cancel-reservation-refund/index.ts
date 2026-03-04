// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * MERCADO PAGO REFUND/CANCEL STRATEGY
 *
 * MP has TWO different operations depending on payment status:
 *
 *   approved        → POST /v1/payments/{id}/refunds  (refund, returns money)
 *   pending/in_process → PUT /v1/payments/{id} { status: "cancelled" }  (cancel, releases hold)
 *
 * Docs:
 *   Refund:  https://www.mercadopago.com.mx/developers/en/reference/chargebacks/_payments_id_refunds/post
 *   Cancel:  https://www.mercadopago.com.br/developers/en/reference/chargebacks/_payments_payment_id/put
 *
 * Refunds available within 180 days of approval.
 * Cancellations only for pending/in_process/authorized.
 */

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    const { reservation_id, reason, triggered_by } = await req.json();

    console.log(`[Zolver-Refund] Processing: reservation=${reservation_id}, by=${triggered_by}`);

    // -----------------------------------------------------------------------
    // STEP 0: DIAGNOSTIC — Fetch the reservation to get context
    // -----------------------------------------------------------------------

    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("id, client_id, professional_id, status, service_modality, price_final, platform_fee, created_at")
      .eq("id", reservation_id)
      .maybeSingle();

    if (resError) {
      console.error("[Zolver-Refund] ERROR fetching reservation:", resError.message);
    }

    console.log("[Zolver-Refund] RESERVATION DATA:", JSON.stringify(reservation));

    // -----------------------------------------------------------------------
    // STEP 1: Find payment record (primary + fallback + client search)
    // -----------------------------------------------------------------------

    let { data: paymentRecord, error: payQueryError } = await supabase
      .from("payments")
      .select("*")
      .eq("reservation_id", reservation_id)
      .in("status", ["approved", "pending"])
      .maybeSingle();

    if (payQueryError) {
      console.error("[Zolver-Refund] DB query error:", payQueryError.message);
    }

    // Fallback 1: check ALL statuses for this reservation_id
    if (!paymentRecord) {
      console.warn("[Zolver-Refund] No active payment found. Fallback query (any status)...");

      const { data: fallbackRecord, error: fbErr } = await supabase
        .from("payments")
        .select("*")
        .eq("reservation_id", reservation_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fbErr) {
        console.error("[Zolver-Refund] Fallback query error:", fbErr.message);
      }

      if (fallbackRecord) {
        console.log(
          `[Zolver-Refund] Fallback found: id=${fallbackRecord.id}, status=${fallbackRecord.status}, mp_id=${fallbackRecord.provider_payment_id}`
        );
        if (fallbackRecord.status !== "refunded" && fallbackRecord.status !== "canceled") {
          paymentRecord = fallbackRecord;
        } else {
          console.log("[Zolver-Refund] Payment already resolved. Skipping MP call.");
        }
      }
    }

    // Fallback 2: If still nothing, search by client_id (maybe reservation_id FK was lost)
    if (!paymentRecord && reservation?.client_id) {
      console.warn(`[Zolver-Refund] No payment by reservation_id. Searching by client_id=${reservation.client_id}...`);

      const { data: clientPayments, error: cpErr } = await supabase
        .from("payments")
        .select("*")
        .eq("client_id", reservation.client_id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (cpErr) {
        console.error("[Zolver-Refund] Client payments query error:", cpErr.message);
      }

      console.log(
        `[Zolver-Refund] DIAGNOSTIC — All recent payments for client ${reservation.client_id}:`,
        JSON.stringify(clientPayments?.map(p => ({
          id: p.id,
          reservation_id: p.reservation_id,
          status: p.status,
          amount: p.amount,
          mp_id: p.provider_payment_id,
          created: p.created_at,
        })) || [])
      );

      // Try to match by professional_id + approximate time
      if (clientPayments && clientPayments.length > 0) {
        const match = clientPayments.find(
          (p) =>
            p.professional_id === reservation.professional_id &&
            p.status !== "refunded" &&
            p.status !== "canceled"
        );
        if (match) {
          console.log(`[Zolver-Refund] MATCHED payment by client+professional: id=${match.id}, mp_id=${match.provider_payment_id}`);
          paymentRecord = match;
        }
      }
    }

    // Final diagnostic: if STILL nothing, dump the payments table count
    if (!paymentRecord) {
      const { count } = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true });

      console.error(
        `[Zolver-Refund] DIAGNOSTIC — Total rows in payments table: ${count}. ` +
        `No payment found for reservation=${reservation_id}, client=${reservation?.client_id}.`
      );
    }

    // -----------------------------------------------------------------------
    // STEP 2: Execute correct MP operation based on payment status
    // -----------------------------------------------------------------------

    let refundData: Record<string, unknown> = {};
    let mpAction = "none";

    if (paymentRecord && paymentRecord.provider_payment_id) {
      const mpPaymentId = paymentRecord.provider_payment_id;
      const dbStatus = paymentRecord.status;

      if (dbStatus === "approved") {
        // ─── APPROVED → POST /refunds (return money to client) ───
        mpAction = "refund";
        console.log(`[Zolver-Refund] REFUND approved payment. MP ID: ${mpPaymentId}, amount: ${paymentRecord.amount}`);

        const refundRes = await fetch(
          `https://api.mercadopago.com/v1/payments/${mpPaymentId}/refunds`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${mpAccessToken}`,
              "Content-Type": "application/json",
              "X-Idempotency-Key": crypto.randomUUID(),
            },
            body: JSON.stringify({ amount: paymentRecord.amount }),
          }
        );

        refundData = await refundRes.json();

        if (refundRes.status !== 200 && refundRes.status !== 201) {
          console.error(`[Zolver-Refund] MP refund rejected (HTTP ${refundRes.status}):`, refundData);
          throw new Error(
            `Mercado Pago rechazó el reembolso (HTTP ${refundRes.status}). MP ID: ${mpPaymentId}`
          );
        }

        console.log(`[Zolver-Refund] Refund OK. MP Refund ID: ${refundData.id}`);

        await supabase
          .from("payments")
          .update({ status: "refunded", updated_at: new Date() })
          .eq("id", paymentRecord.id);

      } else if (dbStatus === "pending" || dbStatus === "in_process") {
        // ─── PENDING/IN_PROCESS → PUT status:"cancelled" (release hold) ───
        mpAction = "cancel";
        console.log(`[Zolver-Refund] CANCEL pending payment. MP ID: ${mpPaymentId}`);

        const cancelRes = await fetch(
          `https://api.mercadopago.com/v1/payments/${mpPaymentId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${mpAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "cancelled" }),
          }
        );

        const cancelData = await cancelRes.json();

        if (cancelRes.status !== 200) {
          console.error(`[Zolver-Refund] MP cancel rejected (HTTP ${cancelRes.status}):`, cancelData);
          throw new Error(
            `Mercado Pago rechazó la cancelación (HTTP ${cancelRes.status}). MP ID: ${mpPaymentId}`
          );
        }

        console.log(`[Zolver-Refund] Cancel OK. MP payment ${mpPaymentId} cancelled.`);
        refundData = cancelData;

        await supabase
          .from("payments")
          .update({ status: "canceled", updated_at: new Date() })
          .eq("id", paymentRecord.id);

      } else {
        console.warn(`[Zolver-Refund] Unexpected DB status "${dbStatus}" for payment ${paymentRecord.id}. Skipping MP call.`);
      }
    } else {
      // No payment record at all
      console.error(
        `[Zolver-Refund] CRITICAL: No payment record for reservation ${reservation_id}. REQUIRES MANUAL REVIEW.`
      );
    }

    // -----------------------------------------------------------------------
    // STEP 3: Cancel the reservation
    // -----------------------------------------------------------------------

    let finalStatus = "canceled_client";
    if (triggered_by === "professional") finalStatus = "canceled_pro";

    const descParts = [`Cancelado por ${triggered_by}: ${reason}`];
    if (mpAction === "refund" && refundData.id) descParts.push(`Reembolso MP: ${refundData.id}`);
    if (mpAction === "cancel") descParts.push(`Pago cancelado en MP: ${paymentRecord?.provider_payment_id}`);
    if (!paymentRecord) descParts.push("SIN REGISTRO DE PAGO - REVISAR MANUALMENTE");

    const { error: resUpdateError } = await supabase
      .from("reservations")
      .update({
        status: finalStatus,
        description: descParts.join(". "),
      })
      .eq("id", reservation_id);

    if (resUpdateError) {
      console.error("[Zolver-Refund] Error updating reservation:", resUpdateError);
    }

    // -----------------------------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------------------------

    return new Response(
      JSON.stringify({
        success: true,
        message: mpAction === "refund"
          ? "Reserva cancelada y dinero reembolsado."
          : mpAction === "cancel"
          ? "Reserva cancelada y pago anulado."
          : paymentRecord
          ? "Reserva cancelada (pago ya resuelto)."
          : "Reserva cancelada. Sin pago encontrado (revisar manualmente).",
        mp_action: mpAction,
        refund_id: refundData.id || null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error(`[Zolver-Refund] Error Fatal:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
