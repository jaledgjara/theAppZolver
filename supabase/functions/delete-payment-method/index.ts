import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseJWT } from "../_shared/verifySupabaseJWT.ts";
import { getErrorMessage } from "../_shared/errorUtils.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { fetchWithTimeout } from "../_shared/fetchWithTimeout.ts";

// Rate limit: 10 requests per minute per IP
const RATE_LIMIT = { maxRequests: 10, windowMs: 60_000 };

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
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
    // 1. Verify JWT
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");

    const body = await req.json();
    const { card_id } = body;

    if (!card_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required field: card_id" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // 2. Fetch card details + verify ownership (service role bypasses RLS)
    const { data: card, error: fetchError } = await supabase
      .from("user_payment_methods")
      .select("user_id, provider_customer_id, provider_card_id")
      .eq("id", card_id)
      .single();

    if (fetchError || !card) {
      return new Response(JSON.stringify({ success: false, error: "Tarjeta no encontrada." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (card.user_id !== verifiedUid) {
      console.error(
        `[delete-payment-method] Ownership mismatch: card.user_id=${card.user_id}, jwt=${verifiedUid}`,
      );
      return new Response(
        JSON.stringify({ success: false, error: "No tenés permiso para eliminar esta tarjeta." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 },
      );
    }

    const { provider_customer_id, provider_card_id } = card;

    // 3. Delete from Mercado Pago
    console.log(
      `[delete-payment-method] Deleting card ${provider_card_id} from MP customer ${provider_customer_id}`,
    );
    const mpRes = await fetchWithTimeout(
      `https://api.mercadopago.com/v1/customers/${provider_customer_id}/cards/${provider_card_id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      },
      15000,
    );

    if (!mpRes.ok) {
      const mpError = await mpRes.json().catch(() => ({}));
      console.error("[delete-payment-method] MP delete failed:", JSON.stringify(mpError));
      // Continue with DB deletion even if MP fails (card may already be deleted on MP side)
    }

    // 4. Delete from Supabase
    const { error: deleteError } = await supabase
      .from("user_payment_methods")
      .delete()
      .eq("id", card_id);

    if (deleteError) {
      console.error("[delete-payment-method] DB delete error:", deleteError.message);
      throw new Error("No se pudo eliminar la tarjeta de la base de datos.");
    }

    console.log(`[delete-payment-method] Card ${card_id} deleted successfully.`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("[delete-payment-method] Exception:", getErrorMessage(error));
    return new Response(JSON.stringify({ success: false, error: getErrorMessage(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
