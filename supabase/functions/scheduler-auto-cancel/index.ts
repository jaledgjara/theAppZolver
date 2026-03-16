import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getErrorMessage } from "../_shared/errorUtils.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rateLimit.ts";

// Rate limit: 5 requests per minute per IP (defense in depth)
const RATE_LIMIT = { maxRequests: 5, windowMs: 60_000 };

serve(async (req) => {
  // Rate limiting
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip, RATE_LIMIT);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.retryAfterMs, { "Content-Type": "application/json" });
  }

  // Verify CRON_SECRET — only scheduled invocations should call this
  const CRON_SECRET = Deno.env.get("CRON_SECRET");
  if (!CRON_SECRET) {
    console.error("[scheduler-auto-cancel] CRON_SECRET not configured");
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Cliente Admin (Service Role necesario para leer todo y cancelar)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 2. Definir el límite de tiempo (ej: 30 minutos atrás)
    const timeLimit = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    // 3. Buscar reservas expiradas
    // Estado 'pending_approval' Y creadas antes del límite
    const { data: expiredReservations, error: findError } = await supabase
      .from("reservations")
      .select("id")
      .eq("status", "pending_approval")
      .lt("created_at", timeLimit);

    if (findError) throw new Error(findError.message);

    console.log(`[Cron-Cleanup] Encontradas ${expiredReservations.length} reservas expiradas.`);

    if (expiredReservations.length === 0) {
      return new Response("No expired reservations.", { status: 200 });
    }

    // 4. Procesar cancelaciones en batch
    const results = [];

    for (const res of expiredReservations) {
      // LLAMAMOS INTERNAMENTE A LA FUNCIÓN DE CANCELACIÓN QUE YA CREAMOS
      // Esto reutiliza la lógica de reembolso de MercadoPago y actualización de DB
      const { data, error } = await supabase.functions.invoke("cancel-reservation-refund", {
        body: {
          reservation_id: res.id,
          reason: "Tiempo de espera agotado (Auto-Timeout)",
          triggered_by: "system_timeout",
        },
      });
      results.push({ id: res.id, success: !error });
    }

    return new Response(JSON.stringify({ processed: results }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: getErrorMessage(error) }), {
      status: 500,
    });
  }
});
