import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rateLimit.ts";
import { verifyFirebaseJWT } from "../_shared/verifyFirebaseJWT.ts";
import { isValidPhoneAR } from "../_shared/validate.ts";

// Rate limit: 10 attempts per minute per IP (prevent brute force on codes)
const RATE_LIMIT = { maxRequests: 10, windowMs: 60_000 };

serve(async (req: Request): Promise<Response> => {
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip, RATE_LIMIT);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.retryAfterMs, { "Content-Type": "application/json" });
  }

  try {
    // Auth: require Firebase JWT (user must be signed in before phone verification)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ valid: false, error: "Unauthorized" }, 401);
    try {
      await verifyFirebaseJWT(authHeader.replace("Bearer ", "").trim());
    } catch {
      return json({ valid: false, error: "Invalid token" }, 401);
    }

    const { phone, code } = await req.json().catch(() => ({}) as Record<string, unknown>);

    if (!phone || !code) {
      return json({ valid: false, error: "Phone and code are required" }, 400);
    }

    if (typeof phone === "string" && !isValidPhoneAR(phone)) {
      return json(
        { valid: false, error: "Formato de teléfono inválido. Usá +54 seguido de 10-11 dígitos." },
        400,
      );
    }

    if (typeof code === "string" && (code.length < 4 || code.length > 8)) {
      return json({ valid: false, error: "Código inválido" }, 400);
    }

    const ENVIRONMENT = Deno.env.get("ENVIRONMENT") ?? "production";
    const cleanPhone = typeof phone === "string" ? phone.replace(/\s/g, "") : "";

    // Dev bypass: only in non-production, only if explicitly enabled with a whitelist.
    if (ENVIRONMENT !== "production") {
      const DEV_BYPASS_ENABLED = (Deno.env.get("DEV_BYPASS_ENABLED") ?? "false") === "true";
      const envWhitelist = Deno.env.get("DEV_WHITELIST_NUMBERS");
      const WHITELIST_NUMBERS = envWhitelist ? envWhitelist.split(",").filter(Boolean) : [];
      const DEV_CODE = Deno.env.get("DEV_VERIFICATION_CODE");
      if (!DEV_CODE) {
        console.error("[check-verification] DEV_VERIFICATION_CODE env var not set");
        return json({ valid: false, error: "Dev bypass misconfigured" }, 500);
      }

      if (
        DEV_BYPASS_ENABLED &&
        WHITELIST_NUMBERS.length > 0 &&
        WHITELIST_NUMBERS.some((num: string) => cleanPhone === num.trim())
      ) {
        if (code === DEV_CODE) {
          return json({ valid: true, status: "approved" }, 200);
        }
        return json({ valid: false, error: "Código incorrecto" }, 400);
      }
    }

    const SID = Deno.env.get("TWILIO_SID");
    const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const VERIFY_SID = Deno.env.get("TWILIO_VERIFY_SID");

    if (!SID || !TOKEN || !VERIFY_SID) {
      return json({ error: "Missing Twilio credentials" }, 500);
    }

    const url = `https://verify.twilio.com/v2/Services/${VERIFY_SID}/VerificationCheck`;
    const body = new URLSearchParams({ To: phone, Code: code });

    const twilioRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${SID}:${TOKEN}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const payload = await twilioRes.json().catch(() => ({}));

    if (!twilioRes.ok || payload.status !== "approved") {
      return json(
        {
          valid: false,
          error: payload.message ?? payload.error_message ?? "Invalid or expired code",
        },
        400,
      );
    }

    return json({ valid: true, status: "approved" }, 200);
  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ valid: false, error: "Error del servicio. Intentá de nuevo." }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
