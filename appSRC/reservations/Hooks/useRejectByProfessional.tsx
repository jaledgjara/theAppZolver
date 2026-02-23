import { useState } from "react";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { rejectReservationByPro } from "@/appSRC/reservations/Service/ReservationService";
import { Alert } from "react-native";
import { createNotification } from "@/appSRC/notifications/Service/NotificationCrudService";

export const useRejectByProfessional = () => {
  const user = useAuthStore((state) => state.user);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Ejecuta el rechazo de la reserva.
   * @param reservationId ID de la reserva a rechazar.
   * @param onSuccess Callback opcional para refrescar listas o navegar.
   */
  const rejectReservation = async (
    reservationId: string,
    onSuccess?: () => void,
    clientId?: string
  ) => {
    // 1. Validación de Seguridad Local
    if (!user?.uid) {
      console.error("❌ [HOOK] Intento de rechazo sin sesión activa.");
      return;
    }

    setIsRejecting(true);
    setError(null);

    try {
      // 2. Llamada al Servicio
      console.log(`🛡️ [HOOK] Rechazando reserva ${reservationId}...`);
      await rejectReservationByPro(reservationId, user.uid);

      // 3. Side-effect: Notificar al cliente (fire & forget)
      if (clientId) {
        createNotification({
          user_id: clientId,
          title: "Solicitud rechazada",
          body: "El profesional no puede tomar el servicio en este momento.",
          type: "reservation_rejected",
          data: { reservation_id: reservationId, screen: "/(client)/(tabs)/reservations" },
        });
      }

      // 4. Feedback Exitoso
      console.log("✅ [HOOK] Reserva rechazada correctamente.");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // 4. Manejo de Errores
      console.error("❌ [HOOK] Error al rechazar:", err);
      const msg = err.message || "No se pudo rechazar la reserva.";
      setError(msg);
      Alert.alert(
        "Error",
        "Ocurrió un problema al rechazar la solicitud. Intenta nuevamente."
      );
    } finally {
      setIsRejecting(false);
    }
  };

  return {
    rejectReservation,
    isRejecting, // Úsalo para mostrar un Spinner en el botón
    error,
  };
};
