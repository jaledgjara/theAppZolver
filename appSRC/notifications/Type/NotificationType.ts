// appSRC/notifications/Type/NotificationType.ts

// ---------------------------------------------------------------------------
// TIPOS DE NOTIFICACIÓN
// ---------------------------------------------------------------------------
// Cada tipo corresponde a un evento de negocio en Zolver.
// Este mismo string se usa en:
//   1. La columna 'type' de la tabla 'notifications' (CHECK constraint).
//   2. El payload que envía el backend.
//   3. La lógica del frontend para decidir ícono, color y navegación.
// ---------------------------------------------------------------------------
export type NotificationType =
  | "reservation_new"
  | "reservation_accepted"
  | "reservation_rejected"
  | "reservation_completed"
  | "reservation_cancelled"
  | "message_new"
  | "budget_received"
  | "budget_accepted"
  | "payment_received"
  | "payment_refund"
  | "general";

// ---------------------------------------------------------------------------
// NOTIFICATION ENTITY (Lo que lee el frontend de la tabla)
// ---------------------------------------------------------------------------
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  data: NotificationData;
  is_read: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// NOTIFICATION DATA (El JSONB flexible por tipo)
// ---------------------------------------------------------------------------
// Contiene la info necesaria para navegar y mostrar contexto.
// 'screen' es la ruta de expo-router a la que se navega al tocar.
// El resto son campos opcionales que dependen del tipo de notificación.
// ---------------------------------------------------------------------------
export interface NotificationData {
  screen?: string;
  reservation_id?: string;
  conversation_id?: string;
  professional_id?: string;
  client_id?: string;
  amount?: number;
  [key: string]: unknown; // Extensible para futuros campos
}

// ---------------------------------------------------------------------------
// PAYLOAD PARA CREAR (Lo que envía el frontend a la Edge Function)
// ---------------------------------------------------------------------------
// No incluye id, is_read ni created_at porque los genera el backend.
// ---------------------------------------------------------------------------
export interface CreateNotificationPayload {
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: NotificationData;
}
