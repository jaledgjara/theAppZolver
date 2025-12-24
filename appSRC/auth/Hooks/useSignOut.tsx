import { useAuthStore } from "../Store/AuthStore";
import { signOut } from "firebase/auth";
import { auth } from "@/APIconfig/firebaseAPIConfig";
import { useRouter } from "expo-router";
// 👇 1. IMPORTA TU STORE DE UBICACIÓN
import { useLocationStore } from "@/appSRC/location/Store/LocationStore";
import { Alert } from "react-native";

export const useSignOut = () => {
  const router = useRouter();
  const resetAuth = useAuthStore((state) => state.reset);

  // 👇 2. OBTÉN LA FUNCIÓN RESET
  const resetLocation = useLocationStore((state) => state.reset);

  const performSignOut = async () => {
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

  /**
   * Función pública que dispara la UI de confirmación.
   */
  const handleSignOut = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres salir de tu cuenta?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar Sesión",
          style: "destructive", // En iOS muestra el texto en rojo
          onPress: performSignOut,
        },
      ]
    );
  };

  return { handleSignOut };
};
