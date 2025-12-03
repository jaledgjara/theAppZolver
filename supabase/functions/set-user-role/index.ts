// @ts-nocheck
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------
// Supabase Admin
// ---------------------------------------------------------
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

console.log("🚀 Booting /set-user-role (NO JWT verification)");

// ---------------------------------------------------------
// Solo decodificar el payload (sin verificar firma)
// ---------------------------------------------------------
function decodeJwt(token: string) {
  try {
    const [h, p] = token.split(".");
    return JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
  } catch (_e) {
    return null;
  }
}

serve(async (req) => {
  console.log("=====================================");
  console.log("📩 NEW REQUEST → /set-user-role");

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return Response.json({ error: "Missing token" }, { status: 401 });
    }

    const token = auth.replace("Bearer ", "").trim();
    const payload = decodeJwt(token);

    if (!payload) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const uid = payload.sub;
    const email = payload.email ?? null;
    const provider = payload.firebase?.sign_in_provider ?? "unknown";

    console.log("👤 UID:", uid);
    console.log("📧 Email:", email);
    console.log("🔌 Provider:", provider);

    // Read body
    const body = await req.json().catch(() => ({}));

    const role = body.role;
    const phone = body.phone ?? null;

    if (!["client", "professional"].includes(role)) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    const profileComplete = role === "client";

    // --------------------------------------------
    // UPSERT user_accounts
    // --------------------------------------------
    const { data: existing } = await supabaseAdmin
      .from("user_accounts")
      .select("*")
      .eq("auth_uid", uid)
      .maybeSingle();

    let row;

    if (!existing) {
      console.log("🆕 Creating new user_accounts row 🔽");

      const { data, error } = await supabaseAdmin
        .from("user_accounts")
        .insert({
          auth_uid: uid,
          email,
          auth_provider: provider,
          phone,
          role,
          profile_complete: profileComplete,
        })
        .select()
        .single();

      if (error) throw error;
      row = data;
    } else {
      console.log("🧩 Updating existing user_accounts row 🔽");

      const { data, error } = await supabaseAdmin
        .from("user_accounts")
        .update({
          phone,
          role,
          profile_complete: profileComplete,
        })
        .eq("auth_uid", uid)
        .select()
        .single();

      if (error) throw error;
      row = data;
    }

    console.log("✅ USER ROLE + PHONE SAVED:", row);

    return Response.json(
      {
        ok: true,
        uid: row.auth_uid,
        phone: row.phone,
        role: row.role,
        profile_complete: row.profile_complete,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.log("🔥 ERROR:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
