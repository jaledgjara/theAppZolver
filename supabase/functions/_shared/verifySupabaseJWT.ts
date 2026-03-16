// Verifies HMAC-SHA256 JWTs issued by session-sync (custom Supabase tokens).
// Mirrors verifyFirebaseJWT.ts but for symmetric HMAC instead of RSA.

const JWT_SECRET = Deno.env.get("JWT_SECRET") ?? Deno.env.get("SUPABASE_JWT_SECRET");
if (!JWT_SECRET) {
  throw new Error(
    "CRITICAL: JWT_SECRET or SUPABASE_JWT_SECRET environment variable not configured",
  );
}

function base64urlDecode(input: string): Uint8Array {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  // atob requires padding
  const pad = base64.length % 4;
  if (pad === 2) base64 += "==";
  else if (pad === 3) base64 += "=";
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export interface SupabaseJwtPayload {
  sub: string; // Postgres UUID from user_accounts
  firebase_uid: string; // Firebase UID (used as FK in most tables)
  app_role: string; // 'client' | 'professional' | 'admin'
  email: string | null;
  aud: string;
  exp: number;
  iat: number;
}

export async function verifySupabaseJWT(token: string): Promise<SupabaseJwtPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed JWT");

  const [headerB64, payloadB64, signatureB64] = parts;

  // Import HMAC key
  const encoder = new TextEncoder();
  const keyData = encoder.encode(JWT_SECRET);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  // Verify signature
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = base64urlDecode(signatureB64);

  const valid = await crypto.subtle.verify("HMAC", cryptoKey, signature, data);
  if (!valid) throw new Error("Invalid JWT signature");

  // Decode payload
  const payload: SupabaseJwtPayload = JSON.parse(
    new TextDecoder().decode(base64urlDecode(payloadB64)),
  );

  // Validate expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error("JWT expired");
  }

  // Validate audience
  if (payload.aud !== "authenticated") {
    throw new Error(`Invalid audience: ${payload.aud}`);
  }

  // Validate firebase_uid claim exists
  if (!payload.firebase_uid) {
    throw new Error("Missing firebase_uid claim");
  }

  return payload;
}
