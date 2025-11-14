// @ts-nocheck

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
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch (_e) {
    return null;
  }
}

// ---------------------------------------------------------
// Main function
// ---------------------------------------------------------
serve(async (req) => {
  console.log("=====================================");
  console.log("📩 NEW REQUEST → /set-user-role");

  try {
    // -----------------------------
    // Leer Authorization (pero NO verificarlo)
    // -----------------------------
    const auth = req.headers.get("Authorization");
    if (!auth) {
      console.log("❌ Missing Authorization header");
      return Response.json({ error: "Missing token" }, { status: 401 });
    }

    const token = auth.replace("Bearer ", "").trim();
    const payload = decodeJwt(token);

    if (!payload) {
      console.log("❌ Invalid JWT format");
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const uid = payload.sub;
    const email = payload.email ?? null;
    const provider = payload.firebase?.sign_in_provider ?? "unknown";

    console.log("👤 UID:", uid);
    console.log("📧 Email:", email);
    console.log("🔌 Provider:", provider);

    // -----------------------------
    // Leer body
    // -----------------------------
    const body = await req.json().catch(() => ({}));
    const role = body.role;

    if (!["client", "professional"].includes(role)) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    const profileComplete = role === "client";

    // ---------------------------------------------------------
    // 1) Buscar o crear user_accounts
    // ---------------------------------------------------------
    const { data: existing, error: findErr } = await supabaseAdmin
      .from("user_accounts")
      .select("*")
      .eq("auth_uid", uid)
      .single();

    let userId;

    if (!existing || findErr) {
      console.log("🆕 Creating new user_accounts entry...");

      const { data: created, error: createErr } = await supabaseAdmin
        .from("user_accounts")
        .insert({
          auth_uid: uid,
          auth_provider: provider,
          email,
          phone: null, // se completa después de Twilio
          role,
          profile_complete: profileComplete,
        })
        .select()
        .single();

      if (createErr) {
        console.log("❌ Error creating user_accounts:", createErr);
        return Response.json({ error: createErr.message }, { status: 500 });
      }

      userId = created.id;
    } else {
      console.log("🧩 Existing user_accounts found");
      userId = existing.id;

      await supabaseAdmin
        .from("user_accounts")
        .update({
          role,
          profile_complete: profileComplete,
        })
        .eq("id", userId);
    }

    // ---------------------------------------------------------
    // 2) Upsert user_roles
    // ---------------------------------------------------------
    await supabaseAdmin.from("user_roles").upsert({
      user_id: userId,
      role,
      profile_complete: profileComplete,
    });

    // ---------------------------------------------------------
    // 3) Insert logs
    // ---------------------------------------------------------
    await supabaseAdmin.from("session_logs").insert({
      user_id: userId,
      auth_provider: provider,
      event_type:
        role === "client"
          ? "role_selected_client"
          : "role_selected_professional",
      metadata: {},
    });

    console.log("✅ ROLE SAVED SUCCESSFULLY");

    return Response.json(
      {
        ok: true,
        role,
        profile_complete: profileComplete,
      },
      { status: 200 }
    );

  } catch (err) {
    console.log("🔥 ERROR:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});
