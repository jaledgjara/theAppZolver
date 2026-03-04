import { useState } from "react";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { rejectReservationWithRefund } from "@/appSRC/reservations/Service/ReservationService";
import { createNotification } from "@/appSRC/notifications/Service/NotificationCrudService";

export const useRejectByProfessional = () => {
  const user = useAuthStore((state) => state.user);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Ejecuta el rechazo de la reserva con reembolso al cliente.
   * Fire-and-forget: No espera la respuesta del refund para dar feedback inmediato.
   */
  const rejectReservation = (
    reservationId: string,
    onSuccess?: () => void,
    clientId?: string
  ) => {
    if (!user?.uid) {
      console.error("[HOOK] Intento de rechazo sin sesion activa.");
      return;
    }

    setIsRejecting(true);
    setError(null);

    console.log(`[HOOK] Rechazando reserva ${reservationId} (fire-and-forget)...`);

    // Fire-and-forget: lanzamos el refund en background
    rejectReservationWithRefund(reservationId, "Rechazado por profesional", "professional")
      .then(() => {
        console.log("[HOOK] Refund procesado en background.");
      })
      .catch((err) => {
        console.error("[HOOK] Refund background error:", err);
      });

    // Side-effect: Notificar al cliente (fire & forget)
    if (clientId) {
      createNotification({
        user_id: clientId,
        title: "Solicitud rechazada",
        body: "El profesional no puede tomar el servicio en este momento. Tu pago sera reembolsado.",
        type: "reservation_rejected",
        data: { reservation_id: reservationId, screen: "/(client)/(tabs)/reservations" },
      });
    }

    // Feedback inmediato
    console.log("[HOOK] Reserva rechazada. Refund en proceso.");
    if (onSuccess) onSuccess();
    setIsRejecting(false);
  };

  return {
    rejectReservation,
    isRejecting,
    error,
  };
};
