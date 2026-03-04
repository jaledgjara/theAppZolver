// @ts-nocheck
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseJWT } from "../_shared/verifySupabaseJWT.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return Response.json(
        { error: "Missing token" },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    let payload;
    try {
      payload = await verifySupabaseJWT(token);
    } catch (e) {
      return Response.json(
        { error: "Invalid token" },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const uid = payload.firebase_uid;

    const body = await req.json().catch(() => ({}));
    const legalName = body.legal_name;

    if (!legalName || typeof legalName !== "string" || !legalName.trim()) {
      return Response.json(
        { error: "legal_name is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    console.log(`✍️ [update-user-identity] UID: ${uid} | Name: ${legalName}`);

    // Upsert: create if not exists, update if exists
    const { data: existing } = await supabaseAdmin
      .from("user_accounts")
      .select("auth_uid")
      .eq("auth_uid", uid)
      .maybeSingle();

    let row;

    if (!existing) {
      // User record doesn't exist yet — create with minimal data
      const email = payload.email ?? null;
      const provider = "firebase";

      const { data, error } = await supabaseAdmin
        .from("user_accounts")
        .insert({
          auth_uid: uid,
          email,
          auth_provider: provider,
          legal_name: legalName.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      row = data;
    } else {
      // Update only legal_name — no role change, no trigger fired
      const { data, error } = await supabaseAdmin
        .from("user_accounts")
        .update({ legal_name: legalName.trim() })
        .eq("auth_uid", uid)
        .select()
        .single();

      if (error) throw error;
      row = data;
    }

    console.log(`✅ [update-user-identity] Done for ${uid}`);
    return Response.json({ ok: true, ...row }, { status: 200, headers: CORS_HEADERS });
  } catch (err: any) {
    console.error("🔥 [update-user-identity] ERROR:", err.message);
    return Response.json(
      { error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
});
