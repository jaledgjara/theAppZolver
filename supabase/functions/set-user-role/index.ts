import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifySupabaseJWT } from "../_shared/verifySupabaseJWT.ts";
import { getErrorMessage } from "../_shared/errorUtils.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rateLimit.ts";
import { isValidRole, isValidString } from "../_shared/validate.ts";

// Rate limit: 10 requests per minute per IP
const RATE_LIMIT = { maxRequests: 10, windowMs: 60_000 };

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

serve(async (req) => {
  // Rate limiting
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip, RATE_LIMIT);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.retryAfterMs, {});
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return Response.json({ error: "Missing token" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "").trim();
    let payload;
    try {
      payload = await verifySupabaseJWT(token);
    } catch {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const uid = payload.firebase_uid;
    const email = payload.email ?? null;
    const provider = "firebase";

    // LEEMOS EL BODY
    const body = await req.json().catch(() => ({}));
    const role = body.role;
    const phone = body.phone ?? null;
    const legal_name = body.legal_name ?? null;

    console.log(`Processing: ${uid} | Name: ${legal_name}`);

    // Input validation
    if (!isValidRole(role)) {
      return Response.json({ error: "Invalid role" }, { status: 400 });
    }

    if (legal_name !== null && !isValidString(legal_name, 100)) {
      return Response.json({ error: "Invalid name: must be 1-100 characters" }, { status: 400 });
    }

    if (phone !== null && typeof phone === "string" && phone.length > 20) {
      return Response.json({ error: "Invalid phone format" }, { status: 400 });
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

      // Si cambia de client a professional, resetear profile_complete
      const isNewProfessional = existing.role !== "professional" && role === "professional";
      const finalProfileComplete = isNewProfessional
        ? false
        : existing.profile_complete || profileComplete;

      const updateData: Record<string, unknown> = {
        phone,
        role: finalRole,
        profile_complete: finalProfileComplete,
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

    // Fetch identity_status from professional_profiles if professional
    let identityStatus = null;
    if (row.role === "professional" && row.profile_complete) {
      const { data: prof } = await supabaseAdmin
        .from("professional_profiles")
        .select("identity_status")
        .eq("user_id", uid)
        .maybeSingle();
      identityStatus = prof?.identity_status ?? "pending";
    }

    return Response.json({ ok: true, ...row, identityStatus }, { status: 200 });
  } catch (err: unknown) {
    console.log("ERROR:", getErrorMessage(err));
    return Response.json({ error: getErrorMessage(err) }, { status: 500 });
  }
});
