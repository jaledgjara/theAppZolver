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
    const { phone } = await req.json().catch(() => ({} as any));
    console.log("📞 Incoming phone:", phone);

    // --- 🛡️ ZOLVER ARCHITECTURE: DEV BYPASS START (SEND) ---
    // Esta es la parte que le FALTA. Sin esto, siempre intentará cobrarle/bloquearle en Twilio.
    const WHITELIST_NUMBERS = [
      "+542616837340",
      "+542616837341",
      "+542616837342",
      "+542616837345",
      "+542616837346",
      "+542616837347",
      "+542616837348",
      "+542616837349",
      "+542616837350",
      "+542616837351",
      "+542616837352",
    ];

    // Normalizamos el número
    const cleanPhone = phone ? phone.replace(/\s/g, "") : "";

    // Si es su número, retornamos ÉXITO FALSO inmediatamente
    if (WHITELIST_NUMBERS.some((num) => cleanPhone.includes(num))) {
      console.log(
        `⚠️ DEV MODE: Bypassing Twilio sending for whitelist number: ${phone}`
      );

      return json(
        {
          sid: "dev_bypass_fake_sid",
          status: "pending",
          valid: true,
          message: "Development bypass active. Use code: 123456",
        },
        200
      );
    }
    // --- 🛡️ ZOLVER ARCHITECTURE: DEV BYPASS END ---

    // ============================================================
    // LÓGICA ORIGINAL (Solo se ejecuta si NO es su número)
    // ============================================================
    // @ts-ignore
    const SID = Deno.env.get("TWILIO_SID");
    // @ts-ignore
    const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    // @ts-ignore
    const VERIFY_SID = Deno.env.get("TWILIO_VERIFY_SID");

    if (!phone) return json({ error: "Phone is required" }, 400);
    if (!SID || !TOKEN || !VERIFY_SID)
      return json({ error: "Missing Creds" }, 500);

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
      return json(
        { error: "Twilio error", details: payload },
        twilioRes.status
      );
    }

    return json(payload, 200);
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
