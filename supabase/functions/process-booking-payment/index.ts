// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * CONFIGURACIÓN DE CABECERAS (CORS)
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. Manejo de Preflight request (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Inicialización de Clientes
    // [ARQUITECTURA]: Usamos Service Role para garantizar permisos de escritura en 'payments'
    // independientemente de las reglas RLS del usuario.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");
    if (!mpAccessToken) {
      throw new Error("Error crítico: Falta MP_ACCESS_TOKEN en servidor.");
    }

    // 3. Recepción y Normalización de Datos
    const rawData = await req.json();
    const {
      card_token,
      amount,
      payer_email,
      payment_method_id,
      user_id,
      professional_id,
      service_category,
      service_modality,
      start_date,
      end_date,
      address_display,
      coordinates,
    } = rawData;

    // Validaciones mínimas
    if (
      !card_token ||
      !amount ||
      !user_id ||
      !professional_id ||
      !start_date ||
      !end_date
    ) {
      throw new Error("Faltan datos obligatorios para la transacción.");
    }

    // Formateo de tipos Postgres
    const scheduledRangeFormat = `[${start_date}, ${end_date})`;
    let pointFormat = null;
    if (coordinates && coordinates.longitude && coordinates.latitude) {
      pointFormat = `(${coordinates.longitude},${coordinates.latitude})`;
    }

    // -----------------------------------------------------------------------
    // LAYER 3: CHECK DISPONIBILIDAD (Evitar Double Booking)
    // -----------------------------------------------------------------------
    const { data: conflicts, error: conflictError } = await supabaseClient
      .from("reservations")
      .select("id")
      .eq("professional_id", professional_id)
      .neq("status", "canceled_pro")
      .neq("status", "canceled_system")
      .neq("status", "canceled_user") // Asegurar que no chocamos con canceladas
      .overlaps("scheduled_range", scheduledRangeFormat);

    if (conflictError)
      throw new Error(`Error DB Check: ${conflictError.message}`);

    if (conflicts && conflicts.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "El horario seleccionado ya no está disponible.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 409, // Conflict
        }
      );
    }

    // -----------------------------------------------------------------------
    // LAYER 4: PROCESAMIENTO DE PAGO (Mercado Pago)
    // -----------------------------------------------------------------------
    const paymentBody = {
      transaction_amount: Number(amount),
      token: card_token,
      description: `Zolver: ${service_category}`,
      installments: 1,
      payment_method_id: payment_method_id,
      payer: { email: payer_email },
    };

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(), // Evita cobros dobles por retry
      },
      body: JSON.stringify(paymentBody),
    });

    const paymentResult = await mpResponse.json();

    if (
      paymentResult.status !== "approved" &&
      paymentResult.status !== "in_process"
    ) {
      console.error("Pago fallido MP:", paymentResult);
      return new Response(
        JSON.stringify({
          success: false,
          error: paymentResult.message || "No se pudo procesar el pago.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // -----------------------------------------------------------------------
    // LAYER 5: PERSISTENCIA ATÓMICA Y CONSISTENCIA DE DATOS
    // -----------------------------------------------------------------------

    // A. Preparar payload de la Reserva
    const reservationPayload = {
      client_id: user_id,
      professional_id: professional_id,
      service_category: service_category,
      service_modality: service_modality,
      address_display: address_display,
      address_coords: pointFormat,
      scheduled_range: scheduledRangeFormat,
      price_final: amount,
      currency: "ARS",
      status: "pending_approval", // [ARQUITECTURA] Correcto flujo Zolver
    };

    // B. Insertar Reserva
    const { data: reservation, error: resError } = await supabaseClient
      .from("reservations")
      .insert(reservationPayload)
      .select()
      .single();

    // [CRITICAL LOGIC] ROLLBACK MANUAL (COMPENSATING TRANSACTION)
    if (resError) {
      console.error(
        `[Zolver-Edge] CRITICAL: Falló DB tras cobro. Iniciando reembolso.`
      );

      // Devolvemos la plata inmediatamente porque no pudimos guardar la reserva
      await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentResult.id}/refunds`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mpAccessToken}`,
            "Content-Type": "application/json",
            "X-Idempotency-Key": crypto.randomUUID(),
          },
        }
      );

      throw new Error(
        `Error interno guardando reserva. Se ha procesado el reembolso automático.`
      );
    }

    // C. Insertar Registro de Pago (El eslabón perdido recuperado)
    const { error: payDbError } = await supabaseClient.from("payments").insert({
      reservation_id: reservation.id,
      payer_id: user_id,
      amount: amount,
      currency: "ARS",
      status: "approved",
      provider_payment_id: paymentResult.id.toString(), // ID MP para futuros reembolsos
      payment_method: "credit_card", // O mapear paymentResult.payment_type_id
      created_at: new Date(),
    });

    if (payDbError) {
      // Alerta severa: Dinero cobrado, Reserva creada, pero sin registro de pago.
      // Esto requiere intervención manual o un sistema de logs robusto (Sentry).
      console.error(
        `[Zolver-Edge] ALERTA: Inconsistencia en tabla 'payments'. ID MP: ${paymentResult.id}`
      );
    }

    // ÉXITO TOTAL
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          reservation_id: reservation.id,
          payment_id: paymentResult.id,
          status: "pending_approval",
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error(`[Zolver-Edge] Exception:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
