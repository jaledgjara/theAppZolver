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
  const isMine = dto.sender_id === currentUserId;
  const base = {
    id: dto.id,
    conversationId: dto.conversation_id,
    createdAt: new Date(dto.created_at),
    isMine,
    isRead: dto.is_read,
  };

  // Mapeo según el tipo (ahora todos usan 'budget' y 'data')
  switch (dto.type) {
    case "budget":
      return {
        ...base,
        type: "budget",
        data: dto.payload as any, // TypeScript confía en que el payload es BudgetPayload
      };

    case "image":
      return {
        ...base,
        type: "image",
        data: {
          imageUrl: dto.content || "", // Asumiendo URL en content o payload
          caption: "",
        },
      };

    case "text":
    default:
      return {
        ...base,
        type: "text",
        data: {
          text: dto.content || "", // ✅ Mapeamos content a data.text
        },
      };
  }
};
