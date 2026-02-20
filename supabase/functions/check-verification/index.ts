// // @ts-ignore
// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// function encodeBasicAuth(user: string, pass: string): string {
//   const raw = `${user}:${pass}`;
//   const bytes = new TextEncoder().encode(raw);
//   const binary = String.fromCharCode(...bytes);
//   return btoa(binary);
// }

// serve(async (req: Request): Promise<Response> => {
//   try {
//     const { phone, code } = await req.json();

//     if (!phone || !code) {
//       return json(
//         { ok: false, valid: false, error: "Phone and code required" },
//         400
//       );
//     }

//     // @ts-ignore
//     const SID = Deno.env.get("TWILIO_SID");
//     // @ts-ignore
//     const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
//     // @ts-ignore
//     const VERIFY_SID = Deno.env.get("TWILIO_VERIFY_SID");

//     // 🔥 Base64 seguro
//     const basicAuth = encodeBasicAuth(SID, TOKEN);

//     const url = `https://verify.twilio.com/v2/Services/${VERIFY_SID}/VerificationCheck`;

//     const body = new URLSearchParams({
//       To: phone,
//       Code: code,
//     });

//     const twilioRes = await fetch(url, {
//       method: "POST",
//       headers: {
//         Authorization: `Basic ${basicAuth}`,
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//       body,
//     });

//     const jsonRaw = await twilioRes.json();
//     console.log("📦 Twilio raw:", jsonRaw);

//     const approved =
//       twilioRes.status === 200 && jsonRaw.status === "approved";

//     if (!approved) {
//       return json(
//         {
//           ok: false,
//           valid: false,
//           error:
//             jsonRaw.message ??
//             jsonRaw.error_message ??
//             "Invalid or expired code",
//         },
//         400
//       );
//     }

//     return json({ ok: true, valid: true }, 200);
//   } catch (err) {
//     console.error("❌ check-verification error:", err);
//     return json({ ok: false, valid: false, error: "Internal error" }, 500);
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
    const { phone, code } = await req.json().catch(() => ({} as any));

    // --- 🛡️ ZOLVER ARCHITECTURE: DEV BYPASS CONFIG ---
    // DEBE SER IDENTICA A LA DE SEND-VERIFICATION
    const WHITELIST_NUMBERS = [
      "+542616837340",
      "+542616837341",
      "+542616837342",
      "+542616837344",
      "+542616837345",
      "+542616837346",
      "+542616837347",
      "+542616837348",
      "+542616837349",
      "+542616837350",
      "+542616837351",
      "+542616837352",
    ];

    const DEV_CODE = "123456";
    const cleanPhone = phone ? phone.replace(/\s/g, "") : "";

    // @ts-ignore
    const DEV_BYPASS_ENABLED = Deno.env.get("DEV_BYPASS_ENABLED") === "true";

    // 1. BYPASS LOGIC (solo activo con DEV_BYPASS_ENABLED=true)
    if (DEV_BYPASS_ENABLED && WHITELIST_NUMBERS.some((num) => cleanPhone.includes(num))) {
      console.log(`⚠️ DEV MODE: Mocking CHECK for ${phone} with code ${code}`);

      if (code === DEV_CODE) {
        return json(
          { valid: true, status: "approved", message: "Dev Bypass Success" },
          200
        );
      } else {
        return json(
          { valid: false, error: "Wrong Dev Code (Use 123456)" },
          400
        );
      }
    }
    // --- END DEV BYPASS ---

    // ==========================================
    // 2. LÓGICA ORIGINAL (Twilio Real)
    // ==========================================

    // @ts-ignore
    const SID = Deno.env.get("TWILIO_SID");
    // @ts-ignore
    const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    // @ts-ignore
    const VERIFY_SID = Deno.env.get("TWILIO_VERIFY_SID");

    if (!SID || !TOKEN || !VERIFY_SID) {
      return json({ error: "Missing Creds" }, 500);
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

    if (!twilioRes.ok) {
      return json({ error: "Twilio Check Failed", details: payload }, 400);
    }

    // Retornamos el estado real de Twilio
    return json({ valid: payload.valid, status: payload.status }, 200);
  } catch (err) {
    return json({ error: "Unexpected error", message: String(err) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
