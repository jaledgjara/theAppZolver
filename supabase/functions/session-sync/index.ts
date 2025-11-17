// @ts-nocheck
// -----------------------------
// session-sync (Supabase Edge)
// Verificación LOCAL del JWT de Firebase usando JWKS embebido
// -----------------------------

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --------------------------------------------
// 🔐 JWKS embebido (TU EXACTO JWKS ORIGINAL)
// --------------------------------------------
const JWKS = {
  keys: [
    {
      "e": "AQAB",
      "kid": "545132099ad6bf61382b6b4cde9a2dfed8cb30f0",
      "alg": "RS256",
      "kty": "RSA",
      "n": "qLzdrFlKCar5wbsRoaFLnYiy_5x2dxfNdh-SoFUT2a0Cn-RQqU38LpL0EwOxw5A_Jhxszeo4fQIL_TKFy0ud5V-fFRoA1E_eAGDOaWn4k-jBBi8Q4VoRNSbxcucMvpB3HeHZeOtxfqHBOWUAWks9O__aK6FtIXCC2VB810gZH4mer-5YZieP2soxDrsMGd6YzMAcc2xuG-uAAVQUQes6y0Ea8iFse4AqE5v0-Ct_rL0SYB3wJxQjDtvDeh0AqIi4-jJRJkzw4m6sD7pxl8pgDiiZlHeKbNZ8vDhf3nbVoFUPlKPdTP1pB0YkQ8gsrnn7oC_WG3OAKSd12Mce1JzyNw",
      "use": "sig"
    },
    {
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "e": "AQAB",
      "kid": "3802934fe0eec46a5ed0006d14a1bab01e345083",
      "n": "pr8TDYZ1k3YFwv9wyNkm1KanMzII_8dHyNjcNpeVX6C9p-QSvwWVkTLGe1njUZDCge02t3tMzd5epLUXAzl91PoJgd7jH4NpDX4oQ429nIMrkGN7CamTpkSRIYH_7KcjS6BFsU1QwTRcYwCOOgJXyXlr5ZtXh1_ZoM6cLUTJ65GB3d0-LzlKj3PtuJ26qJ1q1zB3GI4eS2uQsHqA9gA92CzPQHs4WkhKYk4Yr92jyMKB3FmD0OQQKZOiKOfj_WOINwnBqBTWRU3bzSgwjiMW-hFt-XT0Hrcrx1P0SeilOOfK-4TDTDfsHTTivcV6TEq5ezxkdBqsJ4aKT3o6k2IQdw"
    },
    {
      "e": "AQAB",
      "n": "3WSz1bwefN0bqopj2ByxgYXguorQFRdUJl0anRFsgXAOIA4hpgaT_zIpb_37lY42wK03kEVCONQU3bEvWfe3vQUpjNMY-hjOp-AQSSE0k26KLBDkQisq686UsB9bpAJqxPC1hKZnfB35kLetXcf8hsMSxEmjpkZQfiPlAtuds-Vk0KvYvTpgBBWo0KOSOwwe8EEkFWVwMapVV0v32D8tihiSDY2om5ejkdEm1qPe0E-W5afnbTb6YGGD99iVRRFn3rw1_PvvwHAAwgOkN3CGC7EK7RxHfyOCPPnd5u0B_rur7gt23Nu75vwpxKKAR8NfYDnTzZQuUAaisDROCCSV9Q",
      "alg": "RS256",
      "use": "sig",
      "kid": "45a6c0c2b800717a34d5cbbbf39b84b676128265",
      "kty": "RSA"
    }
  ]
};

// --------------------------------------------
// base64url → ArrayBuffer
// --------------------------------------------
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer;
}

// --------------------------------------------
// Import RSA key
// --------------------------------------------
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
// Verify JWT (RS256)
// --------------------------------------------
async function verifyFirebaseJWT(token: string) {
  const [hB64, pB64, sigB64] = token.split(".");
  if (!hB64 || !pB64 || !sigB64) throw new Error("Malformed JWT");

  const header = JSON.parse(atob(hB64.replace(/-/g, "+").replace(/_/g, "/")));
  const payload = JSON.parse(atob(pB64.replace(/-/g, "+").replace(/_/g, "/")));
  const signature = base64urlToBuffer(sigB64);

  const jwk = JWKS.keys.find((k: any) => k.kid === header.kid);
  if (!jwk) throw new Error(`No matching JWK for kid=${header.kid}`);

  const key = await importRsaKey(jwk);
  const data = new TextEncoder().encode(`${hB64}.${pB64}`);

  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, data);
  if (!ok) throw new Error("Invalid JWT signature");

  return payload;
}

// --------------------------------------------
// Supabase CLIENT (fix para tu error ❌ createClient undefined)
// --------------------------------------------
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// --------------------------------------------
// FIREBASE PROJECT ID
// --------------------------------------------
const PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "thezolverapp";

// --------------------------------------------
// 🌐 SESSION SYNC HANDLER
// --------------------------------------------
serve(async (req: Request) => {
  console.log("[session-sync] Incoming request:", req.url);

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return Response.json({ error: "Missing Authorization" }, { status: 401 });
    }

    const token = auth.replace("Bearer ", "").trim();

    // 🔥 Validate JWT using local JWKS
    const payload = await verifyFirebaseJWT(token);

    // 🔍 Verify issuer & audience
    if (payload.iss !== `https://securetoken.google.com/${PROJECT_ID}`)
      throw new Error("Invalid issuer");
    if (payload.aud !== PROJECT_ID)
      throw new Error("Invalid audience");

    console.log("[session-sync] JWT valid for uid:", payload.sub);

    // 🔥 Fetch user from SQL
    const { data: account, error } = await supabase
      .from("user_accounts")
      .select("auth_uid, email, phone, role, profile_complete")
      .eq("auth_uid", payload.sub)
      .maybeSingle();

    if (error) {
      console.error("[session-sync] SQL error:", error);
      throw error;
    }

    return Response.json(
      {
        ok: true,
        uid: payload.sub,
        email: payload.email ?? null,
        email_verified: payload.email_verified ?? false,
        phone: account?.phone ?? null,
        role: account?.role ?? null,
        profile_complete: account?.profile_complete ?? false
      },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("[session-sync] ❌ Error:", err.message);
    return Response.json(
      { code: 401, message: err.message },
      { status: 401 }
    );
  }
});
