// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseJWT } from "../_shared/verifySupabaseJWT.ts";

// Clientes
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req: Request) => {
  // Manejo de CORS (Opcional si lo maneja Supabase, pero recomendado)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
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
  } catch (err: any) {
    console.error("Error saving profile:", err);
    const isAuthError = err.message?.includes("JWT") || err.message?.includes("signature") || err.message?.includes("audience");
    return new Response(JSON.stringify({ error: err.message }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: isAuthError ? 401 : 500,
    });
  }
});
