import { Alert } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { signInWithAppleFirebase } from "../Service/AuthService";
import { useAuthStore } from "../Store/AuthStore";

export function useAppleSignIn() {
  const { setTransitionDirection } = useAuthStore();

  const handleAppleSignIn = async () => {
    // Verify Apple Sign-In is available on this device before attempting
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      Alert.alert(
        "No disponible",
        "Sign in with Apple no está disponible en este dispositivo. Asegurate de estar usando un iPhone o iPad con iOS 13 o superior.",
      );
      return;
    }

    setTransitionDirection("forward");

    // Solo dispara Firebase — el AuthListener maneja user, status y redirección
    const result = await signInWithAppleFirebase();

    if (!result.ok) {
      console.error("[useAppleSignIn] Apple Sign-In failed:", result.message, "code:", result.code);

      // ERR_CANCELED: user dismissed the sheet — no alert needed
      if (result.message === "Canceled by user") return;

      // Error 1000 (ASAuthorizationErrorUnknown): device/account config issue
      const isError1000 =
        result.code === "1000" ||
        result.message?.includes("1000") ||
        result.message?.includes("unknown reason");

      const userMessage = isError1000
        ? "No se pudo iniciar sesión con Apple. Verificá que:\n\n• Estés conectado a iCloud en Ajustes\n• Tengas verificación en dos pasos activada en tu Apple ID\n• La app esté autorizada en Ajustes → [Tu nombre] → Contraseña y seguridad → Apps que usan tu Apple ID"
        : result.message || "Ocurrió un error al iniciar sesión con Apple. Intentá de nuevo.";

      Alert.alert("Error con Apple", userMessage);
    }
  };

  return { handleAppleSignIn };
}
