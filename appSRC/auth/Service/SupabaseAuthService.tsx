// appSRC/auth/Service/SupabaseAuthService.tsx
import { auth } from "@/APIconfig/firebaseAPIConfig";
import { fetchWithTimeout } from "@/appSRC/utils/fetchWithTimeout";

const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// ------------------------------------------------------------------
// 1. SAVE USER ROLE (Solo actualiza Rol y Teléfono)
// ------------------------------------------------------------------
export async function saveUserRole(role: "client" | "professional", phone: string | null) {
  try {
    console.log("🔵 [saveUserRole] START");

    const token = await auth.currentUser?.getIdToken(true);
    if (!token) throw new Error("Missing Firebase token");

    const user = auth.currentUser;
    if (!user) throw new Error("No user found");

    // 👇 LÓGICA ELIMINADA: Ya no extraemos nombres de Google/Apple.
    // Confiamos en que 'updateUserLegalName' ya hizo su trabajo antes.

    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL_FUNCTIONS;
    const url = `${baseUrl}/set-user-role`;

    const body = JSON.stringify({
      role,
      uid: user.uid,
      email: user.email ?? null,
      provider: user.providerData?.[0]?.providerId ?? "unknown",
      phone,
      // ❌ legal_name ELIMINADO del payload.
      // Al no enviarlo, el backend NO tocará el nombre que ya existe en la DB.
    });

    console.log("📦 [saveUserRole] Sending role update...", { role, phone });

    const res = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body,
      },
      15000,
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error saving role");
    }

    console.log("✅ [saveUserRole] Success:", data);
    return data;
  } catch (error: any) {
    console.error("🔴 [saveUserRole] Error:", error.message);
    throw error;
  }
}

// ------------------------------------------------------------------
// 2. UPDATE LEGAL NAME (Se usa en UserBasicInfoScreen)
// ------------------------------------------------------------------
export async function updateUserLegalName(legalName: string) {
  try {
    console.log("✍️ [updateUserLegalName] Setting name to:", legalName);

    const token = await auth.currentUser?.getIdToken(true);
    if (!token) throw new Error("Missing Firebase token");

    const user = auth.currentUser;
    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL_FUNCTIONS;

    // Use update-user-identity Edge Function (only updates legal_name)
    const url = `${baseUrl}/update-user-identity`;

    const body = JSON.stringify({
      legal_name: legalName,
    });

    const res = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body,
      },
      15000,
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("🔴 [updateUserLegalName] Response status:", res.status, "body:", text);
      let errorMsg = "Error updating name";
      try {
        const errorData = JSON.parse(text);
        if (errorData.error) errorMsg = errorData.error;
      } catch {
        // Response wasn't JSON — include status and raw body
        errorMsg = `Server error (${res.status}): ${text.slice(0, 200)}`;
      }
      throw new Error(errorMsg);
    }

    console.log("✅ [updateUserLegalName] Name saved!");
    return true;
  } catch (error: any) {
    console.error("🔴 [updateUserLegalName] Error:", error.message);
    throw error;
  }
}
