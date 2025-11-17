import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function usePhoneVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setUser, user, setStatus } = useAuthStore();
  const router = useRouter();

  const functionsBase =
    process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL ??
    process.env.EXPO_PUBLIC_SUPABASE_URL!.replace(
      ".supabase.co",
      ".functions.supabase.co"
    );

  // -------------------------------
  // 1) SEND CODE
  // -------------------------------
  const sendCode = async (phone: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${functionsBase}/send-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
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

      if (!res.ok || data.error) {
        throw new Error(data.error || "No se pudo enviar el código");
      }

      return { ok: true };
    } catch (e: any) {
      setError(e.message);
      Alert.alert("Error", e.message);
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // 2) VERIFY CODE
  // -------------------------------
// -------------------------------
// 2) VERIFY CODE
// -------------------------------
const verifyCode = async (phone: string, code: string) => {
  try {
    setLoading(true);
    setError(null);

    const res = await fetch(`${functionsBase}/check-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
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

    await AsyncStorage.setItem("profileComplete", "false");

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