import { auth } from "@/APIconfig/firebaseAPIConfig";

export type BackendSession = {
  ok: boolean;
  uid: string;
  email: string | null;
  email_verified: boolean;
  phone: string | null;
  role: "client" | "professional" | null;
  profile_complete: boolean;
  // 👇 AGREGADO: Definimos el tipo aquí
  identityStatus?: string;
};

export async function syncUserSession(): Promise<BackendSession | null> {
  try {
    const token = await auth.currentUser?.getIdToken(true);
    if (!token) throw new Error("Missing Firebase token");

    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL_FUNCTIONS;
    const fullUrl = `${baseUrl}/session-sync`;

    console.log("🌍 [sessionService] Base URL:", baseUrl);
    console.log(
      "🔑 [sessionService] Token (first 30 chars):",
      token.slice(0, 30)
    );

    const res = await fetch(fullUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("📡 [sessionService] Response status:", res.status);
    const raw = await res.text();
    console.log("📦 [sessionService] Raw response:", raw);

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON from session-sync: ${raw}`);
    }

    if (!res.ok) {
      const msg = data.message || data.error || "Error syncing session";
      throw new Error(msg);
    }

    return {
      ok: data.ok,
      uid: data.uid,
      email: data.email,
      email_verified: data.email_verified,
      phone: data.phone,
      role: data.role,
      profile_complete: data.profile_complete,
      identityStatus: data.identityStatus,
    };
  } catch (err: any) {
    console.error("❌ [sessionService] Error:", err.message);
    return null;
  }
}
