import { useCallback, useEffect, useState } from "react";
import { Reservation } from "../Type/ReservationType";
import { fetchReservationByIdForProfessional } from "../Service/ReservationService";

// En appSRC/reservations/Hooks/useReservationDetailsForProfessional.tsx
export const useQuoteStatusForProfessional = (id: string | undefined) => {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // ✅ Nuevo estado para carga silenciosa

  const getDetails = useCallback(
    async (silent = false) => {
      if (!id) return;
      try {
        if (!silent) setIsLoading(true); // Solo carga total si no es silencioso
        setIsRefreshing(true);
        const data = await fetchReservationByIdForProfessional(id);
        setReservation(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    getDetails();
  }, [getDetails]);

  return {
    reservation,
    isLoading,
    isRefreshing,
    refresh: () => getDetails(true),
  }; // ✅ Refresh ahora es silencioso
};
