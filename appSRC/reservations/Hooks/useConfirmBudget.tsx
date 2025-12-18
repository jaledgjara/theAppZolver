import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { confirmBudgetService } from "../Service/ReservationService";
import { supabase } from "@/appSRC/services/supabaseClient";

export const useConfirmBudget = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const confirmBudget = async (
    clientId: string,
    professionalId: string,
    budgetPayload: any,
    messageId: string
  ) => {
    setLoading(true);
    try {
      // 1. Crear Reserva
      const newReservationId = await confirmBudgetService(
        clientId,
        professionalId,
        budgetPayload
      );

      // 2. Actualizar Mensaje a Accepted
      const updatedPayload = { ...budgetPayload, status: "accepted" };
      await supabase
        .from("messages")
        .update({ payload: updatedPayload })
        .eq("id", messageId);

      // 3. ÉXITO: Navegación Crítica
      // Usamos .replace para que al dar "Atrás" desde la reserva, no vuelva al ticket de pago.
      Alert.alert("¡Éxito!", "Servicio contratado correctamente.", [
        {
          text: "Ver Reserva",
          onPress: () => {
            // 🚀 SALTO DE STACK: De Mensajes -> A Detalle de Reserva
            router.replace({
              pathname: "/(client)/(tabs)/reservations",
              params: { id: newReservationId },
            });
          },
        },
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "Hubo un problema al confirmar.");
    } finally {
      setLoading(false);
    }
  };

  return { confirmBudget, loading };
};
