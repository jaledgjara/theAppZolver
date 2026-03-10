import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseJWT } from "../_shared/verifySupabaseJWT.ts";
import { getErrorMessage } from "../_shared/errorUtils.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rateLimit.ts";

// Rate limit: 10 requests per minute per IP
const RATE_LIMIT = { maxRequests: 10, windowMs: 60_000 };

// Clientes
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

serve(async (req: Request) => {
  // Manejo de CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  // Rate limiting
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip, RATE_LIMIT);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.retryAfterMs, { "Access-Control-Allow-Origin": "*" });
  }

  try {
    // 1. Validar Token (verificación criptográfica)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Auth Header");

    const token = authHeader.replace("Bearer ", "").trim();
    const payload = await verifySupabaseJWT(token);
    const userId = payload.firebase_uid;

    // 2. Obtener datos
    const body = await req.json();
    const { profileData, portfolioUrls, docFrontUrl, docBackUrl } = body;

    console.log(`[save-profile] Guardando perfil para: ${userId}`);

    // 3. Payload DB
    const dbPayload = {
      user_id: userId,
      doc_front_url: docFrontUrl,
      doc_back_url: docBackUrl,
      identity_status: "pending",
      main_category_id: profileData.category?.id || null,
      specialization_title: profileData.specialization,
      enrollment_number: profileData.licenseNumber,
      biography: profileData.biography,
      portfolio_urls: portfolioUrls,
      type_work: profileData.typeWork || "quote",
      // Ubicación
      base_lat: profileData.location?.latitude || 0,
      base_lng: profileData.location?.longitude || 0,
      coverage_radius_km: profileData.radiusKm,
      financial_info: { cbu_alias: profileData.cbuAlias },
      is_active: false,
      updated_at: new Date(),
    };

    // 4. Upsert (on conflict with user_id primary key)
    const { data, error } = await supabaseAdmin
      .from("professional_profiles")
      .upsert(dbPayload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw error;

    // 4b. Save custom prices for Zolver Ya (instant/hybrid mode)
    const customPrices = profileData.customPrices as Record<string, string> | undefined;
    if (customPrices && Object.keys(customPrices).length > 0) {
      const priceRows = Object.entries(customPrices)
        .filter(([_, val]) => val && Number(val) > 0)
        .map(([templateId, price]) => ({
          professional_id: userId,
          template_id: templateId,
          custom_price: Number(price),
          is_active: true,
          updated_at: new Date().toISOString(),
        }));

      if (priceRows.length > 0) {
        console.log(`[save-profile] Saving ${priceRows.length} custom prices`);
        const { error: pricesError } = await supabaseAdmin
          .from("professional_service_prices")
          .upsert(priceRows, { onConflict: "professional_id,template_id" });

        if (pricesError) {
          console.error("[save-profile] Error saving prices:", pricesError.message);
          // Non-fatal: profile was saved, prices can be set later from settings
        }
      }
    }

    // 5. Update Flag
    await supabaseAdmin
      .from("user_accounts")
      .update({ profile_complete: true })
      .eq("auth_uid", userId);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  } catch (err: unknown) {
    console.error("Error saving profile:", err);
    const errMsg = getErrorMessage(err);
    const isAuthError =
      errMsg.includes("JWT") || errMsg.includes("signature") || errMsg.includes("audience");
    return new Response(JSON.stringify({ error: errMsg }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: isAuthError ? 401 : 500,
    });
  }
});
