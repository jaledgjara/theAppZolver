import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { PaymentService } from "../Service/PaymentService";
import { Payment } from "../Type/PaymentType";

/**
 * Hook for fetching the payment history of the current user.
 * Auto-reloads on screen focus via useFocusEffect.
 */
export const usePaymentHistory = () => {
  const { user } = useAuthStore();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    // Early return: no user
    if (!user || !user.uid) {
      console.warn("[usePaymentHistory] No user in AuthStore.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await PaymentService.fetchPaymentsByClient(user.uid);

      console.log(`[usePaymentHistory] Loaded ${data.length} payments.`);
      setPayments(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error cargando historial.";
      console.error("[usePaymentHistory] Error:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Reload on screen focus (navigating back, tab switch, etc.)
  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [loadPayments])
  );

  return {
    payments,
    loading,
    error,
    refetch: loadPayments,
    isEmpty: !loading && payments.length === 0,
  };
};
