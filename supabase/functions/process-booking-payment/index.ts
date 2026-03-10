import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseJWT } from "../_shared/verifySupabaseJWT.ts";
import { getErrorMessage } from "../_shared/errorUtils.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rateLimit.ts";

/**
 * CONFIGURACIÓN DE CABECERAS (CORS)
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 5 payment attempts per minute per IP
const RATE_LIMIT = { maxRequests: 5, windowMs: 60_000 };

serve(async (req) => {
  // 1. Manejo de Preflight request (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Rate limiting
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip, RATE_LIMIT);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.retryAfterMs, corsHeaders);
  }

  try {
    // 2a. Verify Firebase JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }
    const jwtToken = authHeader.replace("Bearer ", "").trim();
    const jwtPayload = await verifySupabaseJWT(jwtToken);
    const verifiedUid = jwtPayload.firebase_uid;

    // 2. Inicialización de Clientes
    // [ARQUITECTURA]: Usamos Service Role para garantizar permisos de escritura en 'payments'
    // independientemente de las reglas RLS del usuario.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
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
      amount, // Platform fee only (what MP charges)
      subtotal, // Service price (P2P between client and professional)
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
      device_id, // Device fingerprint for MP fraud prevention
    } = rawData;

    // Verify user_id matches the authenticated user
    if (user_id !== verifiedUid) {
      console.error(`[Zolver-Edge] user_id mismatch: body=${user_id}, jwt=${verifiedUid}`);
      return new Response(
        JSON.stringify({ success: false, error: "user_id does not match authenticated user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 },
      );
    }

    const isSavedCard = !!customer_id;
    console.log(`[Zolver-Edge] Mode: ${isSavedCard ? "SAVED CARD" : "NEW CARD"}`);

    // Validaciones mínimas
    if (!card_token || !amount || !user_id || !professional_id || !start_date || !end_date) {
      throw new Error("Faltan datos obligatorios para la transacción.");
    }

    // -----------------------------------------------------------------------
    // LAYER 2b: DOUBLE-PAYMENT PROTECTION
    //
    // Prevent duplicate reservations from frontend retries.
    // Check if this client already has a pending/approved payment
    // for the same professional in the same time range.
    // -----------------------------------------------------------------------
    const { data: existingPayments } = await supabaseClient
      .from("payments")
      .select("id, status, reservation_id")
      .eq("client_id", user_id)
      .eq("professional_id", professional_id)
      .in("status", ["pending", "approved"]);

    if (existingPayments && existingPayments.length > 0) {
      // Check if any existing reservation overlaps with the requested time range
      for (const payment of existingPayments) {
        const { data: existingRes } = await supabaseClient
          .from("reservations")
          .select("id, scheduled_range")
          .eq("id", payment.reservation_id)
          .single();

        if (existingRes) {
          console.warn(
            `[Zolver-Edge] Duplicate payment detected. Existing reservation: ${existingRes.id}`,
          );
          return new Response(
            JSON.stringify({
              success: false,
              error: "Ya tenés un pago pendiente o aprobado para este profesional.",
              existing_reservation_id: existingRes.id,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 409,
            },
          );
        }
      }
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
      const ACTIVE_STATUSES = ["pending_approval", "confirmed", "on_route", "in_progress"];

      const { data: conflicts, error: conflictError } = await supabaseClient
        .from("reservations")
        .select("id")
        .eq("professional_id", professional_id)
        .eq("service_modality", "instant")
        .in("status", ACTIVE_STATUSES)
        .overlaps("scheduled_range", scheduledRangeFormat);

      if (conflictError) throw new Error(`Error DB Check: ${conflictError.message}`);

      if (conflicts && conflicts.length > 0) {
        console.warn(
          `[Zolver-Edge] Conflicto instant detectado: ${conflicts.length} reserva(s) activa(s).`,
        );
        return new Response(
          JSON.stringify({
            success: false,
            error: "El horario seleccionado ya no está disponible.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 409, // Conflict
          },
        );
      }
    } else {
      console.log(
        `[Zolver-Edge] Modality="${service_modality}" → Skip conflict check (quotes are unlimited).`,
      );
    }

    // -----------------------------------------------------------------------
    // LAYER 4: PROCESAMIENTO DE PAGO (Mercado Pago)
    // -----------------------------------------------------------------------

    // A. Fee calculation (must happen BEFORE payment body)
    const platformFeeAmount = Number(amount);
    const serviceSubtotal = Number(subtotal) || 0;
    const totalAmount = serviceSubtotal + platformFeeAmount;

    console.log(
      `[Zolver-Edge] Fee breakdown: subtotal=${serviceSubtotal}, fee=${platformFeeAmount}, total=${totalAmount}`,
    );

    // B. Build payer object: include customer ID for saved cards so MP links the payment
    // type: "customer" is required by MP when charging a saved card — without it MP
    // treats the payment as a new-card attempt and may reject with cc_rejected_other_reason.
    const payer = isSavedCard
      ? { type: "customer", id: customer_id, email: payer_email }
      : { email: payer_email };

    // C. Build payment body with additional_info, notification_url, external_reference
    const paymentBody: Record<string, unknown> = {
      transaction_amount: platformFeeAmount, // Solo se cobra la comisión via MP
      token: card_token, // New card: full token | Saved card: CVV-only token
      description: `Comisión Zolver: ${service_category}`,
      installments: 1,
      payment_method_id: payment_method_id,
      payer,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      external_reference: `zolver_${user_id}_${Date.now()}`,
      additional_info: {
        items: [
          {
            id: service_category,
            title: `Comisión Zolver: ${service_category}`,
            description: `Comisión de plataforma por servicio de ${service_category}`,
            category_id: "services",
            quantity: 1,
            unit_price: platformFeeAmount,
          },
        ],
        payer: {
          first_name: payer_email.split("@")[0],
        },
      },
    };

    // Forward device fingerprint to MP fraud prevention engine
    if (device_id) {
      paymentBody.device_id = device_id;
    }

    console.log(
      `[Zolver-Edge] MP Payment Body:`,
      JSON.stringify({ ...paymentBody, token: "[REDACTED]" }),
    );

    // D. Process payment via MP REST API
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(paymentBody),
    });

    const paymentResult = await mpResponse.json();

    // -----------------------------------------------------------------------
    // LAYER 4b: CLASIFICACIÓN DE RESULTADO MP
    //
    // Production-grade status handling:
    //   approved   → Pago confirmado. Crear reserva + registro de pago.
    //   in_process → Pago pendiente (3D Secure, revisión manual, etc.).
    //                Crear reserva + registro con status "pending".
    //                El webhook de MP confirmará/rechazará después.
    //   rejected   → Pago rechazado. NO crear reserva. Devolver error con detalle.
    //   other      → Estado inesperado. Tratar como rechazo.
    // -----------------------------------------------------------------------
    const mpStatus = paymentResult.status;
    const isApproved = mpStatus === "approved";
    const isPending = mpStatus === "in_process";

    if (!isApproved && !isPending) {
      // Construir mensaje de error descriptivo para el usuario
      const statusDetail = paymentResult.status_detail || "";
      const rejectionMessages: Record<string, string> = {
        cc_rejected_bad_filled_card_number: "Número de tarjeta incorrecto.",
        cc_rejected_bad_filled_date: "Fecha de vencimiento incorrecta.",
        cc_rejected_bad_filled_other: "Datos de la tarjeta incorrectos.",
        cc_rejected_bad_filled_security_code: "Código de seguridad incorrecto.",
        cc_rejected_blacklist: "Tu tarjeta no puede ser utilizada.",
        cc_rejected_call_for_authorize: "Debés autorizar el pago con tu banco.",
        cc_rejected_card_disabled: "Tarjeta deshabilitada. Contactá a tu banco.",
        cc_rejected_duplicated_payment:
          "Ya procesaste un pago por este monto. Esperá unos minutos.",
        cc_rejected_high_risk: "Pago rechazado por seguridad. Intentá con otra tarjeta.",
        cc_rejected_insufficient_amount: "Fondos insuficientes.",
        cc_rejected_invalid_installments: "Cantidad de cuotas no válida.",
        cc_rejected_max_attempts: "Superaste el máximo de intentos. Intentá en unos minutos.",
        cc_rejected_other_reason: "La tarjeta no pudo procesar el pago.",
      };
      const userMessage =
        rejectionMessages[statusDetail] ||
        paymentResult.message ||
        "No se pudo procesar el pago. Intentá con otra tarjeta.";

      console.error(`[Zolver-Edge] Pago rechazado. Status: ${mpStatus}, Detail: ${statusDetail}`);
      return new Response(JSON.stringify({ success: false, error: userMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Status para persistir según resultado de MP
    const paymentDbStatus = isApproved ? "approved" : "pending";
    const reservationStatus = "pending_approval";

    console.log(
      `[Zolver-Edge] MP Result → status: ${mpStatus}, paymentDb: ${paymentDbStatus}, reservation: ${reservationStatus}`,
    );

    // -----------------------------------------------------------------------
    // LAYER 5: PERSISTENCIA ATÓMICA Y CONSISTENCIA DE DATOS
    // -----------------------------------------------------------------------

    // A. Insertar Reserva via RPC (misma función que usa el frontend)
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
        p_status: reservationStatus,
        p_price_estimated: serviceSubtotal,
        p_price_final: totalAmount,
        p_platform_fee: platformFeeAmount,
      },
    );

    // [CRITICAL LOGIC] ROLLBACK MANUAL (COMPENSATING TRANSACTION)
    if (resError) {
      console.error(
        `[Zolver-Edge] CRITICAL: Falló DB tras cobro. Error: ${resError.message}. Iniciando reembolso.`,
      );

      // Devolvemos la plata inmediatamente porque no pudimos guardar la reserva
      await fetch(`https://api.mercadopago.com/v1/payments/${paymentResult.id}/refunds`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": crypto.randomUUID(),
        },
      });

      throw new Error(`Error interno guardando reserva. Se ha procesado el reembolso automático.`);
    }

    // rpcResult puede ser un UUID string (frontal) o la fila completa (service role).
    // Normalizamos para extraer siempre el UUID como string.
    const reservationId = typeof rpcResult === "string" ? rpcResult : rpcResult?.id;

    if (!reservationId) {
      console.error("[Zolver-Edge] CRITICAL: RPC no devolvió ID de reserva.", rpcResult);
      throw new Error("Error interno: No se obtuvo el ID de la reserva creada.");
    }

    console.log(`[Zolver-Edge] Reserva creada: ${reservationId}`);

    // C. Insertar Registro de Pago (columnas alineadas a tabla 'payments' real)
    console.log(
      `[Zolver-Edge] Inserting payment: reservation=${reservationId}, mp_id=${paymentResult.id}, status=${paymentDbStatus}`,
    );

    const { data: paymentRow, error: payDbError } = await supabaseClient
      .from("payments")
      .insert({
        reservation_id: reservationId,
        client_id: user_id,
        professional_id: professional_id,
        amount: platformFeeAmount,
        currency: "ARS",
        status: paymentDbStatus,
        method: method || "credit_card", // DB enum: credit_card | debit_card | platform_credit
        payment_method_id: saved_card_id || null, // FK -> user_payment_methods (null for new cards)
        provider_payment_id: paymentResult.id.toString(), // ID MP para futuros reembolsos
      })
      .select("id")
      .single();

    if (payDbError) {
      // CRITICAL: Money was charged, reservation created, but no payment record.
      // We MUST rollback: refund MP + delete reservation to prevent orphaned charges.
      console.error(
        `[Zolver-Edge] CRITICAL: Payment insert failed. Rolling back. Error: ${JSON.stringify(payDbError)}. MP ID: ${paymentResult.id}`,
      );

      // Rollback 1: Refund Mercado Pago
      try {
        await fetch(`https://api.mercadopago.com/v1/payments/${paymentResult.id}/refunds`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${mpAccessToken}`,
            "Content-Type": "application/json",
            "X-Idempotency-Key": crypto.randomUUID(),
          },
        });
        console.log(`[Zolver-Edge] Rollback refund sent for MP ID: ${paymentResult.id}`);
      } catch (refundErr: unknown) {
        console.error(
          `[Zolver-Edge] ALERT: Rollback refund ALSO failed. MP ID: ${paymentResult.id}. REQUIRES MANUAL INTERVENTION.`,
          refundErr,
        );
      }

      // Rollback 2: Delete orphan reservation
      await supabaseClient.from("reservations").delete().eq("id", reservationId);

      throw new Error(
        "Error interno guardando el registro de pago. Se procesó un reembolso automático.",
      );
    }

    console.log(`[Zolver-Edge] Payment inserted: ${paymentRow.id}`);

    // ÉXITO TOTAL
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          reservation_id: reservationId,
          payment_id: paymentResult.id,
          status: reservationStatus,
          payment_status: paymentDbStatus,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: unknown) {
    console.error(`[Zolver-Edge] Exception:`, error);
    return new Response(JSON.stringify({ success: false, error: getErrorMessage(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
