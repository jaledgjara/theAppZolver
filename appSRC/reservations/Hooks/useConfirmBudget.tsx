import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { confirmBudgetService } from "../Service/ReservationService";
import { updateBudgetMessageStatusService } from "@/appSRC/messages/Service/MessageService";
import { createNotification } from "@/appSRC/notifications/Service/NotificationCrudService";

export const useConfirmBudget = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const DEBUG_TAG = "⚡ [DEBUG-FLOW] [Hook]";

  const confirmBudget = async (
    clientId: string,
    professionalId: string,
    budgetPayload: any,
    messageId: string
  ) => {
    console.log(`${DEBUG_TAG} START: Confirmando presupuesto...`);
    setLoading(true);

    try {
      // PASO 1
      console.log(`${DEBUG_TAG} Paso 1: Creando Reserva...`);
      const newReservationId = await confirmBudgetService(
        clientId,
        professionalId,
        budgetPayload
      );
      console.log(`${DEBUG_TAG} ✅ Reserva Creada ID:`, newReservationId);

      // PASO 2
      console.log(`${DEBUG_TAG} Paso 2: Actualizando Mensaje a 'confirmed'...`);
      const updatedPayload = {
        ...budgetPayload,
        status: "confirmed",
      };

      const updateSuccess = await updateBudgetMessageStatusService(
        messageId,
        updatedPayload
      );

      if (updateSuccess) {
        console.log(`${DEBUG_TAG} ✅ Ciclo completado correctamente.`);
      } else {
        console.warn(
          `${DEBUG_TAG} ⚠️ Reserva creada pero falló update del mensaje.`
        );
      }

      // PASO 3: Notificar al profesional (fire & forget)
      createNotification({
        user_id: professionalId,
        title: "Presupuesto aceptado",
        body: "El cliente aceptó tu propuesta. Tienes un nuevo trabajo.",
        type: "budget_accepted",
        data: { reservation_id: newReservationId, screen: "/(professional)/(tabs)/home" },
      });

      // PASO 4
      Alert.alert("¡Éxito!", "Servicio contratado correctamente.", [
        {
          text: "Ver Reserva",
          onPress: () => {
            console.log(`${DEBUG_TAG} 🚀 Navegando a detalles de reserva...`);
            router.replace({
              pathname: "/(client)/(tabs)/reservations",
              params: { id: newReservationId },
            });
          },
        },
      ]);
    } catch (error: any) {
      console.error(`${DEBUG_TAG} 💥 Error Fatal:`, error);
      Alert.alert("Error", "Hubo un problema al confirmar la reserva.");
    } finally {
      setLoading(false);
    }
  };

  return { confirmBudget, loading };
};
