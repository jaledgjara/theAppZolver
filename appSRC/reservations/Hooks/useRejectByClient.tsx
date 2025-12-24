import { useState } from "react";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { cancelReservationByClient } from "@/appSRC/reservations/Service/ReservationService"; // Ajusta la ruta a tu service
import { Alert } from "react-native";

export const useRejectByClient = () => {
  const user = useAuthStore((state) => state.user);
  const [isCanceling, setIsCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Ejecuta la cancelación de la solicitud por parte del cliente.
   * @param reservationId ID de la reserva a cancelar.
   * @param onSuccess Callback opcional (ej: volver al Home).
   */
  const cancelReservation = async (
    reservationId: string,
    onSuccess?: () => void
  ) => {
    // 1. Validación de Seguridad Local
    if (!user?.uid) {
      console.error("❌ [HOOK] Intento de cancelación sin sesión activa.");
      return;
    }

    setIsCanceling(true);
    setError(null);

    try {
      // 2. Llamada al Servicio
      console.log(
        `🗑️ [HOOK] Cancelando reserva ${reservationId} por cliente...`
      );
      await cancelReservationByClient(reservationId, user.uid);

      // 3. Feedback Exitoso
      console.log("✅ [HOOK] Reserva cancelada correctamente.");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // 4. Manejo de Errores
      console.error("❌ [HOOK] Error al cancelar:", err);
      const msg = err.message || "No se pudo cancelar la reserva.";
      setError(msg);
      Alert.alert(
        "Error",
        "No pudimos procesar la cancelación. Verifica tu conexión."
      );
    } finally {
      setIsCanceling(false);
    }
  };

  return {
    cancelReservation,
    isCanceling,
    error,
  };
};
