import { useAuthStore } from "../Store/AuthStore";
import { signOut } from "firebase/auth";
import { auth } from "@/APIconfig/firebaseAPIConfig";
import { useRouter } from "expo-router";
import { useLocationStore } from "@/appSRC/location/Store/LocationStore";
import { setSupabaseAuthToken } from "@/appSRC/services/supabaseClient";
import { Alert } from "react-native";

export const useSignOut = () => {
  const router = useRouter();
  const resetAuth = useAuthStore((state) => state.reset);
  const resetLocation = useLocationStore((state) => state.reset);

  const performSignOut = async () => {
    try {
      await signOut(auth);
      await setSupabaseAuthToken(null);
      resetAuth();
      resetLocation();
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
