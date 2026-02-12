import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  createInstantReservation,
  createQuoteReservation,
} from "../Service/ReservationService";
import { ProfessionalTypeWork } from "@/appSRC/users/Model/ProfessionalTypeWork";
import { ReservationPayload } from "../Type/ReservationType";
import { createNotification } from "@/appSRC/notifications/Service/NotificationCrudService";

export const useCreateReservation = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createReservation = async (
    mode: ProfessionalTypeWork,
    payload: ReservationPayload
  ) => {
    setLoading(true);
    try {
      // 1. Ejecutar Lógica de Negocio (Backend)
      const reservation =
        mode === "instant"
          ? await createInstantReservation(payload)
          : await createQuoteReservation(payload);

      // 2. Side-effect: Notificar al profesional (fire & forget)
      createNotification({
        user_id: payload.professional_id,
        title: mode === "instant" ? "Nueva solicitud" : "Nueva consulta de presupuesto",
        body: `Un cliente solicita un servicio de ${payload.service_category}.`,
        type: "reservation_new",
        data: { reservation_id: reservation.id, screen: "/(professional)/(tabs)/home" },
      });

      // 3. Feedback al Usuario (UI)
      const successTitle =
        mode === "instant" ? "Solicitud Enviada" : "Presupuesto Iniciado";

      const successMessage =
        mode === "instant"
          ? "El profesional revisará tu pedido. Te avisaremos cuando confirme."
          : "Solicitud creada. Ahora puedes negociar los detalles por chat.";

      Alert.alert(successTitle, successMessage, [
        {
          text: "Continuar",
          onPress: () => {
            // 3. Navegación Inteligente (Router)
            if (mode === "instant") {
              router.replace({
                pathname: "/(client)/(tabs)/reservations",
                params: { id: reservation.id },
              });
            } else {
              router.replace({
                pathname: "/(client)/(tabs)/messages",
                params: {
                  id: payload.professional_id,
                  reservationId: reservation.id,
                  name: "Nueva Consulta",
                },
              });
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error("Error creating reservation:", error);
      Alert.alert(
        "No se pudo crear",
        error.message || "Ocurrió un error inesperado. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    createReservation,
    loading,
  };
};
