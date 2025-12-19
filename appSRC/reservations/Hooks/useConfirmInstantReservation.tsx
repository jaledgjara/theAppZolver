import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { confirmInstantReservationService } from "../Service/ReservationService";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";

export const useConfirmInstantReservation = () => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const router = useRouter();

  const confirmRequest = async (reservationId: string) => {
    if (!user) return;

    setProcessingId(reservationId); // Activa loader específico para esa tarjeta
    console.log(`[ZOLVER-DEBUG] Hook: Aceptando solicitud ${reservationId}...`);

    try {
      // 1. Llamada al Servicio
      const confirmedReservation = await confirmInstantReservationService(
        reservationId,
        user.uid
      );

      // 2. Feedback Inmediato
      Alert.alert(
        "¡Trabajo Aceptado!",
        "Tu estado ha cambiado a 'Ocupado'. Dirígete a la ubicación del cliente.",
        [
          {
            text: "IR AL MAPA (EN CAMINO)",
            onPress: () => {
              // 3. Navegación al flujo de ejecución (On Route)
              router.replace({
                pathname:
                  "/(professional)/(tabs)/reservations/ReservationDetailsScreen/[id]",
                params: { id: confirmedReservation.id },
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("[ZOLVER-DEBUG] Error en Hook:", error);
      Alert.alert(
        "Error",
        "No se pudo aceptar el trabajo. Es posible que otro profesional lo haya tomado."
      );
    } finally {
      setProcessingId(null);
    }
  };

  return {
    confirmRequest,
    processingId, // Para mostrar spinner en el botón específico
  };
};
