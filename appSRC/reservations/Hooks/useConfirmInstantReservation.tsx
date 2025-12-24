import { useState } from "react";
import { Alert } from "react-native";
import { confirmInstantReservationService } from "../Service/ReservationService";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";

export const useConfirmInstantReservation = () => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { user } = useAuthStore();

  const confirmRequest = async (
    reservationId: string,
    onSuccess?: () => void // <--- Callback para refrescar la UI padre
  ) => {
    if (!user) return;

    setProcessingId(reservationId);
    console.log(`[ZOLVER-DEBUG] Hook: Aceptando solicitud ${reservationId}...`);

    try {
      // 1. Llamada al Servicio (Transacción atómica)
      await confirmInstantReservationService(reservationId, user.uid);

      // 2. Ejecutar Callback de éxito
      // Esto gatilla 'refreshActiveJob()' en IndexInstantScreen, cambiando la vista instantáneamente
      if (onSuccess) {
        onSuccess();
      }

      // 3. Feedback Visual simple (sin navegación forzada)
      Alert.alert(
        "¡Trabajo Aceptado!",
        "Tu estado ahora es 'Ocupado'. Tienes el control del servicio en pantalla."
      );
    } catch (error: any) {
      console.error("[ZOLVER-DEBUG] Error en Hook:", error);
      Alert.alert(
        "Error",
        "No se pudo aceptar el trabajo. Es posible que otro profesional lo haya tomado antes."
      );
    } finally {
      setProcessingId(null);
    }
  };

  return {
    confirmRequest,
    processingId,
  };
};
