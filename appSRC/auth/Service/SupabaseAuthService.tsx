// src/modules/auth/services/userRoleService.ts

import { auth } from "@/APIconfig/firebaseAPIConfig";

export async function saveUserRole(role: "client" | "professional") {
  try {
    console.log("🔵 [saveUserRole] START");
    console.log("🔵 [saveUserRole] Requested role:", role);

    // 🔥 We ALWAYS need a valid Firebase token (Supabase requires it)
    const token = await auth.currentUser?.getIdToken(true);

    if (!token) throw new Error("Missing Firebase token");

    console.log("🟢 [saveUserRole] Firebase token OK (refreshed)");

    const uid = auth.currentUser?.uid;
    const email = auth.currentUser?.email ?? null;
    const provider = auth.currentUser?.providerData?.[0]?.providerId ?? "unknown";

    console.log("👤 [saveUserRole] UID:", uid);
    console.log("📧 [saveUserRole] Email:", email);
    console.log("🔌 [saveUserRole] Provider:", provider);

    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL_FUNCTIONS;
    const url = `${baseUrl}/set-user-role`;

    const body = JSON.stringify({
      role,
      // 🔥 send uid/email/provider to backend so it creates user_accounts
      uid,
      email,
      provider,
    });

    console.log("📦 [saveUserRole] Sending:", body);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 🔥 We send Firebase token BUT set-user-role does NOT verify it.
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
