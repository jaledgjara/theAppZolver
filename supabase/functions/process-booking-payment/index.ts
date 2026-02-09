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
      // --- Required fields ---
      card_token,
      amount,
      payer_email,
      payment_method_id, // MP brand: 'visa', 'mastercard', etc.
      user_id,
      professional_id,
      service_category,
      service_modality,
      start_date,
      end_date,
      address_display,
      coordinates,
      // --- Optional: Saved Card (Customer Card) fields ---
      customer_id, // MP Customer ID (from user_payment_methods.provider_customer_id)
      saved_card_id, // Zolver DB uuid (from user_payment_methods.id) for FK in payments table
      method, // 'credit_card' | 'debit_card' | 'platform_credit'
    } = rawData;

    const isSavedCard = !!customer_id;
    console.log(
      `[Zolver-Edge] Mode: ${isSavedCard ? "SAVED CARD" : "NEW CARD"}`
    );

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
    //
    // BUSINESS RULES:
    //   - INSTANT: Max 1 activo. Bloquea solo contra otros INSTANT.
    //   - QUOTE:   Ilimitados. NUNCA se bloquean entre sí ni contra instant.
    //   - HYBRID:  1 instant + N quotes simultáneos (flujos independientes).
    //
    // Solo se verifica conflicto cuando service_modality === "instant".
    // -----------------------------------------------------------------------
    if (service_modality === "instant") {
      const ACTIVE_STATUSES = [
        "pending_approval",
        "confirmed",
        "on_route",
        "in_progress",
      ];

      const { data: conflicts, error: conflictError } = await supabaseClient
        .from("reservations")
        .select("id")
        .eq("professional_id", professional_id)
        .eq("service_modality", "instant")
        .in("status", ACTIVE_STATUSES)
        .overlaps("scheduled_range", scheduledRangeFormat);

      if (conflictError)
        throw new Error(`Error DB Check: ${conflictError.message}`);

      if (conflicts && conflicts.length > 0) {
        console.warn(
          `[Zolver-Edge] Conflicto instant detectado: ${conflicts.length} reserva(s) activa(s).`
        );
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
    } else {
      console.log(
        `[Zolver-Edge] Modality="${service_modality}" → Skip conflict check (quotes are unlimited).`
      );
    }

    // -----------------------------------------------------------------------
    // LAYER 4: PROCESAMIENTO DE PAGO (Mercado Pago)
    // -----------------------------------------------------------------------
    // Build payer object: include customer ID for saved cards so MP links the payment
    const payer = isSavedCard
      ? { id: customer_id, email: payer_email }
      : { email: payer_email };

    const paymentBody = {
      transaction_amount: Number(amount),
      token: card_token, // New card: full token | Saved card: CVV-only token
      description: `Zolver: ${service_category}`,
      installments: 1,
      payment_method_id: payment_method_id,
      payer,
    };

    console.log(
      `[Zolver-Edge] MP Payment Body:`,
      JSON.stringify({ ...paymentBody, token: "[REDACTED]" })
    );

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

    // A. Calcular desglose de precio (el frontend envía el total con fee incluida)
    // totalAmount = subtotal * 1.10 → subtotal = totalAmount / 1.10
    const totalAmount = Number(amount);
    const subtotalCalc = Math.round(totalAmount / 1.10);
    const platformFeeCalc = totalAmount - subtotalCalc;

    // B. Insertar Reserva via RPC (misma función que usa el frontend)
    // Esto garantiza compatibilidad con triggers, defaults y NOT NULL constraints.
    const { data: rpcResult, error: resError } = await supabaseClient.rpc(
      "create_reservation_bypass",
      {
        p_client_id: user_id,
        p_professional_id: professional_id,
        p_category: service_category,
        p_modality: service_modality,
        p_title: service_category, // Título = categoría del servicio
        p_description: "",
        p_service_tags: [],
        p_address_display: address_display,
        p_address_coords: pointFormat,
        p_range: scheduledRangeFormat,
        p_status: "pending_approval",
        p_price_estimated: subtotalCalc,
        p_price_final: totalAmount,
        p_platform_fee: platformFeeCalc,
      }
    );

    // [CRITICAL LOGIC] ROLLBACK MANUAL (COMPENSATING TRANSACTION)
    if (resError) {
      console.error(
        `[Zolver-Edge] CRITICAL: Falló DB tras cobro. Error: ${resError.message}. Iniciando reembolso.`
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

    // rpcResult puede ser un UUID string (frontal) o la fila completa (service role).
    // Normalizamos para extraer siempre el UUID como string.
    const reservationId =
      typeof rpcResult === "string" ? rpcResult : rpcResult?.id;

    if (!reservationId) {
      console.error("[Zolver-Edge] CRITICAL: RPC no devolvió ID de reserva.", rpcResult);
      throw new Error("Error interno: No se obtuvo el ID de la reserva creada.");
    }

    console.log(`[Zolver-Edge] Reserva creada: ${reservationId}`);

    // C. Insertar Registro de Pago (columnas alineadas a tabla 'payments' real)
    const { error: payDbError } = await supabaseClient.from("payments").insert({
      reservation_id: reservationId,
      client_id: user_id,
      professional_id: professional_id,
      amount: amount,
      currency: "ARS",
      status: "approved",
      method: method || "credit_card", // DB enum: credit_card | debit_card | platform_credit
      payment_method_id: saved_card_id || null, // FK -> user_payment_methods (null for new cards)
      provider_payment_id: paymentResult.id.toString(), // ID MP para futuros reembolsos
    });

    if (payDbError) {
      // Alerta severa: Dinero cobrado, Reserva creada, pero sin registro de pago.
      // Esto requiere intervención manual o un sistema de logs robusto (Sentry).
      console.error(
        `[Zolver-Edge] ALERTA: Inconsistencia en tabla 'payments'. Error: ${payDbError.message}. ID MP: ${paymentResult.id}`
      );
    }

    // ÉXITO TOTAL
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          reservation_id: reservationId,
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
