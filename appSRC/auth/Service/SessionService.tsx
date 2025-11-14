// src/services/sessionService.ts
import { auth } from "@/APIconfig/firebaseAPIConfig";

/**
 * 🔹 Sincroniza el usuario actual de Firebase con Supabase
 * Envía el idToken al endpoint /session-sync (Edge Function)
 * Retorna los datos del usuario creados o actualizados en Postgres.
 */
export async function syncUserSession() {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("No hay token de Firebase disponible.");

    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL_FUNCTIONS;
    const fullUrl = `${baseUrl}/session-sync`;

    console.log("🌍 [sessionService] Base URL:", baseUrl);
    console.log("📡 [sessionService] Full URL:", fullUrl);
    console.log("🔑 [sessionService] Token (first 30 chars):", token.slice(0, 30));

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("📡 [sessionService] Response status:", response.status);

    const data = await response.json();
    console.log("📦 [sessionService] Raw response:", data);

    if (!response.ok) throw new Error(data.error || "Error al sincronizar sesión");

    console.log("✅ [sessionService] Sesión sincronizada:", data);
    return data;
  } catch (err: any) {
    console.error("❌ [sessionService] Error:", err.message);
    return null;
  }
}
