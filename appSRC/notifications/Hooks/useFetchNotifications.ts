// appSRC/notifications/Hooks/useFetchNotifications.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useNotificationStore } from "@/appSRC/notifications/Store/NotificationStore";
import {
  fetchNotifications,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
  removeChannel,
} from "@/appSRC/notifications/Service/NotificationCrudService";
import { Notification } from "@/appSRC/notifications/Type/NotificationType";

// ---------------------------------------------------------------------------
// useFetchNotifications
// ---------------------------------------------------------------------------
// HOOK DE PANTALLA: Se usa en notifications.tsx (client y professional).
// Sigue el mismo patrón que useMessages: paginación + Realtime + guards.
//
// ARQUITECTURA: Service-Hook-View
//   - Este hook NO importa supabase. Toda interacción con la API
//     pasa por NotificationCrudService (Service layer).
//   - El Service retorna el RealtimeChannel, el hook hace cleanup.
//
// RETORNA:
//   - notifications: Lista ordenada (más reciente primero).
//   - loading / loadingMore / hasMore: Estados de UI.
//   - loadMore(): Para infinite scroll.
//   - refresh(): Para pull-to-refresh.
//   - handleMarkAllRead(): Marca todas como leídas.
//   - handleDelete(id): Elimina una notificación.
// ---------------------------------------------------------------------------
export function useFetchNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Refs para controlar concurrencia (mismo patrón que useMessages).
  const pageRef = useRef(0);
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.uid ?? null;

  const resetUnreadCount = useNotificationStore((s) => s.reset);

  // -----------------------------------------------------------------
  // FETCH PAGINADO (delega al Service)
  // -----------------------------------------------------------------
  const fetchPage = useCallback(
    async (isInitial = false) => {
      // Guards
      if (!currentUserId) return;
      if (isFetchingRef.current) return;
      if (!isInitial && !hasMoreRef.current) return;

      isFetchingRef.current = true;

      if (isInitial) {
        setLoading(true);
        pageRef.current = 0;
        hasMoreRef.current = true;
      } else {
        setLoadingMore(true);
      }

      try {
        const { notifications: fetched, hasMore: more } =
          await fetchNotifications(currentUserId, pageRef.current);

        hasMoreRef.current = more;
        setHasMore(more);

        setNotifications((prev) =>
          isInitial ? fetched : [...prev, ...fetched]
        );

        pageRef.current += 1;
      } catch (error) {
        console.error("❌ [useFetchNotifications] Error:", error);
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [currentUserId]
  );

  // -----------------------------------------------------------------
  // SUSCRIPCIÓN REALTIME (delega al Service)
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!currentUserId) return;

    // Fetch inicial
    fetchPage(true);

    // El Service crea el channel y lo retorna. El hook solo hace cleanup.
    const channel = subscribeToNotifications(
      currentUserId,
      (newNotification) => {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotification.id)) return prev;
          return [newNotification, ...prev];
        });
      }
    );

    return () => {
      console.log("🧹 [useFetchNotifications] Cleanup Realtime channel");
      removeChannel(channel);
    };
  }, [currentUserId, fetchPage]);

  // -----------------------------------------------------------------
  // ACCIONES (delegan al Service)
  // -----------------------------------------------------------------

  const loadMore = useCallback(() => {
    fetchPage(false);
  }, [fetchPage]);

  const refresh = useCallback(() => {
    fetchPage(true);
  }, [fetchPage]);

  const handleMarkAllRead = useCallback(async () => {
    if (!currentUserId) return;

    // Optimistic: reset badge to 0 instantly across all consumers.
    resetUnreadCount();
    setNotifications((prev) =>
      prev.map((n) => (n.is_read ? n : { ...n, is_read: true }))
    );

    try {
      await markAllAsRead(currentUserId);
    } catch (error) {
      console.error("❌ [useFetchNotifications] Error marking all:", error);
    }
  }, [currentUserId, resetUnreadCount]);

  const handleDelete = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("❌ [useFetchNotifications] Error deleting:", error);
    }
  }, []);

  return {
    notifications,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
    handleMarkAllRead,
    handleDelete,
  };
}
