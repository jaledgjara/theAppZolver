import { signOut } from "firebase/auth";
import { auth } from "@/APIconfig/firebaseAPIConfig";
import { useLocationStore } from "@/appSRC/location/Store/LocationStore";
import { setSupabaseAuthToken } from "@/appSRC/services/supabaseClient";
import { Alert } from "react-native";

export const useSignOut = () => {
  const resetLocation = useLocationStore((state) => state.reset);

  const performSignOut = async () => {
    try {
      // Limpiar side effects que el AuthListener no cubre ANTES de signOut
      // para evitar queries con token viejo
      await setSupabaseAuthToken(null);
      resetLocation();

      // El AuthListener detecta null → setea "anonymous" → AuthGuard redirige
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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
          style: "destructive",
          onPress: performSignOut,
        },
      ]
    );
  };

  return { handleSignOut };
};
