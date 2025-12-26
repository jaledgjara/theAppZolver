import { ReservationStatusDTO } from "@/appSRC/reservations/Type/ReservationType"; // Asegúrate de que esta importación exista

// 1. Tipos de Mensaje
export type MessageTypeDTO = "text" | "image" | "budget";

// 2. Payload de Presupuesto (Unificado con Reservas)
export interface BudgetPayload {
  serviceName: string;
  price: number;
  currency: "ARS" | "USD";
  proposedDate: string;
  notes: string;
  // ✅ CORRECCIÓN: Usamos el tipo estricto de la reserva
  status: ReservationStatusDTO;
}

// 3. MessageDTO (Supabase)
export interface MessageDTO {
  id: string;
  created_at: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  type: MessageTypeDTO;
  content: string | null;
  payload: BudgetPayload | any | null;
  is_read: boolean;
}

// 4. Entidades de UI
interface BaseMessage {
  id: string;
  createdAt: Date;
  conversationId: string;
  isMine: boolean;
  isRead: boolean;
}

export interface TextMessage extends BaseMessage {
  type: "text";
  data: { text: string };
}

export interface ImageMessage extends BaseMessage {
  type: "image";
  data: { imageUrl: string; caption?: string };
}

export interface BudgetMessage extends BaseMessage {
  type: "budget";
  data: BudgetPayload;
}

export type ChatMessage = TextMessage | ImageMessage | BudgetMessage;
