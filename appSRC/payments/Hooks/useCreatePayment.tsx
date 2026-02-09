import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { PaymentService } from "../Service/PaymentService";
import {
  CreatePaymentPayload,
  CreatePaymentResponseData,
} from "../Type/PaymentType";

/**
 * Hook for processing a booking payment (new card or saved card).
 * Manages loading, error, and success states.
 * View only needs to call `processPayment(payload)`.
 */
export const useCreatePayment = () => {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatePaymentResponseData | null>(null);

  const processPayment = useCallback(
    async (payload: CreatePaymentPayload) => {
      // Early return: no user
      if (!user || !user.uid) {
        Alert.alert("Error", "Debes iniciar sesión para continuar.");
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const data = await PaymentService.createPayment(payload);
        setResult(data);

        console.log("[useCreatePayment] Success:", data.reservation_id);

        Alert.alert(
          "Pago procesado",
          "Tu reserva fue creada exitosamente.",
          [
            {
              text: "Ver reserva",
              onPress: () =>
                router.replace(
                  `/(client)/(tabs)/reservations/ReservationDetailsScreen/${data.reservation_id}`
                ),
            },
          ]
        );
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error procesando el pago.";
        console.error("[useCreatePayment] Error:", message);
        setError(message);
        Alert.alert("Error en el pago", message);
      } finally {
        setLoading(false);
      }
    },
    [user, router]
  );

  return {
    processPayment,
    loading,
    error,
    result,
    isSuccess: result !== null,
  };
};
