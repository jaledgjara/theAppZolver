import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyFirebaseJWT } from "../_shared/verifyFirebaseJWT.ts";
import { getErrorMessage } from "../_shared/errorUtils.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// Rate limit: 10 requests per minute per IP
const RATE_LIMIT = { maxRequests: 10, windowMs: 60_000 };

// Input length limits
const MAX_BIOGRAPHY_LENGTH = 2000;
const MAX_SPECIALIZATION_LENGTH = 200;
const MAX_PORTFOLIO_URLS = 20;
const MAX_URL_LENGTH = 2048;

// Clientes
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

serve(async (req: Request) => {
  // Manejo de CORS
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
    // 1. Validar Token (verificación criptográfica)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Auth Header");

    const token = authHeader.replace("Bearer ", "").trim();
    const payload = await verifyFirebaseJWT(token);
    const userId = payload.sub;

    // 2. Obtener datos
    const body = await req.json();
    const { profileData, portfolioUrls, docFrontUrl, docBackUrl } = body;

    console.log(`[save-profile] Guardando perfil para: ${userId}`);

    // 2b. Input length validation
    if (
      profileData.biography &&
      typeof profileData.biography === "string" &&
      profileData.biography.length > MAX_BIOGRAPHY_LENGTH
    ) {
      return new Response(
        JSON.stringify({
          error: `La biografía no puede superar ${MAX_BIOGRAPHY_LENGTH} caracteres.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }
    if (
      profileData.specialization &&
      typeof profileData.specialization === "string" &&
      profileData.specialization.length > MAX_SPECIALIZATION_LENGTH
    ) {
      return new Response(
        JSON.stringify({
          error: `La especialización no puede superar ${MAX_SPECIALIZATION_LENGTH} caracteres.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }
    if (Array.isArray(portfolioUrls)) {
      if (portfolioUrls.length > MAX_PORTFOLIO_URLS) {
        return new Response(
          JSON.stringify({ error: `Máximo ${MAX_PORTFOLIO_URLS} URLs de portfolio.` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        );
      }
      for (const url of portfolioUrls) {
        if (typeof url !== "string" || url.length > MAX_URL_LENGTH) {
          return new Response(JSON.stringify({ error: "URL de portfolio inválida." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }
      }
    }

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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: unknown) {
    console.error("Error saving profile:", err);
    const errMsg = getErrorMessage(err);
    const isAuthError =
      errMsg.includes("JWT") || errMsg.includes("signature") || errMsg.includes("audience");
    return new Response(JSON.stringify({ error: errMsg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isAuthError ? 401 : 500,
    });
  }
});
