import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rateLimit.ts";

// Rate limit: 5 SMS per minute per IP (prevent SMS bombing)
const RATE_LIMIT = { maxRequests: 5, windowMs: 60_000 };

serve(async (req: Request): Promise<Response> => {
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip, RATE_LIMIT);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.retryAfterMs, { "Content-Type": "application/json" });
  }

  try {
    const { phone } = await req.json().catch(() => ({}) as Record<string, unknown>);

    if (!phone || typeof phone !== "string") {
      return json({ error: "Phone is required" }, 400);
    }

    const ENVIRONMENT = Deno.env.get("ENVIRONMENT") ?? "development";
    const cleanPhone = phone.replace(/\s/g, "");

    // Dev bypass: only in non-production, only if explicitly enabled with a whitelist.
    if (ENVIRONMENT !== "production") {
      const DEV_BYPASS_ENABLED = (Deno.env.get("DEV_BYPASS_ENABLED") ?? "true") === "true";
      const envWhitelist = Deno.env.get("DEV_WHITELIST_NUMBERS");
      const WHITELIST_NUMBERS = envWhitelist ? envWhitelist.split(",").filter(Boolean) : [];

      if (
        DEV_BYPASS_ENABLED &&
        WHITELIST_NUMBERS.length > 0 &&
        WHITELIST_NUMBERS.some((num: string) => cleanPhone === num.trim())
      ) {
        console.log(`[DEV] Mocking SEND for whitelist number: ${phone}`);
        return json({ sid: "dev_bypass", status: "pending" }, 200);
      }
    }

    const SID = Deno.env.get("TWILIO_SID");
    const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const VERIFY_SID = Deno.env.get("TWILIO_VERIFY_SID");

    if (!SID || !TOKEN || !VERIFY_SID) {
      return json({ error: "Missing Twilio credentials configuration" }, 500);
    }

    const url = `https://verify.twilio.com/v2/Services/${VERIFY_SID}/Verifications`;
    const body = new URLSearchParams({ To: phone, Channel: "sms" });

    const twilioRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${SID}:${TOKEN}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const payload = await twilioRes.json().catch(() => ({}));

    if (!twilioRes.ok) {
      console.error("Twilio Error:", payload);
      return json({ error: "Twilio error", details: payload }, twilioRes.status);
    }

    return json({ status: payload.status }, 200);
  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ error: "Unexpected error", message: String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
