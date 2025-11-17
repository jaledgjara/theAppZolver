// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

function encodeBasicAuth(user: string, pass: string): string {
  const raw = `${user}:${pass}`;
  const bytes = new TextEncoder().encode(raw);
  const binary = String.fromCharCode(...bytes);
  return btoa(binary);
}

serve(async (req: Request): Promise<Response> => {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return json(
        { ok: false, valid: false, error: "Phone and code required" },
        400
      );
    }

    // @ts-ignore
    const SID = Deno.env.get("TWILIO_SID");
    // @ts-ignore
    const TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    // @ts-ignore
    const VERIFY_SID = Deno.env.get("TWILIO_VERIFY_SID");

    // 🔥 Base64 seguro
    const basicAuth = encodeBasicAuth(SID, TOKEN);

    const url = `https://verify.twilio.com/v2/Services/${VERIFY_SID}/VerificationCheck`;

    const body = new URLSearchParams({
      To: phone,
      Code: code,
    });

    const twilioRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const jsonRaw = await twilioRes.json();
    console.log("📦 Twilio raw:", jsonRaw);

    const approved =
      twilioRes.status === 200 && jsonRaw.status === "approved";

    if (!approved) {
      return json(
        {
          ok: false,
          valid: false,
          error:
            jsonRaw.message ??
            jsonRaw.error_message ??
            "Invalid or expired code",
        },
        400
      );
    }

    return json({ ok: true, valid: true }, 200);
  } catch (err) {
    console.error("❌ check-verification error:", err);
    return json({ ok: false, valid: false, error: "Internal error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

