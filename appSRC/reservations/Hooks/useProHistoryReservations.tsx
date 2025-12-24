import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useState, useEffect, useCallback } from "react";
import { Reservation } from "../Type/ReservationType";
import { fetchProHistoryReservations } from "../Service/ReservationService";

export const useProHistoryReservations = () => {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);

  // Carga inicial
  const loadInitialHistory = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setIsLoading(true);
      const { reservations, nextCursor } = await fetchProHistoryReservations(
        user.uid
      );
      setHistory(reservations);
      setCursor(nextCursor || undefined);
      setHasMore(!!nextCursor);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Cargar más (Paginación)
  const loadMoreHistory = async () => {
    if (!user?.uid || !hasMore || isFetchingMore || isLoading) return;

    try {
      setIsFetchingMore(true);
      // Usamos el cursor actual para pedir la siguiente página
      const { reservations: newBatch, nextCursor } =
        await fetchProHistoryReservations(user.uid, cursor);

      setHistory((prev) => [...prev, ...newBatch]);
      setCursor(nextCursor || undefined);
      setHasMore(!!nextCursor);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    loadInitialHistory();
  }, [loadInitialHistory]);

  return {
    history,
    isLoading,
    isFetchingMore,
    refresh: loadInitialHistory,
    loadMore: loadMoreHistory,
  };
};
