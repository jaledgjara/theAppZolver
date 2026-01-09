// @ts-nocheck
// path: supabase/functions/save-payment-method/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Manejo de CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Configuración "Admin Mode" (Sin headers de usuario para saltar RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN");

    // Parseamos el body
    const { user_id, token, email, dni } = await req.json();

    if (!token || !user_id || !email) {
      throw new Error("Faltan datos obligatorios (token, user_id, email).");
    }

    console.log(`[SaveCard] 1. Iniciando proceso para: ${email}`);

    // 2. Lógica de Cliente MercadoPago (Customer)
    // Buscamos si ya tiene customer_id en nuestra DB
    const { data: existingUser } = await supabase
      .from("user_payment_methods")
      .select("provider_customer_id")
      .eq("user_id", user_id)
      .limit(1)
      .maybeSingle(); // Usamos maybeSingle para evitar errores si está vacío

    let customerId = existingUser?.provider_customer_id;

    // Si no tiene, buscamos/creamos en MercadoPago
    if (!customerId) {
      console.log(`[SaveCard] 2. Buscando Customer en MP...`);
      const searchRes = await fetch(
        `https://api.mercadopago.com/v1/customers/search?email=${email}`,
        {
          headers: { Authorization: `Bearer ${mpAccessToken}` },
        }
      );

      const searchData = await searchRes.json();

      if (searchData.results && searchData.results.length > 0) {
        customerId = searchData.results[0].id;
        console.log(`[SaveCard] Customer encontrado: ${customerId}`);
      } else {
        console.log(`[SaveCard] 2b. Creando Customer MP nuevo...`);
        const createRes = await fetch(
          "https://api.mercadopago.com/v1/customers",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${mpAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: email }),
          }
        );
        const createData = await createRes.json();
        if (!createData.id) throw new Error("Fallo al crear Customer en MP");
        customerId = createData.id;
      }
    }

    // 3. Guardar la Tarjeta (Token -> Card)
    console.log(`[SaveCard] 3. Guardando tarjeta en Customer ${customerId}`);
    const saveCardRes = await fetch(
      `https://api.mercadopago.com/v1/customers/${customerId}/cards`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: token }),
      }
    );

    const cardData = await saveCardRes.json();

    if (!saveCardRes.ok) {
      // Manejo detallado de errores de MP
      console.error("Error MP Save Card:", JSON.stringify(cardData));
      throw new Error(
        cardData.message || "La tarjeta fue rechazada por Mercado Pago."
      );
    }

    // 4. Persistir en Supabase
    console.log(`[SaveCard] 4. Guardando en DB...`);
    const payload = {
      user_id: user_id,
      provider_card_id: cardData.id,
      provider_customer_id: customerId,
      brand: cardData.payment_method.id,
      last_four_digits: cardData.last_four_digits,
      identification_number: dni || null, // Aseguramos que no sea undefined
      expiry_month: cardData.expiration_month,
      expiry_year: cardData.expiration_year,
      is_default: false,
    };

    const { data: savedRecord, error: dbError } = await supabase
      .from("user_payment_methods")
      .insert(payload)
      .select()
      .single();

    if (dbError) {
      console.error("🛑 Error DB Insert:", dbError);
      throw new Error(`Error base de datos: ${dbError.message}`);
    }

    console.log("[SaveCard] ✅ Éxito.");

    return new Response(JSON.stringify({ success: true, data: savedRecord }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(`[SaveCard] Excepción:`, error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
