// // @ts-ignore
// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// serve(async (req: Request): Promise<Response> => {
//   try {
//     const { phone } = await req.json().catch(() => ({} as any));
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
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request): Promise<Response> => {
  try {
    const { phone } = await req.json().catch(() => ({} as any));
    console.log("📞 Incoming phone:", phone);

    // --- DEV BYPASS CONFIG ---
    const cleanPhone = phone ? phone.replace(/\s/g, "") : "";

    // @ts-ignore
    const ENVIRONMENT = Deno.env.get("ENVIRONMENT") ?? "development";
    // @ts-ignore
    const DEV_BYPASS_ENABLED = ENVIRONMENT !== "production" && (Deno.env.get("DEV_BYPASS_ENABLED") ?? "true") === "true";

    const DEFAULT_WHITELIST = [
      "+542616837340","+542616837341","+542616837342","+542616837344",
      "+542616837345","+542616837346","+542616837347","+542616837348",
      "+542616837349","+542616837350","+542616837351","+542616837352",
    ];
    // @ts-ignore
    const envWhitelist = Deno.env.get("DEV_WHITELIST_NUMBERS");
    const WHITELIST_NUMBERS = envWhitelist ? envWhitelist.split(",").filter(Boolean) : DEFAULT_WHITELIST;

    if (
      DEV_BYPASS_ENABLED &&
      ENVIRONMENT !== "production" &&
      WHITELIST_NUMBERS.some((num: string) => cleanPhone.includes(num.trim()))
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
        200
      );
    }
    // --- END DEV BYPASS ---

    // ============================================================
    // 2. LÓGICA ORIGINAL (Twilio Real)
    // ============================================================

    // @ts-ignore
    const SID = Deno.env.get("TWILIO_SID");
    // @ts-ignore
    const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    // @ts-ignore
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
      return json(
        { error: "Twilio error", details: payload },
        twilioRes.status
      );
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
