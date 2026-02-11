// appSRC/notifications/Hooks/useUnreadCount.ts
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
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
// ARQUITECTURA: Service-Hook-View
//   - Este hook NO importa supabase. Toda interacción con la API
//     pasa por NotificationCrudService (Service layer).
//   - El Service crea los canales Realtime, el hook solo hace cleanup.
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
//   <TabBarIcon badgeCount={unreadCount} />
// ---------------------------------------------------------------------------
export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.uid ?? null;

  // -----------------------------------------------------------------
  // FETCH DEL CONTEO (delega al Service)
  // -----------------------------------------------------------------
  const fetchCount = useCallback(async () => {
    if (!currentUserId) return;
    const count = await getUnreadCount(currentUserId);
    setUnreadCount(count);
  }, [currentUserId]);

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
      () => setUnreadCount((prev) => prev + 1),
      // onChange (UPDATE/DELETE): re-fetch para tener el número exacto.
      () => fetchCount()
    );

    return () => {
      removeChannel(channel);
    };
  }, [currentUserId, fetchCount]);

  return { unreadCount, refetch: fetchCount };
}
