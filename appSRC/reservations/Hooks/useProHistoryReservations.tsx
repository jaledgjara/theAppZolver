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

  // Carga inicial (Refresh)
  const loadInitialHistory = useCallback(async () => {
    console.log("🔍 [HISTORY_DEBUG] loadInitialHistory: INICIO");

    if (!user?.uid) {
      console.warn("⚠️ [HISTORY_DEBUG] No hay UID de usuario");
      return;
    }

    try {
      setIsLoading(true);
      console.log(`📡 [HISTORY_DEBUG] Fetching para ProID: ${user.uid}`);

      const { reservations, nextCursor } = await fetchProHistoryReservations(
        user.uid
      );

      console.log(`✅ [HISTORY_DEBUG] Items recibidos: ${reservations.length}`);

      // LOGUEAR LOS PRIMEROS ITEMS PARA VER ESTADOS
      if (reservations.length > 0) {
        reservations.forEach((r, index) => {
          if (index < 3) {
            // Solo los 3 primeros para no ensuciar
            console.log(
              `   👉 Item[${index}] ID: ${r.id} | Status: ${r.status} | Date: ${r.schedule}`
            );
          }
        });
      } else {
        console.log("   ⚪ [HISTORY_DEBUG] La lista vino vacía.");
      }

      setHistory(reservations);
      setCursor(nextCursor || undefined);
      setHasMore(!!nextCursor);
    } catch (error) {
      console.error("❌ [HISTORY_DEBUG] Error en loadInitialHistory:", error);
    } finally {
      setIsLoading(false);
      console.log("🏁 [HISTORY_DEBUG] loadInitialHistory: FIN (Loading false)");
    }
  }, [user?.uid]);

  // Cargar más (Paginación)
  const loadMoreHistory = async () => {
    if (!user?.uid || !hasMore || isFetchingMore || isLoading) return;

    console.log("⬇️ [HISTORY_DEBUG] loadMoreHistory: Cargando más páginas...");
    try {
      setIsFetchingMore(true);
      const { reservations: newBatch, nextCursor } =
        await fetchProHistoryReservations(user.uid, cursor);

      console.log(
        `✅ [HISTORY_DEBUG] Batch adicional recibido: ${newBatch.length}`
      );

      setHistory((prev) => [...prev, ...newBatch]);
      setCursor(nextCursor || undefined);
      setHasMore(!!nextCursor);
    } catch (error) {
      console.error("❌ [HISTORY_DEBUG] Error en loadMoreHistory:", error);
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
