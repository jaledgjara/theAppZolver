// src/modules/auth/services/userRoleService.ts

import { auth } from "@/APIconfig/firebaseAPIConfig";

// src/modules/auth/services/userRoleService.ts



export async function saveUserRole(
  role: "client" | "professional",
  phone: string | null
) {
  try {
    console.log("🔵 [saveUserRole] START");
    console.log("🔵 [saveUserRole] Requested role:", role);
    console.log("🔵 [saveUserRole] Phone:", phone);

    const token = await auth.currentUser?.getIdToken(true);
    if (!token) throw new Error("Missing Firebase token");

    const uid = auth.currentUser?.uid;
    const email = auth.currentUser?.email ?? null;
    const provider = auth.currentUser?.providerData?.[0]?.providerId ?? "unknown";

    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL_FUNCTIONS;
    const url = `${baseUrl}/set-user-role`;

    const body = JSON.stringify({
      role,
      uid,
      email,
      provider,
      phone, // 👈🔥 this goes to Supabase now
    });

    console.log("📦 [saveUserRole] Sending:", body);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    console.log("🔵 [saveUserRole] Response status:", res.status);

    const data = await res.json();
    console.log("🔵 [saveUserRole] Response body:", data);

    if (!res.ok) {
      throw new Error(data.error || "Error saving role");
    }

    console.log("✅ [saveUserRole] Role saved:", data);
    return data;
  } catch (err: any) {
    console.error("❌ saveUserRole ERROR:", err.message);
    throw err;
  }
}
