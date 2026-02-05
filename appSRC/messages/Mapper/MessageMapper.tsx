import { MessageDTO, ChatMessage } from "../Type/MessageType";

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
    isRead: dto.is_read || false,
  };

  switch (dto.type) {
    case "budget":
      return { ...base, type: "budget", data: dto.payload as any };

    case "image":
      // 💡 EXTRAEMOS DE PAYLOAD: Aquí es donde vive la URL real de Supabase
      const imgPayload = dto.payload as { imageUrl?: string };
      return {
        ...base,
        type: "image",
        data: {
          imageUrl: imgPayload?.imageUrl || "", // ✅ URL Real
          caption:
            dto.content && dto.content !== "📷 Imagen"
              ? dto.content
              : undefined,
        },
      };

    default:
      return {
        ...base,
        type: "text",
        data: { text: dto.content || "" },
      };
  }
};
