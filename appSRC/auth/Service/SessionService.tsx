import { auth } from "@/APIconfig/firebaseAPIConfig"; //

// 1. 👇 AGREGAMOS identityStatus AL TIPO
export type BackendSession = {
  ok: boolean;
  uid: string;
  email: string | null;
  email_verified: boolean;
  phone: string | null;
  role: "client" | "professional" | null;
  profile_complete: boolean;
  legal_name: string | null;
  identityStatus?: string | null; // 👈 ESTO FALTABA
};

export async function syncUserSession(): Promise<BackendSession | null> {
  try {
    const token = await auth.currentUser?.getIdToken(true);
    if (!token) throw new Error("Missing Firebase token");

    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL_FUNCTIONS;
    const fullUrl = `${baseUrl}/session-sync`;

    // console.log("📡 [sessionService] Syncing with:", fullUrl);

    const res = await fetch(fullUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const raw = await res.text();

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON: ${raw}`);
    }

    if (!res.ok) {
      console.error(
        "❌ [sessionService] Server Error:",
        data.message || data.error
      );
      throw new Error(data.message || "Error syncing session");
    }

    return {
      ok: data.ok,
      uid: data.uid,
      email: data.email,
      email_verified: data.email_verified,
      phone: data.phone,
      role: data.role,
      profile_complete: data.profile_complete,
      legal_name: data.legal_name,
      identityStatus: data.identityStatus, // 👈 Y LO MAPEAMOS AQUÍ
    };
  } catch (err: any) {
    console.error("❌ [sessionService] Exception:", err.message);
    return null;
  }
}
