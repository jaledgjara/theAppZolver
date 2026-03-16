/**
 * Environment-aware CORS headers for Edge Functions.
 *
 * In development: allows all origins ("*") for local testing.
 * In production: restricts to known app domains.
 */

const ENVIRONMENT = Deno.env.get("ENVIRONMENT") ?? "production";

const ALLOWED_ORIGINS = ["https://thezolverapp.web.app", "https://thezolverapp.firebaseapp.com"];

/**
 * Returns the appropriate Access-Control-Allow-Origin value
 * based on the request origin and environment.
 */
export function getAllowedOrigin(requestOrigin: string | null): string {
  if (ENVIRONMENT === "development") return "*";

  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }

  // For mobile apps (no Origin header), allow the request
  if (!requestOrigin) return ALLOWED_ORIGINS[0];

  // Reject unknown origins by returning the first allowed origin
  // (browser will block the response since it won't match)
  return ALLOWED_ORIGINS[0];
}

/**
 * Build CORS headers for a given request.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(origin),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

/**
 * Legacy CORS headers for backward compatibility.
 * Use getCorsHeaders(req) for new code.
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": ENVIRONMENT === "development" ? "*" : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
