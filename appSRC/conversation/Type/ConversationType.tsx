// appSRC/messages/Type/ConversationDTO.ts

/**
 * ConversationDTO (Data Transfer Object)
 * Representación cruda de la tabla SQL 'conversations'.
 */
export interface ConversationDTO {
  id: string;
  created_at: string;
  updated_at: string;

  // Participantes (IDs crudos)
  participant1_id: string;
  participant2_id: string;

  // Cache para el Inbox (Performance)
  last_message_content: string | null;
  last_message_at: string; // ISO Date
}

/**
 * Conversation (Domain Entity)
 * Versión limpia para usar en la UI (Lista de Chats).
 * Abstrae la lógica de "participant1 vs participant2" para mostrar solo al "Otro".
 */
export interface Conversation {
  id: string;
  updatedAt: Date; // Usamos Date real para ordenar fácil

  // Datos del "Otro Usuario" (Ya procesados para mostrar Avatar/Nombre)
  partner: {
    id: string;
    name: string;
    avatar: string | null;
    role: "client" | "professional";
  };

  preview: {
    content: string; // "Hola, ¿estás disponible?"
    timestamp: Date;
    hasUnreadMessages: boolean; // Calculado o traído de vista
  };
}
