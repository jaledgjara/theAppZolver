// @ts-nocheck
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

function decodeJwt(token: string) {
  try {
    const [h, p] = token.split(".");
    return JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  } catch (_e) {
    return null;
  }
}

serve(async (req) => {
  try {
    const auth = req.headers.get("Authorization");
    if (!auth)
      return Response.json({ error: "Missing token" }, { status: 401 });

    const token = auth.replace("Bearer ", "").trim();
    const payload = decodeJwt(token);
    if (!payload)
      return Response.json({ error: "Invalid token" }, { status: 401 });

    const uid = payload.sub;
    const email = payload.email ?? null;
    const provider = payload.firebase?.sign_in_provider ?? "unknown";

    // LEEMOS EL BODY
    const body = await req.json().catch(() => ({}));
    const role = body.role;
    const phone = body.phone ?? null;
    const legal_name = body.legal_name ?? null; // 👈 RECIBIMOS EL NOMBRE

    console.log(`👤 Processing: ${uid} | Name: ${legal_name}`);

    if (!["client", "professional"].includes(role)) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    const profileComplete = role === "client";

    // BUSCAMOS SI YA EXISTE
    const { data: existing } = await supabaseAdmin
      .from("user_accounts")
      .select("*")
      .eq("auth_uid", uid)
      .maybeSingle();

    let row;

    if (!existing) {
      // CREAR NUEVO USUARIO
      const { data, error } = await supabaseAdmin
        .from("user_accounts")
        .insert({
          auth_uid: uid,
          email,
          auth_provider: provider,
          phone,
          role,
          profile_complete: profileComplete,
          legal_name, // 👈 GUARDAMOS EL NOMBRE
        })
        .select()
        .single();

      if (error) throw error;
      row = data;
    } else {
      // ACTUALIZAR EXISTENTE
      let finalRole = role;
      if (existing.role === "professional") finalRole = "professional";

      const updateData: any = {
        phone,
        role: finalRole,
        profile_complete: existing.profile_complete || profileComplete,
      };

      // Solo actualizamos el nombre si no existía antes o si viene uno nuevo válido
      if (legal_name) {
        updateData.legal_name = legal_name;
      }

      const { data, error } = await supabaseAdmin
        .from("user_accounts")
        .update(updateData)
        .eq("auth_uid", uid)
        .select()
        .single();

      if (error) throw error;
      row = data;
    }

    return Response.json({ ok: true, ...row }, { status: 200 });
  } catch (err: any) {
    console.log("🔥 ERROR:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
