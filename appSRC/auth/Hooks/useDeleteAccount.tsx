import { Alert } from "react-native";
import { deleteUserAccount } from "../Service/AuthService";
import { useAuthStore } from "../Store/AuthStore";

export const useDeleteAccount = () => {
  const { setBootLoading } = useAuthStore();

  /**
   * Inicia el flujo de eliminación.
   * 1. Pide confirmación explícita al usuario (Doble Check).
   * 2. Llama al servicio de eliminación segura.
   * 3. Maneja errores de UI.
   */
  const requestDeleteAccount = () => {
    Alert.alert(
      "¿Eliminar cuenta permanentemente?",
      "Esta acción es irreversible. Si eres Cliente, perderás tu historial. Si eres Profesional, perderás tus ingresos registrados. \n\n¿Estás seguro?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar mi cuenta",
          style: "destructive",
          onPress: performDelete,
        },
      ]
    );
  };

  const performDelete = async () => {
    const result = await deleteUserAccount();

    if (!result.ok) {
      setTimeout(() => {
        Alert.alert("No se pudo eliminar", result.message);
      }, 500);
    } else {
    }
  };

  return {
    requestDeleteAccount,
  };
};
