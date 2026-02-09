// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    // [ARQUITECTURA]: Service Role es OBLIGATORIO aquí.
    // Un usuario normal no tiene permiso para ejecutar reembolsos directos.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");

    // Recibimos quien dispara la acción (professional, system_timeout, user_before_confirm)
    const { reservation_id, reason, triggered_by } = await req.json();

    // 1. Obtener el registro de pago asociado a la reserva
    const { data: paymentRecord, error: payError } = await supabase
      .from("payments")
      .select("*")
      .eq("reservation_id", reservation_id)
      .eq("status", "approved") // Solo reembolsamos lo que está cobrado
      .single();

    if (payError || !paymentRecord) {
      console.error("Error buscando pago:", payError);
      throw new Error(
        "No se encontró un pago aprobado válido para esta reserva."
      );
    }

    console.log(
      `[Zolver-Refund] Iniciando reembolso MP ID: ${paymentRecord.provider_payment_id}`
    );

    // 2. Llamar a Mercado Pago (Refund)
    const refundRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentRecord.provider_payment_id}/refunds`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID(),
        },
        body: JSON.stringify({ amount: paymentRecord.amount }), // Reembolso total
      }
    );

    const refundData = await refundRes.json();

    if (refundRes.status !== 200 && refundRes.status !== 201) {
      console.error("Error MP Refund API:", refundData);
      throw new Error("Mercado Pago rechazó la solicitud de reembolso.");
    }

    // 3. Actualizar Estados en DB (Atomicidad Eventual)

    // A. Marcar pago como 'refunded'
    await supabase
      .from("payments")
      .update({ status: "refunded", updated_at: new Date() })
      .eq("id", paymentRecord.id);

    // B. Determinar estado final según quién canceló (enum: canceled_pro | canceled_client)
    let finalStatus = "canceled_client"; // Default for system/user cancellations
    if (triggered_by === "professional") finalStatus = "canceled_pro";

    // C. Cancelar Reserva
    const { error: resUpdateError } = await supabase
      .from("reservations")
      .update({
        status: finalStatus,
        description: `Cancelado por ${triggered_by}: ${reason}. Reembolso MP: ${refundData.id}`,
      })
      .eq("id", reservation_id);

    if (resUpdateError) {
      console.error("Error actualizando reserva a cancelada:", resUpdateError);
      // No lanzamos error aquí porque el dinero YA FUE DEVUELTO.
      // Solo logueamos la inconsistencia.
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Reserva cancelada y dinero reembolsado exitosamente.",
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
