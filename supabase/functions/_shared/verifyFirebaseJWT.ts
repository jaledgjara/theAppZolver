const GOOGLE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

// @ts-ignore
const PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "thezolverapp";

let cachedJwks: any = null;

export async function getGoogleJWKS() {
  if (cachedJwks) return cachedJwks;
  const res = await fetch(GOOGLE_JWKS_URL);
  if (!res.ok) throw new Error(`Google JWKS status: ${res.status}`);
  cachedJwks = await res.json();
  return cachedJwks;
}

export function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer;
}

export async function importRsaKey(jwk: any): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

export async function verifyFirebaseJWT(token: string) {
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
