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

    // --- 🛡️ ZOLVER ARCHITECTURE: DEV BYPASS START ---
    // Agregue aquí todos los formatos posibles de su número
    const WHITELIST_NUMBERS = ["+542616837344", "+5492616837344", "2616837344"];

    // Normalizamos quitando espacios para comparar mejor
    const cleanPhone = phone ? phone.replace(/\s/g, "") : "";

    if (WHITELIST_NUMBERS.some((num) => cleanPhone.includes(num))) {
      console.log(
        `⚠️ DEV MODE: Bypassing Twilio for whitelist number: ${phone}`
      );

      // Retornamos una respuesta falsa de éxito (Mock Response)
      return json(
        {
          sid: "dev_bypass_fake_sid",
          service_sid: "dev_bypass_service_sid",
          account_sid: "dev_bypass_account_sid",
          status: "pending",
          valid: true,
          message: "Development bypass active. Use code: 123456",
        },
        200
      );
    }
    // --- 🛡️ ZOLVER ARCHITECTURE: DEV BYPASS END ---

    // ============================================================
    // LÓGICA ORIGINAL (Se ejecuta si NO es su número)
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
      return json({ error: "Missing Twilio credentials" }, 500);
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
