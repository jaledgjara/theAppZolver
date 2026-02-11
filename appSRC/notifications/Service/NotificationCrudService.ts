// appSRC/notifications/Service/NotificationCrudService.ts
import { supabase } from "@/appSRC/services/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  Notification,
  CreateNotificationPayload,
} from "@/appSRC/notifications/Type/NotificationType";

// ============================================================================
// ARQUITECTURA DE ESTE SERVICE
// ============================================================================
//
// Hay 2 tipos de operaciones aquí:
//
// A) OPERACIONES DE LECTURA (directas con supabase client):
//    - fetchNotifications: Trae la lista paginada.
//    - getUnreadCount: Cuenta las no leídas (para el badge).
//    - markAsRead: Actualiza is_read = true.
//    - deleteNotification: Borra una notificación.
//
//    ¿Por qué directo? Porque son operaciones que el usuario ejecuta
//    sobre SUS PROPIAS notificaciones. Cuando agreguemos RLS, la policy
//    garantiza que solo pueda leer/editar las suyas.
//
// B) OPERACIÓN DE ESCRITURA (via Edge Function):
//    - createNotification: Llama a la Edge Function 'send-notification'.
//
//    ¿Por qué Edge Function y no insert directo?
//    Porque crear una notificación tiene 2 SIDE EFFECTS atómicos:
//      1. INSERT en la tabla 'notifications' (para el historial in-app).
//      2. ENVIAR el push notification via la API de Expo (para el teléfono).
//    El push requiere leer el expo_push_token del usuario destino,
//    lo cual necesita service_role_key (acceso elevado del backend).
//    Si lo hiciéramos desde el frontend, expondríamos esa key.
//
// ============================================================================

const PAGE_SIZE = 20;

// ============================================================================
// A) OPERACIONES DE LECTURA
// ============================================================================

/**
 * FETCH PAGINADO
 * Trae las notificaciones del usuario ordenadas por fecha (más reciente primero).
 * Usa offset-based pagination igual que useMessages.
 *
 * @param userId  - auth_uid del usuario logueado.
 * @param page    - Número de página (0-based). Página 0 = las 20 más recientes.
 * @returns       - Array de Notification + boolean indicando si hay más páginas.
 */
export async function fetchNotifications(
  userId: string,
  page: number = 0
): Promise<{ notifications: Notification[]; hasMore: boolean }> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  console.log(
    `📡 [NotificationCrud] Fetching page ${page} for user: ${userId}`
  );

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("❌ [NotificationCrud] Error fetching:", error.message);
    throw error;
  }

  const notifications = (data ?? []) as Notification[];

  return {
    notifications,
    hasMore: notifications.length === PAGE_SIZE,
  };
}

/**
 * CONTADOR DE NO LEÍDAS (para el badge)
 * Usa el índice parcial 'idx_notifications_user_unread' que creamos.
 * count({ count: 'exact', head: true }) es la forma más eficiente en Supabase:
 * no trae filas, solo el número.
 *
 * @param userId - auth_uid del usuario logueado.
 * @returns      - Número de notificaciones sin leer.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("❌ [NotificationCrud] Error counting:", error.message);
    return 0; // Fail-safe: si falla, mostramos 0 en vez de crashear.
  }

  return count ?? 0;
}

/**
 * MARCAR COMO LEÍDA
 * Se llama cuando el usuario toca una notificación en la lista.
 *
 * @param notificationId - UUID de la notificación.
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("❌ [NotificationCrud] Error marking read:", error.message);
    throw error;
  }

  console.log(`✅ [NotificationCrud] Notificación ${notificationId} leída.`);
}

/**
 * MARCAR TODAS COMO LEÍDAS
 * Botón "Marcar todo como leído" en la pantalla de notificaciones.
 *
 * @param userId - auth_uid del usuario logueado.
 */
export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("❌ [NotificationCrud] Error marking all:", error.message);
    throw error;
  }

  console.log("✅ [NotificationCrud] Todas las notificaciones marcadas.");
}

/**
 * ELIMINAR UNA NOTIFICACIÓN
 * Swipe-to-delete o botón de eliminar en la card.
 *
 * @param notificationId - UUID de la notificación a borrar.
 */
export async function deleteNotification(
  notificationId: string
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) {
    console.error("❌ [NotificationCrud] Error deleting:", error.message);
    throw error;
  }

  console.log(`🗑️ [NotificationCrud] Notificación ${notificationId} borrada.`);
}

// ============================================================================
// B) SUSCRIPCIONES REALTIME
// ============================================================================
// Mismo patrón que MessageService.subscribeToConversation():
// El Service crea y retorna el channel. El Hook lo consume y hace cleanup.
// ============================================================================

/**
 * SUSCRIPCIÓN A NUEVAS NOTIFICACIONES (para la lista)
 * Escucha INSERT en la tabla 'notifications' filtrado por user_id.
 *
 * @param userId       - auth_uid del usuario logueado.
 * @param onInsert     - Callback que recibe la nueva Notification.
 * @returns            - RealtimeChannel (el hook lo usa para cleanup).
 */
export function subscribeToNotifications(
  userId: string,
  onInsert: (notification: Notification) => void
): RealtimeChannel {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log("🔔 [NotificationCrud] Realtime INSERT recibido");
        onInsert(payload.new as Notification);
      }
    )
    .subscribe();
}

/**
 * SUSCRIPCIÓN AL CONTADOR DE NO LEÍDAS (para el badge)
 * Escucha INSERT, UPDATE y DELETE para recalcular el conteo.
 *
 * @param userId       - auth_uid del usuario logueado.
 * @param onInsert     - Callback cuando llega una nueva notificación.
 * @param onChange     - Callback cuando se actualiza o borra una (re-fetch count).
 * @returns            - RealtimeChannel (el hook lo usa para cleanup).
 */
export function subscribeToUnreadCount(
  userId: string,
  onInsert: () => void,
  onChange: () => void
): RealtimeChannel {
  return supabase
    .channel(`unread-count:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        console.log("🔔 [NotificationCrud] Unread count: INSERT detectado");
        onInsert();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        console.log("🔔 [NotificationCrud] Unread count: UPDATE detectado");
        onChange();
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        console.log("🔔 [NotificationCrud] Unread count: DELETE detectado");
        onChange();
      }
    )
    .subscribe();
}

/**
 * REMOVER UN CANAL REALTIME
 * Wrapper para que el hook no importe supabase directamente.
 */
export function removeChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}

// ============================================================================
// C) OPERACIÓN DE ESCRITURA (via Edge Function)
// ============================================================================

/**
 * CREAR NOTIFICACIÓN + ENVIAR PUSH
 *
 * Esta función es la que se inyecta en TODA la app.
 * Ejemplo de uso desde cualquier hook o service:
 *
 *   await createNotification({
 *     user_id: professionalId,            // ¿A QUIÉN va dirigida?
 *     title: "Nueva reserva",
 *     body: "Juan solicitó un servicio de plomería",
 *     type: "reservation_new",
 *     data: { reservation_id: "xxx", screen: "/(professional)/reservations/xxx" },
 *   });
 *
 * FLUJO INTERNO:
 *   1. El frontend llama a esta función con el payload.
 *   2. Esta función invoca la Edge Function 'send-notification'.
 *   3. La Edge Function (backend):
 *      a. INSERT en la tabla 'notifications'.
 *      b. Lee el expo_push_token del user_id destino.
 *      c. Envía el push via Expo Push API.
 *      d. Retorna { success: true }.
 *
 * ¿POR QUÉ EDGE FUNCTION?
 *   - El push necesita leer el token de OTRO usuario (no el logueado).
 *   - Eso requiere service_role_key (bypass RLS) que solo vive en el backend.
 *   - Si lo hicieras directo desde el frontend, necesitarías exponer esa key.
 */
export async function createNotification(
  payload: CreateNotificationPayload
): Promise<void> {
  console.log(
    `📡 [NotificationCrud] Enviando notificación a: ${payload.user_id} | Tipo: ${payload.type}`
  );

  const { data, error } = await supabase.functions.invoke(
    "send-notification",
    { body: payload }
  );

  if (error) {
    console.error(
      "❌ [NotificationCrud] Error en Edge Function:",
      error.message
    );
    // FAIL-SAFE: No tiramos error. La notificación es un side-effect,
    // no debe bloquear el flujo principal (ej: si falla el push,
    // la reserva YA se creó exitosamente).
    return;
  }

  if (!data?.success) {
    console.warn(
      "⚠️ [NotificationCrud] Edge Function respondió sin éxito:",
      data?.error
    );
    return;
  }

  console.log("✅ [NotificationCrud] Notificación creada y push enviado.");
}
