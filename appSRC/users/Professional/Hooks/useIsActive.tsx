import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore"; // Importamos tu Store existente
import { ProfessionalStatusService } from "../Service/ProfessionalStatusService";

export const useIsActive = () => {
  // Obtenemos el ID del usuario desde tu AuthStore existente
  const { user } = useAuthStore();
  const userId = user?.uid;

  const [isActive, setIsActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Cargar estado inicial al montar
  useEffect(() => {
    if (!userId) return;

    const init = async () => {
      try {
        const status = await ProfessionalStatusService.fetchActiveStatus(
          userId
        );
        setIsActive(status);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [userId]);

  // 2. Función Toggle (Switch)
  const toggleStatus = useCallback(async () => {
    if (!userId) return;

    const previousState = isActive;
    const newState = !isActive;

    // UI Optimista: Cambiamos visualmente antes de la respuesta del servidor
    setIsActive(newState);

    try {
      await ProfessionalStatusService.updateActiveStatus(userId, newState);
      console.log(`✅ Estado actualizado: ${newState ? "ACTIVO" : "INACTIVO"}`);
    } catch (error) {
      // Rollback si falla
      setIsActive(previousState);
      Alert.alert("Error de conexión", "No se pudo actualizar tu estado.");
      console.error(error);
    }
  }, [isActive, userId]);

  return {
    isActive,
    isLoading,
    toggleStatus,
  };
};
