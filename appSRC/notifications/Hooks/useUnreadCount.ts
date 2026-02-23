// appSRC/notifications/Hooks/useUnreadCount.ts
import { useEffect, useCallback } from "react";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useNotificationStore } from "@/appSRC/notifications/Store/NotificationStore";
import {
  getUnreadCount,
  subscribeToUnreadCount,
  removeChannel,
} from "@/appSRC/notifications/Service/NotificationCrudService";

// ---------------------------------------------------------------------------
// useUnreadCount
// ---------------------------------------------------------------------------
// HOOK GLOBAL: Se puede montar en CUALQUIER lugar que necesite el badge.
//
// ARQUITECTURA: Service-Hook-Store-View
//   - Usa un Zustand store (NotificationStore) para que TODOS los
//     consumidores compartan el mismo estado. Cuando "Marcar todas como
//     leídas" setea el count a 0, TODAS las badges se actualizan al instante.
//   - Este hook NO importa supabase. Toda interacción con la API
//     pasa por NotificationCrudService (Service layer).
//
// RESPONSABILIDADES:
//   1. Fetch inicial del conteo de no leídas.
//   2. Suscripción Realtime (via Service) que actualiza el contador:
//      - INSERT → count + 1 (instantáneo, sin re-fetch).
//      - UPDATE/DELETE → re-fetch count exacto.
//   3. Expone refetch() manual por si algo externo necesita forzar update.
//
// USO:
//   const { unreadCount } = useUnreadCount();
//   <NotificationBadge count={unreadCount} />
// ---------------------------------------------------------------------------
export function useUnreadCount() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const increment = useNotificationStore((s) => s.increment);

  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.uid ?? null;

  // -----------------------------------------------------------------
  // FETCH DEL CONTEO (delega al Service)
  // -----------------------------------------------------------------
  const fetchCount = useCallback(async () => {
    if (!currentUserId) return;
    const count = await getUnreadCount(currentUserId);
    setUnreadCount(count);
  }, [currentUserId, setUnreadCount]);

  // -----------------------------------------------------------------
  // SUSCRIPCIÓN REALTIME (delega al Service)
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!currentUserId) return;

    // Fetch inicial
    fetchCount();

    // El Service crea el channel con los 3 listeners (INSERT, UPDATE, DELETE).
    const channel = subscribeToUnreadCount(
      currentUserId,
      // onInsert: incrementar localmente (más rápido que re-fetch).
      () => increment(),
      // onChange (UPDATE/DELETE): re-fetch para tener el número exacto.
      () => fetchCount()
    );

    return () => {
      removeChannel(channel);
    };
  }, [currentUserId, fetchCount, increment]);

  return { unreadCount, refetch: fetchCount };
}
