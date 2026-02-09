import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { confirmQuoteReservationService } from "../Service/ReservationService";

/**
 * Hook: useConfirmQuoteReservation
 *
 * Confirma una solicitud de presupuesto (modality="quote").
 * A diferencia de useConfirmInstantReservation:
 * - NO desactiva al profesional (is_active sigue en true)
 * - El profesional puede seguir recibiendo requests en el radar
 */
export const useConfirmQuoteReservation = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const confirmQuoteRequest = useCallback(
    async (reservationId: string, onSuccess?: () => void) => {
      if (!user?.uid) return;

      setLoading(true);
      try {
        await confirmQuoteReservationService(reservationId, user.uid);

        Alert.alert("Trabajo aceptado", "Se agregó a tu agenda de trabajos.");
        onSuccess?.();
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Error al confirmar el trabajo.";
        console.error("[useConfirmQuoteReservation] Error:", message);
        Alert.alert("Error", message);
      } finally {
        setLoading(false);
      }
    },
    [user?.uid]
  );

  return { confirmQuoteRequest, loading };
};
