import { useAuthStore } from "../Store/AuthStore";
import { signOut } from "firebase/auth";
import { auth } from "@/APIconfig/firebaseAPIConfig";
import { useRouter } from "expo-router";
// 👇 1. IMPORTA TU STORE DE UBICACIÓN
import { useLocationStore } from "@/appSRC/location/Store/LocationStore";

export const useSignOut = () => {
  const router = useRouter();
  const resetAuth = useAuthStore((state) => state.reset);

  // 👇 2. OBTÉN LA FUNCIÓN RESET
  const resetLocation = useLocationStore((state) => state.reset);

  const handleSignOut = async () => {
    try {
      // A. Cerrar en Firebase
      await signOut(auth);

      // B. Limpiar Store de Autenticación
      resetAuth();

      // C. 👇 LIMPIAR STORE DE UBICACIÓN (El fantasma)
      resetLocation();

      console.log("👋 Sesión cerrada y ubicación limpiada.");

      // D. Redirigir
      router.replace("/(auth)/WelcomeScreen");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return { handleSignOut };
};
