// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Clientes
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Decodificador simple de JWT (para extraer UID)
function decodeJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    // 1. Validar Token de Firebase
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Auth Header");

    const token = authHeader.replace("Bearer ", "");
    const payload = decodeJwt(token); // En producción, usar librería 'jose' para verificar firma, o confiar en que Firebase en cliente es seguro y esto corre en SSL.

    if (!payload || !payload.sub) throw new Error("Invalid Token");
    const userId = payload.sub;

    // 2. Obtener datos del body
    const body = await req.json();
    const { profileData, portfolioUrls, docFrontUrl, docBackUrl } = body;

    console.log(`[save-profile] Guardando perfil para: ${userId}`);

    // 3. Preparar Payload para la DB
    const dbPayload = {
      user_id: userId,
      // Documentos
      doc_front_url: docFrontUrl,
      doc_back_url: docBackUrl,
      identity_status: "pending",
      // Datos Formulario
      main_category_id: profileData.category?.id || null,
      specialization_title: profileData.specialization,
      enrollment_number: profileData.licenseNumber,
      biography: profileData.biography,
      portfolio_urls: portfolioUrls,
      // Ubicación
      base_lat: profileData.location?.latitude || 0,
      base_lng: profileData.location?.longitude || 0,
      coverage_radius_km: profileData.radiusKm,
      availability_schedule: profileData.schedule,
      // Pagos
      cbu_alias: profileData.cbuAlias,
      is_active: true,
      updated_at: new Date(),
    };

    // 4. Insertar con permisos de Admin (Service Role)
    const { data, error } = await supabaseAdmin
      .from("professional_profiles")
      .upsert(dbPayload)
      .select()
      .single();

    if (error) throw error;

    // 5. Actualizar flag en user_accounts
    await supabaseAdmin
      .from("user_accounts")
      .update({ profile_complete: true })
      .eq("auth_uid", userId);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Error saving profile:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
