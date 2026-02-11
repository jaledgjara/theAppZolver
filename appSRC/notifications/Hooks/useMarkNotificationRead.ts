// appSRC/notifications/Hooks/useMarkNotificationRead.ts
import { useCallback } from "react";
import { useRouter } from "expo-router";
import { markAsRead } from "@/appSRC/notifications/Service/NotificationCrudService";
import { Notification } from "@/appSRC/notifications/Type/NotificationType";

// ---------------------------------------------------------------------------
// useMarkNotificationRead
// ---------------------------------------------------------------------------
// HOOK DE INTERACCIÓN: Se usa en la card/item de notificación.
//
// ¿Qué hace?
//   1. Marca la notificación como leída en Supabase (si no lo estaba).
//   2. Navega a la pantalla correspondiente usando data.screen.
//
// ¿Por qué es un hook separado y no una función dentro de useFetchNotifications?
//   Porque la lógica de "tocar una notificación" combina 2 responsabilidades:
//     - UPDATE en DB (markAsRead del Service).
//     - NAVEGACIÓN (router.push).
//   Siguiendo tu patrón (useRejectByClient, useConfirmBudget), cada acción
//   que combina lógica + navegación vive en su propio hook.
//
// USO:
//   const { handlePress } = useMarkNotificationRead();
//   <NotificationCard onPress={() => handlePress(notification)} />
// ---------------------------------------------------------------------------
export function useMarkNotificationRead() {
  const router = useRouter();

  const handlePress = useCallback(
    async (notification: Notification) => {
      try {
        // 1. Marcar como leída (solo si no lo está ya).
        if (!notification.is_read) {
          await markAsRead(notification.id);
        }

        // 2. Navegar a la pantalla indicada en data.screen.
        // Si la notificación no tiene screen, no navegamos.
        if (notification.data?.screen) {
          router.push(notification.data.screen as never);
        }
      } catch (error) {
        console.error(
          "❌ [useMarkNotificationRead] Error:",
          error
        );
      }
    },
    [router]
  );

  return { handlePress };
}
