// 1. IMPORTS NECESARIOS
import {
  useQuery,
  useInfiniteQuery,
  InfiniteData,
} from "@tanstack/react-query";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import {
  fetchClientActiveReservations,
  fetchClientPendingReservations,
  fetchClientHistoryReservations,
} from "../Service/ReservationService";

export const useClientReservations = () => {
  // Cambié el nombre para consistencia
  const { user } = useAuthStore();
  const clientId = user?.uid;

  // 1. ACTIVAS
  const activeQuery = useQuery({
    queryKey: ["reservations", "active", clientId],
    queryFn: () => fetchClientActiveReservations(clientId!),
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5,
  });

  // 2. PENDIENTES
  const pendingQuery = useQuery({
    queryKey: ["reservations", "pending", clientId],
    queryFn: () => fetchClientPendingReservations(clientId!),
    enabled: !!clientId,
  });

  // 3. HISTORIAL (Corrección de TypeScript)
  const historyQuery = useInfiniteQuery({
    queryKey: ["reservations", "history", clientId],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchClientHistoryReservations(clientId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!clientId,
  });

  // Aplanar paginación
  const historyReservations =
    historyQuery.data?.pages.flatMap((page) => page.reservations) || [];

  return {
    activeReservations: activeQuery.data || [],
    pendingReservations: pendingQuery.data || [],
    historyReservations,

    isLoadingActive: activeQuery.isLoading,
    isLoadingPending: pendingQuery.isLoading,
    isLoadingHistory: historyQuery.isLoading,

    fetchNextHistory: historyQuery.fetchNextPage,
    hasNextHistory: historyQuery.hasNextPage,
    isFetchingNextHistory: historyQuery.isFetchingNextPage,

    refreshAll: async () => {
      await Promise.all([
        activeQuery.refetch(),
        pendingQuery.refetch(),
        historyQuery.refetch(),
      ]);
    },
  };
};
