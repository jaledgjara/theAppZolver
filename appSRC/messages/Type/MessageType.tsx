// appSRC/messages/Type/MessageType.ts

// 1. Tipos de Mensaje (Alineado con DB enum)
export type MessageTypeDTO = "text" | "image" | "budget"; // ✅ CAMBIADO DE budget_proposal

// 2. Payload de Presupuesto
export interface BudgetPayload {
  serviceName: string;
  price: number;
  currency: "ARS" | "USD";
  proposedDate: string;
  notes: string;
  status: "pending" | "accepted" | "rejected" | "expired";
}

// 3. MessageDTO (Lo que viene de Supabase)
export interface MessageDTO {
  id: string;
  created_at: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  type: MessageTypeDTO;
  content: string | null;
  payload: BudgetPayload | any | null; // JSONB
  is_read: boolean;
}

// 4. DOMAIN ENTITIES (UI)
// ✅ Estandarización: TODOS tienen una propiedad 'data'

interface BaseMessage {
  id: string;
  createdAt: Date; // Date object real
  conversationId: string;
  isMine: boolean;
  isRead: boolean;
}

export interface TextMessage extends BaseMessage {
  type: "text";
  // Envolvemos el texto en data para consistencia
  data: {
    text: string;
  };
}

export interface ImageMessage extends BaseMessage {
  type: "image";
  data: {
    imageUrl: string;
    caption?: string;
  };
}

export interface BudgetMessage extends BaseMessage {
  type: "budget"; // ✅ CAMBIADO
  data: BudgetPayload;
}

// Unión Exportada
export type ChatMessage = TextMessage | ImageMessage | BudgetMessage;
