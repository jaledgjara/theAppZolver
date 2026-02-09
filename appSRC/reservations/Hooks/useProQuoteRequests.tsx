import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { Reservation } from "../Type/ReservationType";
import { fetchProQuoteRequests } from "../Service/ReservationService";

/**
 * Hook: useProQuoteRequests
 *
 * Obtiene las solicitudes de presupuesto pendientes para el profesional.
 * Se usa en el tab Agenda (IndexQuoteScreen) para la sección "Nuevas Solicitudes".
 *
 * Diferencia con useProIncomingRequests:
 * - Este hook es para modality="quote" (presupuestos/agenda)
 * - useProIncomingRequests es para modality="instant" (radar)
 */
export const useProQuoteRequests = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    if (!user?.uid) return;

    try {
      console.log("[useProQuoteRequests] Fetching quote requests...");
      const data = await fetchProQuoteRequests(user.uid);
      setRequests(data);
    } catch (error) {
      console.error("[useProQuoteRequests] Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  // Refrescar al ganar foco
  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests();
  }, [loadRequests]);

  return {
    requests,
    loading,
    refreshing,
    onRefresh,
    refresh: loadRequests,
  };
};
