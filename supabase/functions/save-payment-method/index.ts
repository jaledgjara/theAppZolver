// @ts-nocheck
// UBICACIÓN: supabase/functions/save-payment-method/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseJWT } from "../_shared/verifySupabaseJWT.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    // Verify Firebase JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }
    const jwtToken = authHeader.replace("Bearer ", "").trim();
    const jwtPayload = await verifySupabaseJWT(jwtToken);
    const verifiedUid = jwtPayload.firebase_uid;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");

    // [DEBUG] Ver qué llega
    const body = await req.json();
    console.log("📍 [Backend] Payload Recibido:", JSON.stringify(body));

    const { user_id, token, email, dni } = body;

    // Verify user_id matches the authenticated user
    if (user_id !== verifiedUid) {
      console.error(`[save-payment-method] user_id mismatch: body=${user_id}, jwt=${verifiedUid}`);
      return new Response(
        JSON.stringify({ success: false, error: "user_id does not match authenticated user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // 1. GESTIÓN DE CUSTOMER (Buscar o Crear)
    let customerId;
    console.log(`🔎 [Backend] Buscando Customer: ${email}`);

    const searchRes = await fetch(
      `https://api.mercadopago.com/v1/customers/search?email=${email}`,
      { headers: { Authorization: `Bearer ${mpAccessToken}` } }
    );
    const searchData = await searchRes.json();

    if (searchData.results?.[0]) {
      customerId = searchData.results[0].id;
      console.log(`✅ Customer encontrado: ${customerId}`);
    } else {
      console.log(`🆕 Creando Customer nuevo...`);
      const createRes = await fetch(
        "https://api.mercadopago.com/v1/customers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mpAccessToken}`,
          },
          body: JSON.stringify({ email }),
        }
      );
      const newCust = await createRes.json();
      customerId = newCust.id;
      console.log(`✅ Nuevo Customer ID: ${customerId}`);
    }

    // 2. GUARDADO DE TARJETA (ESTRATEGIA "TOKEN-ONLY")
    // Como el frontend ya inyectó el issuer/brand en el token, aquí solo enviamos el token.
    console.log(`📤 [Backend] Guardando tarjeta en MP...`);

    const saveRes = await fetch(
      `https://api.mercadopago.com/v1/customers/${customerId}/cards`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mpAccessToken}`,
        },
        body: JSON.stringify({ token: token }), // <--- SOLO TOKEN
      }
    );

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
  } catch (error) {
    console.error("💥 [Backend Exception]:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
