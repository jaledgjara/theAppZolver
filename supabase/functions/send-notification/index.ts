import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getErrorMessage } from "../_shared/errorUtils.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rateLimit.ts";

// Rate limit: 30 notifications per minute per IP
const RATE_LIMIT = { maxRequests: 30, windowMs: 60_000 };

// ============================================================================
// EDGE FUNCTION: send-notification
// ============================================================================
//
// RESPONSABILIDAD ÚNICA: Recibe un payload de notificación y ejecuta 2 cosas:
//   1. INSERT en la tabla 'notifications' (historial in-app).
//   2. PUSH via Expo Push API al dispositivo del usuario destino.
//
// ¿POR QUÉ VIVE EN EL BACKEND?
//   - Necesita service_role_key para leer el expo_push_token de OTRO usuario.
//   - Necesita hacer fetch a https://exp.host/--/api/v2/push/send (red externa).
//   - Es atómico: si el insert falla, no mandamos push. Si el push falla,
//     el insert ya está (el usuario lo ve en la app cuando abra).
//
// ¿QUIÉN LLAMA A ESTA FUNCIÓN?
//   - El frontend via createNotification() en NotificationCrudService.ts
//   - Potencialmente otras Edge Functions (ej: process-booking-payment
//     podría llamarla internamente después de crear una reserva).
//
// PAYLOAD ESPERADO (body):
//   {
//     user_id: string,       // auth_uid del DESTINATARIO
//     title: string,         // Título del push y de la notificación
//     body: string,          // Cuerpo/descripción
//     type: string,          // Tipo de notificación (reservation_new, etc.)
//     data?: object          // JSONB con info extra (screen, reservation_id, etc.)
//   }
//
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS Preflight
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
    // ------------------------------------------------------------------
    // 1. INICIALIZACIÓN
    // ------------------------------------------------------------------
    // Usamos service_role_key para bypass RLS.
    // Esto nos permite:
    //   a) Insertar en 'notifications' sin policy.
    //   b) Leer el expo_push_token de user_accounts de cualquier usuario.
    // ------------------------------------------------------------------
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // ------------------------------------------------------------------
    // 2. PARSEAR Y VALIDAR PAYLOAD
    // ------------------------------------------------------------------
    const { user_id, title, body, type, data } = await req.json();

    if (!user_id || !title || !body || !type) {
      return Response.json(
        { success: false, error: "Faltan campos requeridos: user_id, title, body, type." },
        { status: 400, headers: corsHeaders },
      );
    }

    console.log(`📨 [send-notification] Para: ${user_id} | Tipo: ${type}`);

    // ------------------------------------------------------------------
    // 3. INSERT EN TABLA 'notifications'
    // ------------------------------------------------------------------
    // Esto crea el registro en el historial in-app.
    // El usuario lo verá cuando abra la pantalla de notificaciones.
    // ------------------------------------------------------------------
    const { error: insertError } = await supabaseAdmin.from("notifications").insert({
      user_id,
      title,
      body,
      type,
      data: data ?? {},
      is_read: false,
    });

    if (insertError) {
      console.error("❌ [send-notification] Error INSERT:", insertError.message);
      return Response.json(
        { success: false, error: insertError.message },
        { status: 500, headers: corsHeaders },
      );
    }

    console.log("✅ [send-notification] Notificación guardada en DB.");

    // ------------------------------------------------------------------
    // 4. OBTENER EL PUSH TOKEN DEL DESTINATARIO
    // ------------------------------------------------------------------
    // Leemos de user_accounts la columna expo_push_token.
    // Si el usuario no tiene token (rechazó permisos, usa web, etc.),
    // no enviamos push pero la notificación YA quedó en la tabla.
    // ------------------------------------------------------------------
    const { data: userAccount, error: tokenError } = await supabaseAdmin
      .from("user_accounts")
      .select("expo_push_token")
      .eq("auth_uid", user_id)
      .single();

    if (tokenError) {
      console.warn("⚠️ [send-notification] No se pudo leer token:", tokenError.message);
      // No es error fatal: la notificación ya se guardó en la tabla.
      return Response.json(
        { success: true, push_sent: false, reason: "Token no encontrado." },
        { status: 200, headers: corsHeaders },
      );
    }

    const pushToken = userAccount?.expo_push_token;

    if (!pushToken) {
      console.log("⚠️ [send-notification] Usuario sin push token. Solo se guardó en DB.");
      return Response.json(
        { success: true, push_sent: false, reason: "Usuario sin push token." },
        { status: 200, headers: corsHeaders },
      );
    }

    // ------------------------------------------------------------------
    // 5. ENVIAR PUSH VIA EXPO PUSH API
    // ------------------------------------------------------------------
    // Expo provee un endpoint HTTP para enviar pushes.
    // No necesitamos SDK, solo un fetch con el formato correcto.
    //
    // Documentación: https://docs.expo.dev/push-notifications/sending-notifications/
    //
    // El campo 'data' se pasa al listener del frontend (responseSubscription)
    // y es lo que usamos para navegar a la pantalla correcta.
    // ------------------------------------------------------------------
    const pushPayload = {
      to: pushToken,
      sound: "default",
      title,
      body,
      data: data ?? {},
    };

    console.log("🚀 [send-notification] Enviando push a:", pushToken);

    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pushPayload),
    });

    const pushResult = await pushResponse.json();

    if (pushResult.data?.status === "error") {
      console.warn("⚠️ [send-notification] Expo Push Error:", pushResult.data.message);
      // No es error fatal. La notificación ya está en la tabla.
      return Response.json(
        { success: true, push_sent: false, reason: pushResult.data.message },
        { status: 200, headers: corsHeaders },
      );
    }

    console.log("✅ [send-notification] Push enviado exitosamente.");

    return Response.json({ success: true, push_sent: true }, { status: 200, headers: corsHeaders });
  } catch (err: unknown) {
    console.error("[send-notification] Error fatal:", getErrorMessage(err));
    return Response.json(
      { success: false, error: getErrorMessage(err) },
      { status: 500, headers: corsHeaders },
    );
  }
});
