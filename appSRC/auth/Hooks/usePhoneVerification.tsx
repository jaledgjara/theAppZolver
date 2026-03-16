import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { fetchWithTimeout } from "@/appSRC/utils/fetchWithTimeout";
import { auth } from "@/APIconfig/firebaseAPIConfig";

export function usePhoneVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setUser, user, setStatus } = useAuthStore();
  const router = useRouter();

  const functionsBase =
    process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL ??
    process.env.EXPO_PUBLIC_SUPABASE_URL!.replace(".supabase.co", ".functions.supabase.co");

  // -------------------------------
  // 1) SEND CODE
  // -------------------------------
  const sendCode = async (phone: string) => {
    try {
      setLoading(true);
      setError(null);

      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("No hay sesión activa");

      const res = await fetchWithTimeout(`${functionsBase}/send-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone }),
      });

      const raw = await res.text();
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { error: "Invalid JSON", raw };
      }

      console.log("[sendCode] Response status:", res.status, "data:", JSON.stringify(data));

      if (!res.ok || data.error) {
        const errorMsg =
          data.error || data.details?.message || `Error del servidor (${res.status})`;
        throw new Error(errorMsg);
      }

      return { ok: true, error: null };
    } catch (e: any) {
      console.error("[sendCode] Error:", e.message);
      setError(e.message);
      return { ok: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // 2) VERIFY CODE
  // -------------------------------
  const verifyCode = async (phone: string, code: string) => {
    try {
      setLoading(true);
      setError(null);

      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("No hay sesión activa");

      const res = await fetchWithTimeout(`${functionsBase}/check-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone, code }),
      });

      const raw = await res.text();
      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { error: "Invalid JSON", raw };
      }

      if (!res.ok || data.error || !data.valid) {
        throw new Error(data.error || "Código incorrecto o expirado");
      }

      setUser({
        ...(user as any),
        phoneNumber: phone,
        profileComplete: false,
      });

      // 🔥 Dispara al AuthGuard
      setStatus("phoneVerified");

      Alert.alert("Éxito", "Teléfono verificado correctamente");

      return { ok: true };
    } catch (e: any) {
      setError(e.message);
      Alert.alert("Error", e.message);
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  return { sendCode, verifyCode, loading, error };
}
