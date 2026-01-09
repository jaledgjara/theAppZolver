// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // 1. Cliente Admin (Service Role necesario para leer todo y cancelar)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Definir el límite de tiempo (ej: 30 minutos atrás)
    const timeLimit = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // 3. Buscar reservas expiradas
    // Estado 'pending_approval' Y creadas antes del límite
    const { data: expiredReservations, error: findError } = await supabase
      .from("reservations")
      .select("id")
      .eq("status", "pending_approval")
      .lt("created_at", timeLimit);

    if (findError) throw new Error(findError.message);

    console.log(
      `[Cron-Cleanup] Encontradas ${expiredReservations.length} reservas expiradas.`
    );

    if (expiredReservations.length === 0) {
      return new Response("No expired reservations.", { status: 200 });
    }

    // 4. Procesar cancelaciones en batch
    const results = [];

    for (const res of expiredReservations) {
      // LLAMAMOS INTERNAMENTE A LA FUNCIÓN DE CANCELACIÓN QUE YA CREAMOS
      // Esto reutiliza la lógica de reembolso de MercadoPago y actualización de DB
      const { data, error } = await supabase.functions.invoke(
        "cancel-reservation-refund",
        {
          body: {
            reservation_id: res.id,
            reason: "Tiempo de espera agotado (Auto-Timeout)",
            triggered_by: "system_timeout",
          },
        }
      );
      results.push({ id: res.id, success: !error });
    }

    return new Response(JSON.stringify({ processed: results }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
