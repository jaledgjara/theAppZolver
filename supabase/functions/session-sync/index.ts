// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

// --------------------------------------------
// 1. Configuración
// --------------------------------------------
const GOOGLE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "thezolverapp";
const JWT_SECRET =
  Deno.env.get("JWT_SECRET") ?? Deno.env.get("SUPABASE_JWT_SECRET") ?? "";

let cachedJwks: any = null;

// --------------------------------------------
// 2. Helpers (Sin cambios)
// --------------------------------------------
async function getGoogleJWKS() {
  if (cachedJwks) return cachedJwks;
  const res = await fetch(GOOGLE_JWKS_URL);
  if (!res.ok) throw new Error(`Google JWKS status: ${res.status}`);
  cachedJwks = await res.json();
  return cachedJwks;
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer;
}

async function importRsaKey(jwk: any): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

async function verifyFirebaseJWT(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed JWT");
  const [hB64, pB64, sigB64] = parts;
  const header = JSON.parse(atob(hB64.replace(/-/g, "+").replace(/_/g, "/")));

  let jwks = await getGoogleJWKS();
  let jwk = jwks.keys.find((k: any) => k.kid === header.kid);
  if (!jwk) {
    cachedJwks = null;
    jwks = await getGoogleJWKS();
    jwk = jwks.keys.find((k: any) => k.kid === header.kid);
  }
  if (!jwk) throw new Error(`No matching JWK`);

  const key = await importRsaKey(jwk);
  const data = new TextEncoder().encode(`${hB64}.${pB64}`);
  const signature = base64urlToBuffer(sigB64);

  if (
    !(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, data))
  ) {
    throw new Error("Invalid JWT signature");
  }

  const payload = JSON.parse(atob(pB64.replace(/-/g, "+").replace(/_/g, "/")));
  if (payload.aud !== PROJECT_ID) throw new Error("Invalid audience");

  return payload;
}

// --------------------------------------------
// 3. Handler Principal
// --------------------------------------------
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS")
      return new Response("ok", {
        headers: { "Access-Control-Allow-Origin": "*" },
      });

    // A) Verificar Firebase
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Token");
    const token = authHeader.replace("Bearer ", "").trim();
    const payload = await verifyFirebaseJWT(token);

    const firebaseUid = payload.sub;
    const email = payload.email || `no-email-${firebaseUid}@placeholder.com`;

    console.log(`👤 [Sync] Firebase UID: ${firebaseUid}`);

    // B) UPSERT user_accounts (Tu tabla pública)
    // Esto asegura que tengamos un UUID de Postgres válido
    const { data: upsertedAccount, error: upsertError } = await supabase
      .from("user_accounts")
      .upsert(
        { auth_uid: firebaseUid, email: email, auth_provider: "firebase" },
        { onConflict: "auth_uid" }
      )
      .select("id, role, phone, profile_complete, legal_name")
      .single();

    if (upsertError) throw upsertError;

    // Este ID es un UUID real generado por Postgres
    const shadowUUID = upsertedAccount.id;

    // C) SHADOW USER SYNC (El truco para setSession) 👻
    // Verificamos si este UUID existe en auth.users. Si no, lo creamos.
    const { data: authUser, error: authCheckError } =
      await supabase.auth.admin.getUserById(shadowUUID);

    if (authCheckError || !authUser.user) {
      console.log("👻 [Sync] Creando Usuario Sombra en Supabase Auth...");
      const { error: createError } = await supabase.auth.admin.createUser({
        id: shadowUUID, // 👈 Forzamos que coincida con user_accounts.id
        email: email,
        email_confirm: true,
        user_metadata: { firebase_uid: firebaseUid },
      });
      if (createError)
        console.warn(
          "⚠️ Error creando shadow user (puede que ya exista):",
          createError.message
        );
    }

    // D) Generar Token Supabase Válido
    if (!JWT_SECRET) throw new Error("Falta JWT_SECRET");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const supabaseToken = await create(
      { alg: "HS256", typ: "JWT" },
      {
        aud: "authenticated",
        role: "authenticated",
        sub: shadowUUID, // 👈 Ahora usamos el UUID real que existe en auth.users
        auth_uid: firebaseUid, // 👈 AQUÍ: Usaste 'auth_uid' como nombre de la clave        email: email,
        exp: getNumericDate(60 * 60 * 24),
      },
      key
    );

    // E) Datos Extra
    let identityStatus = "pending";
    let typeWork = null;
    if (upsertedAccount.role === "professional") {
      const { data: prof } = await supabase
        .from("professional_profiles")
        .select("identity_status, type_work")
        .eq("user_id", firebaseUid)
        .maybeSingle();
      if (prof) {
        identityStatus = prof.identity_status ?? "pending";
        typeWork = prof.type_work ?? "instant";
      }
    }

    // F) Respuesta
    return Response.json({
      ok: true,
      token: supabaseToken,
      uid: firebaseUid, // Tu ID de Firebase para la UI
      email: email,
      phone: upsertedAccount.phone,
      role: upsertedAccount.role,
      profile_complete: upsertedAccount.profile_complete,
      legal_name: upsertedAccount.legal_name,
      identityStatus,
      type_work: typeWork,
    });
  } catch (err: any) {
    console.error("💥 Error:", err.message);
    return Response.json({ ok: false, error: err.message }, { status: 400 });
  }
});
