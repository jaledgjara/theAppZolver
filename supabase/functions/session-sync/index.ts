// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --------------------------------------------
// 1. Configuración
// --------------------------------------------
const GOOGLE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "thezolverapp";

let cachedJwks: any = null;

// --------------------------------------------
// 2. Helpers (JWT & Crypto)
// --------------------------------------------
async function getGoogleJWKS() {
  if (cachedJwks) {
    console.log("💾 [JWKS] Usando claves en caché");
    return cachedJwks;
  }
  console.log("🌐 [JWKS] Fetching nuevas claves de Google...");
  try {
    const res = await fetch(GOOGLE_JWKS_URL);
    if (!res.ok) throw new Error(`Google JWKS status: ${res.status}`);
    cachedJwks = await res.json();
    console.log("✅ [JWKS] Claves obtenidas correctamente");
    return cachedJwks;
  } catch (e) {
    console.error("❌ [JWKS] Fallo al obtener claves:", e);
    throw e;
  }
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
// 3. Lógica de Verificación JWT
// --------------------------------------------
async function verifyFirebaseJWT(token: string) {
  console.log("🔍 [Verify] Iniciando validación del token...");
  const parts = token.split(".");
  if (parts.length !== 3) {
    console.error("❌ [Verify] Token malformado (no tiene 3 partes)");
    throw new Error("Malformed JWT");
  }
  const [hB64, pB64, sigB64] = parts;

  let header;
  try {
    header = JSON.parse(atob(hB64.replace(/-/g, "+").replace(/_/g, "/")));
  } catch (e) {
    console.error("❌ [Verify] Error parseando header:", e);
    throw new Error("Invalid Header");
  }

  let jwks = await getGoogleJWKS();
  let jwk = jwks.keys.find((k: any) => k.kid === header.kid);

  if (!jwk) {
    console.warn("⚠️ [Verify] KID no encontrado en caché. Forzando refresh...");
    cachedJwks = null;
    jwks = await getGoogleJWKS();
    jwk = jwks.keys.find((k: any) => k.kid === header.kid);
  }

  if (!jwk) {
    console.error(
      `❌ [Verify] KID ${header.kid} no existe en las claves de Google actuales.`
    );
    throw new Error(`No matching JWK for kid=${header.kid}`);
  }

  const key = await importRsaKey(jwk);
  const data = new TextEncoder().encode(`${hB64}.${pB64}`);
  const signature = base64urlToBuffer(sigB64);

  const isValid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    signature,
    data
  );

  if (!isValid) {
    console.error("❌ [Verify] La firma criptográfica es INVÁLIDA");
    throw new Error("Invalid JWT signature");
  }

  const payload = JSON.parse(atob(pB64.replace(/-/g, "+").replace(/_/g, "/")));
  const issuer = `https://securetoken.google.com/${PROJECT_ID}`;

  if (payload.iss !== issuer) throw new Error("Invalid issuer");
  if (payload.aud !== PROJECT_ID) throw new Error("Invalid audience");

  console.log("✅ [Verify] Token válido para UID:", payload.sub);
  return payload;
}

// --------------------------------------------
// 4. Handler Principal (Supabase Logic)
// --------------------------------------------
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  console.log("==========================================");
  console.log(`📥 [Request] ${req.method} ${req.url}`);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return Response.json({ error: "Missing Authorization" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // 1. Verificar Token
    const payload = await verifyFirebaseJWT(token);

    // 2. Consultar Base de Datos (User Account)
    console.log(
      `🗄️ [DB] Buscando usuario en 'user_accounts' con auth_uid=${payload.sub}...`
    );

    // 🔥 IMPORTANTE: Si la tabla no tiene las columnas 'first_name' y 'last_name', esto fallará.
    // Asegúrate de ejecutar: ALTER TABLE public.user_accounts ADD COLUMN IF NOT EXISTS first_name text NULL, ADD COLUMN IF NOT EXISTS last_name text NULL;
    const { data: account, error } = await supabase
      .from("user_accounts")
      .select(
        "auth_uid, email, phone, role, profile_complete, first_name, last_name"
      )
      .eq("auth_uid", payload.sub)
      .maybeSingle();

    if (error) {
      console.error("❌ [DB] Error SQL:", error);
      throw error; // Esto es lo que dispara el 401 en tu log
    }

    if (!account) {
      console.warn(
        "⚠️ [DB] Usuario no encontrado en tabla user_accounts (¿Sync pendiente?)"
      );
    }

    // 3. Consultar Perfil Profesional si corresponde
    let identityStatus = "pending";
    let professionalName = null;

    if (account?.role === "professional") {
      console.log(`🔍 Buscando perfil profesional para: ${payload.sub}`);

      const { data: profile, error: profError } = await supabase
        .from("professional_profiles")
        // 🔥 CORRECCIÓN: Agregamos legal_name al select
        .select("identity_status, legal_name")
        .eq("user_id", payload.sub)
        .maybeSingle();

      if (profile) {
        identityStatus = profile.identity_status ?? "pending";
        professionalName = profile.legal_name; // Recuperamos "Jaled Jara"
        console.log(
          `✅ Perfil encontrado. Status: ${identityStatus}, Nombre: ${professionalName}`
        );
      } else {
        console.log("⚠️ No se encontró perfil profesional (aún no creado)");
      }
    }

    // 4. Lógica de Nombre Final
    // Si hay un nombre profesional ("Jaled Jara"), úsalo.
    // Si no, intenta usar first_name + last_name.
    // Si no, legal_name de user_accounts.

    let finalName = account?.legal_name; // Backup

    if (account?.first_name || account?.last_name) {
      finalName = `${account.first_name ?? ""} ${
        account.last_name ?? ""
      }`.trim();
    }

    if (professionalName) {
      finalName = professionalName; // Prioridad máxima al perfil profesional
    }

    // Para mantener compatibilidad con tu frontend actual que espera 'first_name' y 'last_name',
    // podemos descomponer el nombre final o enviarlo como 'legal_name' o 'displayName'.
    // Aquí enviamos todo para que el frontend decida.

    const responseData = {
      ok: true,
      uid: payload.sub,
      email: payload.email ?? null,
      email_verified: payload.email_verified ?? false,
      phone: account?.phone ?? payload.phone_number ?? null,
      role: account?.role ?? null,
      profile_complete: account?.profile_complete ?? false,

      // Enviamos el nombre calculado
      displayName: finalName,

      // Mantenemos estos por compatibilidad si tu AuthUser los usa
      first_name: account?.first_name,
      last_name: account?.last_name,
      legal_name: finalName, // Enviamos explícitamente como legal_name también

      identityStatus: identityStatus,
    };

    console.log("🚀 [Response] Enviando 200 OK:", responseData);

    return Response.json(responseData, { status: 200 });
  } catch (err: any) {
    console.error("💥 Error General:", err.message);
    return Response.json({ code: 401, message: err.message }, { status: 401 });
  }
});
