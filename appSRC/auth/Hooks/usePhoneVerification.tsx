import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function usePhoneVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setLastPhone, setUser, setStatus } = useAuthStore();
  const router = useRouter();

  const functionsBase =
    process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL ??
    process.env.EXPO_PUBLIC_SUPABASE_URL!.replace(
      ".supabase.co",
      ".functions.supabase.co"
    );

  // 🔹 1. Enviar código SMS
  const sendCode = async (phone: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log("📱 [usePhoneVerification] START sendCode()");
      console.log("🔹 phone param:", phone);
      console.log("🌍 functionsBase:", functionsBase);
      console.log("🧭 full URL:", `${functionsBase}/send-verification`);

      const res = await fetch(`${functionsBase}/send-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`, // 👈 clave pública
        },
        body: JSON.stringify({ phone }),
      });
      

      console.log("📡 [sendCode] HTTP status:", res.status);
      const text = await res.text(); // leer texto bruto para depurar errores HTML
      console.log("📦 [sendCode] Raw response:", text);

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        console.warn("⚠️ [sendCode] Could not parse JSON:", text);
        data = { error: "Non-JSON response", raw: text };
      }

      if (!res.ok || data.error) throw new Error(data.error || "No se pudo enviar el código");

      setLastPhone(phone);
      console.log("✅ [sendCode] Código enviado correctamente → lastPhone set en Zustand");
      
      return { ok: true };
    } catch (e: any) {
      console.error("❌ [sendCode] Error:", e.message);
      setError(e.message);
      Alert.alert("Error", e.message);
      return { ok: false };
    } finally {
      console.log("🏁 [sendCode] END (loading=false)");
      setLoading(false);
    }
  };

// 🔹 2. Verificar el código SMS
const verifyCode = async (phone: string, code: string) => {
  try {
    setLoading(true);
    setError(null);

    console.log("🔢 [usePhoneVerification] START verifyCode()");
    console.log("📞 phone:", phone);
    console.log("💬 code:", code);
    console.log("🌍 functionsBase:", functionsBase);

    const res = await fetch(`${functionsBase}/check-verification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`, // 👈 clave pública
      },
      body: JSON.stringify({ phone, code }),
    });

    console.log("🔑 anonKey present?:", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!);
    console.log("📡 [verifyCode] HTTP status:", res.status);
    const text = await res.text();
    console.log("📦 [verifyCode] Raw response:", text);

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.warn("⚠️ [verifyCode] Could not parse JSON, using raw text");
      data = { raw: text };
    }

    console.log("🧩 [verifyCode] Parsed data:", data);

    // 🔍 Manejo explícito según respuesta
    if (res.status === 401) {
      const msg =
        data.message ||
        "No autorizado al verificar. Revisa el Authorization header o la anon key.";
      throw new Error(msg);
    }

    if (!res.ok) {
      const msg =
        data.error ||
        data.message ||
        `Error al verificar código (status ${res.status})`;
      throw new Error(msg);
    }

    if (!data.valid) {
      throw new Error("Código incorrecto o expirado");
    }

    console.log("✅ [verifyCode] Código validado → actualizando Zustand");

    // 🟩 CAMBIO 1: persistimos el estado base del perfil
    // Esto evita que el listener de Firebase reemplace el estado con preAuth.
    await AsyncStorage.setItem("profileComplete", "false");

    // 🟩 CAMBIO 2: setUser incluye un uid temporal y phoneNumber
    // para mantener consistencia con el tipo AuthUser.
    setUser({
      phoneNumber: phone,
      profileComplete: false,
    } as any);

    // 🟩 CAMBIO 3: cambiamos el estado antes de navegar
    setStatus("preTypeOfUser");

    Alert.alert("Éxito", "Teléfono verificado correctamente");

    // 🟩 CAMBIO 4: corregimos la ruta a la real definida en AUTH_PATHS
    router.replace("(auth)/TypeOfUserScreen");

    return { ok: true };
  } catch (e: any) {
    console.error("❌ [verifyCode] Error:", e.message);
    setError(e.message);
    Alert.alert("Error", e.message);
    return { ok: false };
  } finally {
    console.log("🏁 [verifyCode] END (loading=false)");
    setLoading(false);
  }
};

  return { sendCode, verifyCode, loading, error };
}