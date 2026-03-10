// UBICACIÓN: supabase/functions/save-payment-method/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseJWT } from "../_shared/verifySupabaseJWT.ts";
import { getErrorMessage } from "../_shared/errorUtils.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rateLimit.ts";
import { isValidEmail, isValidDNI, validationError } from "../_shared/validate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 10 requests per minute per IP
const RATE_LIMIT = { maxRequests: 10, windowMs: 60_000 };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Rate limiting
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip, RATE_LIMIT);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.retryAfterMs, corsHeaders);
  }

  try {
    // Verify Firebase JWT
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
    console.log("[save-payment-method] Payload received");

    const { user_id, token, email, dni } = body;

    // Input validation
    if (!isValidEmail(email)) {
      return validationError("Invalid email format", corsHeaders);
    }
    if (dni && !isValidDNI(dni)) {
      return validationError("Invalid DNI format (expected 7-8 digits)", corsHeaders);
    }
    if (!token || typeof token !== "string") {
      return validationError("Missing or invalid card token", corsHeaders);
    }

    // Verify user_id matches the authenticated user
    if (user_id !== verifiedUid) {
      console.error(`[save-payment-method] user_id mismatch: body=${user_id}, jwt=${verifiedUid}`);
      return new Response(
        JSON.stringify({ success: false, error: "user_id does not match authenticated user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 },
      );
    }

    // 1. GESTIÓN DE CUSTOMER (Reuse existing → Search MP → Create new)
    let customerId;
    console.log(`[save-payment-method] Buscando Customer para: ${email}`);

    // First: check if this user already has a saved card with a customer_id (most reliable)
    const { data: existingCard } = await supabase
      .from("user_payment_methods")
      .select("provider_customer_id")
      .eq("user_id", user_id)
      .not("provider_customer_id", "is", null)
      .limit(1)
      .maybeSingle();

    if (existingCard?.provider_customer_id) {
      customerId = existingCard.provider_customer_id;
      console.log(`[save-payment-method] Reusing existing customer: ${customerId}`);
    } else {
      // Search MP by email
      const searchRes = await fetch(
        `https://api.mercadopago.com/v1/customers/search?email=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${mpAccessToken}` } },
      );
      const searchData = await searchRes.json();

      if (searchData.results?.length === 1) {
        // Exactly one match — safe to use
        customerId = searchData.results[0].id;
        console.log(`[save-payment-method] Customer encontrado (1 match): ${customerId}`);
      } else if (searchData.results?.length > 1) {
        // Multiple matches — pick the most recent to avoid stale/test customers
        const sorted = searchData.results.sort(
          (a: { date_created: string }, b: { date_created: string }) =>
            new Date(b.date_created).getTime() - new Date(a.date_created).getTime(),
        );
        customerId = sorted[0].id;
        console.warn(
          `[save-payment-method] Multiple customers (${searchData.results.length}) for ${email}. Using most recent: ${customerId}`,
        );
      } else {
        // No match — create new customer
        console.log(`[save-payment-method] Creando Customer nuevo...`);
        const createRes = await fetch("https://api.mercadopago.com/v1/customers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mpAccessToken}`,
          },
          body: JSON.stringify({ email }),
        });
        const newCust = await createRes.json();
        customerId = newCust.id;
        console.log(`[save-payment-method] Nuevo Customer ID: ${customerId}`);
      }
    }

    // 2. GUARDADO DE TARJETA (ESTRATEGIA "TOKEN-ONLY")
    // Como el frontend ya inyectó el issuer/brand en el token, aquí solo enviamos el token.
    console.log(`📤 [Backend] Guardando tarjeta en MP...`);

    const saveRes = await fetch(`https://api.mercadopago.com/v1/customers/${customerId}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify({ token: token }), // <--- SOLO TOKEN
    });

    const cardData = await saveRes.json();

    if (!saveRes.ok) {
      console.error("🛑 [Error MP]:", JSON.stringify(cardData));
      throw new Error(cardData.message || "Mercado Pago rechazó la tarjeta");
    }

    console.log("✅ [Backend] Tarjeta guardada en MP:", cardData.id);

    // 3. BASE DE DATOS SUPABASE
    console.log("💾 [Backend] Guardando en DB...");
    const { data, error } = await supabase
      .from("user_payment_methods")
      .insert({
        user_id,
        provider_card_id: cardData.id,
        provider_customer_id: customerId,
        brand: cardData.payment_method.id, // MP nos confirma la marca real aquí
        last_four_digits: cardData.last_four_digits,
        identification_number: dni,
        expiry_month: cardData.expiration_month,
        expiry_year: cardData.expiration_year,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      console.error("🛑 Error Supabase:", error);
      throw error;
    }

    console.log("🎉 [Backend] Éxito Total.");

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("[Backend Exception]:", getErrorMessage(error));
    return new Response(JSON.stringify({ success: false, error: getErrorMessage(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
