// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --------------------------------------------
// 1. Configuración & Cache
// --------------------------------------------
const GOOGLE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "thezolverapp";

let cachedJwks: any = null;

// --------------------------------------------
// 2. Helpers Criptográficos (JWT)
// --------------------------------------------
async function getGoogleJWKS() {
  if (cachedJwks) return cachedJwks;
  console.log("🌐 [JWKS] Fetching Google Keys...");
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

// --------------------------------------------
// 3. Verificación del Token (The Gatekeeper)
// --------------------------------------------
async function verifyFirebaseJWT(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed JWT");

  const [hB64, pB64, sigB64] = parts;
  const header = JSON.parse(atob(hB64.replace(/-/g, "+").replace(/_/g, "/")));

  let jwks = await getGoogleJWKS();
  let jwk = jwks.keys.find((k: any) => k.kid === header.kid);

  if (!jwk) {
    console.warn("⚠️ KID mismatch, refreshing keys...");
    cachedJwks = null;
    jwks = await getGoogleJWKS();
    jwk = jwks.keys.find((k: any) => k.kid === header.kid);
  }
  if (!jwk) throw new Error(`No matching JWK for kid=${header.kid}`);

  const key = await importRsaKey(jwk);
  const data = new TextEncoder().encode(`${hB64}.${pB64}`);
  const signature = base64urlToBuffer(sigB64);

  const isValid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    signature,
    data
  );
  if (!isValid) throw new Error("Invalid JWT signature");

  const payload = JSON.parse(atob(pB64.replace(/-/g, "+").replace(/_/g, "/")));
  const issuer = `https://securetoken.google.com/${PROJECT_ID}`;

  if (payload.iss !== issuer) throw new Error("Invalid issuer");
  if (payload.aud !== PROJECT_ID) throw new Error("Invalid audience");

  return payload;
}

// --------------------------------------------
// 4. Handler Principal (The Bridge Logic)
// --------------------------------------------
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  console.log(`\n📥 [Sync-Bridge] Request received: ${req.method}`);

  try {
    // A) Extraer Token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization Header");
    const token = authHeader.replace("Bearer ", "").trim();

    // B) Verificar Token (Firebase)
    const payload = await verifyFirebaseJWT(token);
    const firebaseUid = payload.sub;
    const email = payload.email || null;
    const provider = payload.firebase?.sign_in_provider || "unknown";

    console.log(`✅ [Sync-Bridge] Token Verified. UID: ${firebaseUid}`);

    // C) UPSERT en Supabase (LA CLAVE DEL PUENTE SÓLIDO)
    // "Si no existe, créalo. Si existe, actualiza email/provider por si cambiaron."
    // NO tocamos rol ni teléfono aquí para no sobrescribir datos manuales.

    const upsertData = {
      auth_uid: firebaseUid,
      auth_provider: provider,
      email: email,
      // updated_at: new Date().toISOString(), // Si tienes columna updated_at
    };

    // Usamos 'onConflict' en 'auth_uid' para hacer el merge
    const { error: upsertError } = await supabase
      .from("user_accounts")
      .upsert(upsertData, { onConflict: "auth_uid" });

    if (upsertError) {
      console.error("❌ [Sync-Bridge] DB Upsert Failed:", upsertError);
      throw upsertError;
    }
    console.log("💾 [Sync-Bridge] User synced to DB (Upsert OK)");

    // D) Lectura Final (Para devolver el estado completo, incluyendo roles)
    const { data: account, error: selectError } = await supabase
      .from("user_accounts")
      .select("auth_uid, email, phone, role, profile_complete, legal_name")
      .eq("auth_uid", firebaseUid)
      .single();

    if (selectError) throw selectError;

    // E) Datos Profesionales (Si aplica)
    let identityStatus = "pending";
    let typeWork = null;

    if (account.role === "professional") {
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
    const responseData = {
      ok: true,
      uid: account.auth_uid,
      email: account.email,
      phone: account.phone,
      role: account.role,
      profile_complete: account.profile_complete,
      legal_name: account.legal_name,
      identityStatus,
      type_work: typeWork,
    };

    console.log(
      `🚀 [Sync-Bridge] Response sent. Role: ${account.role || "NONE"}`
    );

    return Response.json(responseData, { status: 200 });
  } catch (err: any) {
    console.error("💥 [Sync-Bridge] Error:", err.message);
    return Response.json({ ok: false, error: err.message }, { status: 401 });
  }
});
