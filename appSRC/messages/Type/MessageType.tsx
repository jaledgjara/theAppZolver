// appSRC/messages/Type/MessageDTO.ts

// 1. Tipos de Mensaje (Enum SQL)
export type MessageTypeDTO = "text" | "image" | "budget_proposal";

// 2. Definición del Payload de Presupuesto
// Reutilizamos o extendemos ReservationPayload para mantener consistencia
export interface BudgetPayload {
  serviceName: string;
  price: number;
  currency: string; // 'ARS', 'USD'
  proposedDate: string; // ISO String
  notes?: string;

  // Estado del presupuesto dentro del chat
  status: "pending" | "accepted" | "rejected" | "expired";

  // Vinculación opcional con la reserva real si ya se creó
  reservationId?: string;
}

// 3. MessageDTO (Data Transfer Object)
// Representación exacta de la tabla SQL 'messages'
export interface MessageDTO {
  id: string;
  created_at: string;

  conversation_id: string;
  sender_id: string;
  receiver_id: string;

  type: MessageTypeDTO;
  content: string | null; // Texto visible o fallback

  // El campo JSONB mágico
  payload: BudgetPayload | { imageUrl?: string } | null;

  is_read: boolean;
}

// 4. Message (Domain Entity - Union Type)
// Esto permite al FlatList saber qué componente renderizar (Burbuja o Card)

interface BaseMessage {
  id: string;
  createdAt: Date;
  conversationId: string;
  isMine: boolean; // Helper calculado (sender_id === user.id)
  isRead: boolean;
}

export interface TextMessage extends BaseMessage {
  type: "text";
  text: string;
}

export interface ImageMessage extends BaseMessage {
  type: "image";
  imageUrl: string;
  caption?: string;
}

export interface BudgetMessage extends BaseMessage {
  type: "budget_proposal";
  text: string; // Resumen: "Presupuesto enviado: $5000"
  data: BudgetPayload; // Datos completos para la Card
}

// Tipo Polimórfico exportado para la UI
export type ChatMessage = TextMessage | ImageMessage | BudgetMessage;
