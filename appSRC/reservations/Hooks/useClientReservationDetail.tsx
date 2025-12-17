import { useQuery } from "@tanstack/react-query";
import { fetchReservationById } from "../Service/ReservationService";

export const useReservationDetail = (reservationId: string) => {
  const query = useQuery({
    queryKey: ["reservation", "detail", reservationId],
    queryFn: () => fetchReservationById(reservationId),
    enabled: !!reservationId && reservationId !== "undefined", // Evita llamadas con IDs inválidos
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
    retry: 1,
  });

  return {
    reservation: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
