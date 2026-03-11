// // @ts-ignore
// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// serve(async (req: Request): Promise<Response> => {
//   try {
//     const { phone } = await req.json().catch(() => ({}) as Record<string, unknown>);
//     console.log("📞 Incoming phone:", phone);

//     // @ts-ignore
//     const SID = Deno.env.get("TWILIO_SID");
//     // @ts-ignore
//     const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
//     // @ts-ignore
//     const VERIFY_SID = Deno.env.get("TWILIO_VERIFY_SID");

//     console.log("🔐 Env:", {
//       SID: !!SID,
//       TOKEN: !!TOKEN,
//       VERIFY_SID: !!VERIFY_SID,
//     });

//     if (!phone || typeof phone !== "string") {
//       return json({ error: "Phone is required" }, 400);
//     }

//     if (!SID || !TOKEN || !VERIFY_SID) {
//       return json({ error: "Missing Twilio credentials" }, 500);
//     }

//     const url = `https://verify.twilio.com/v2/Services/${VERIFY_SID}/Verifications`;
//     const body = new URLSearchParams({ To: phone, Channel: "sms" });

//     console.log("🌐 Twilio request →", url, "with", body.toString());

//     const twilioRes = await fetch(url, {
//       method: "POST",
//       headers: {
//         Authorization: "Basic " + btoa(`${SID}:${TOKEN}`),
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//       body,
//     });

//     const payload = await twilioRes.json().catch(() => ({}));
//     console.log("📦 Twilio response:", payload);

//     if (!twilioRes.ok) {
//       return json({ error: "Twilio error", details: payload }, twilioRes.status);
//     }

//     return json(payload, 200);
//   } catch (err) {
//     console.error("❌ Unexpected error:", err);
//     return json({ error: "Unexpected error", message: String(err) }, 500);
//   }
// });

// function json(data: unknown, status = 200) {
//   return new Response(JSON.stringify(data), {
//     status,
//     headers: { "Content-Type": "application/json" },
//   });
// }

//
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rateLimit.ts";

// Rate limit: 5 SMS per minute per IP (prevent SMS bombing)
const RATE_LIMIT = { maxRequests: 5, windowMs: 60_000 };

serve(async (req: Request): Promise<Response> => {
  // Rate limiting
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit(ip, RATE_LIMIT);
  if (!rateCheck.allowed) {
    return rateLimitResponse(rateCheck.retryAfterMs, { "Content-Type": "application/json" });
  }

  try {
    const { phone } = await req.json().catch(() => ({}) as Record<string, unknown>);
    console.log("Incoming phone:", phone);

    // --- DEV BYPASS CONFIG ---
    const cleanPhone = phone ? phone.replace(/\s/g, "") : "";

    const ENVIRONMENT = Deno.env.get("ENVIRONMENT") ?? "development";

    // SECURITY: Dev bypass is ONLY available in non-production environments
    // AND requires explicit opt-in via environment variable.
    if (ENVIRONMENT === "production") {
      // In production, skip all dev bypass logic entirely
    } else {
      const DEV_BYPASS_ENABLED = (Deno.env.get("DEV_BYPASS_ENABLED") ?? "true") === "true";

      // Whitelist MUST come from environment variable — no hardcoded numbers in production
      const envWhitelist = Deno.env.get("DEV_WHITELIST_NUMBERS");
      const WHITELIST_NUMBERS = envWhitelist ? envWhitelist.split(",").filter(Boolean) : [];

      if (
        DEV_BYPASS_ENABLED &&
        WHITELIST_NUMBERS.length > 0 &&
        WHITELIST_NUMBERS.some((num: string) => cleanPhone === num.trim())
      ) {
        console.log(`[DEV] Mocking SEND for whitelist number: ${phone}`);

        return json(
          {
            sid: "dev_bypass_fake_sid",
            service_sid: "dev_bypass_service_sid",
            account_sid: "dev_bypass_account_sid",
            status: "pending",
            valid: true,
          },
          200,
        );
      }
    }
    // --- END DEV BYPASS ---

    // ============================================================
    // 2. LÓGICA ORIGINAL (Twilio Real)
    // ============================================================

    const SID = Deno.env.get("TWILIO_SID");
    const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const VERIFY_SID = Deno.env.get("TWILIO_VERIFY_SID");

    if (!phone || typeof phone !== "string") {
      return json({ error: "Phone is required" }, 400);
    }
    if (!SID || !TOKEN || !VERIFY_SID) {
      // Si faltan credenciales pero no es whitelist, fallamos
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

    return json(payload, 200);
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return json({ error: "Unexpected error", message: String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
