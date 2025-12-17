import { MessageDTO, ChatMessage, BudgetPayload } from "../Type/MessageType";

/**
 * mapMessageDTOToDomain
 * Convierte un mensaje crudo de Supabase (DTO) en una entidad polimórfica (Domain).
 * * @param dto - El registro directo de la tabla 'messages'.
 * @param currentUserId - ID del usuario logueado (para calcular 'isMine').
 * @returns ChatMessage (TextMessage | ImageMessage | BudgetMessage)
 */
export const mapMessageDTOToDomain = (
  dto: MessageDTO,
  currentUserId: string
): ChatMessage => {
  // 1. Construcción de propiedades base (comunes a todos)
  const baseMessage = {
    id: dto.id,
    createdAt: new Date(dto.created_at), // String ISO -> Objeto Date
    conversationId: dto.conversation_id,
    isMine: dto.sender_id === currentUserId, // Lógica crítica de UI (Derecha/Izquierda)
    isRead: dto.is_read,
  };

  // 2. Discriminación por Tipo (Factory Pattern implícito)
  switch (dto.type) {
    // --- CASO A: PRESUPUESTO ---
    case "budget_proposal": {
      // Forzamos el tipado del payload porque confiamos en la estructura guardada
      const budgetData = dto.payload as BudgetPayload;

      return {
        ...baseMessage,
        type: "budget_proposal",
        // El contenido textual suele ser un resumen fallback: "Te envié una cotización"
        text: dto.content || "Presupuesto enviado",
        data: budgetData || null, // Seguridad contra payloads vacíos
      };
    }

    // --- CASO B: IMAGEN ---
    case "image": {
      const imagePayload = dto.payload as { imageUrl?: string };

      return {
        ...baseMessage,
        type: "image",
        imageUrl: imagePayload?.imageUrl || "", // Fallback si falla la URL
        caption: dto.content || undefined, // El texto opcional actúa como caption
      };
    }

    // --- CASO C: TEXTO (Default) ---
    case "text":
    default: {
      return {
        ...baseMessage,
        type: "text",
        text: dto.content || "", // Evitamos null en UI de texto
      };
    }
  }
};
