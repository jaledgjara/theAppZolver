// Definimos una interfaz auxiliar para el perfil que se inyectará

import { Conversation, ConversationDTO } from "../Type/ConversationType";

// Esto desacopla el mapper de la entidad completa de Usuario
export interface PartnerProfileSummary {
  id: string;
  name: string;
  avatar: string | null;
  role: "client" | "professional";
}

/**
 * mapConversationDTOToDomain
 * * Transforma el registro crudo de la BD en una Conversación utilizable por la UI.
 * Resuelve la lógica de determinar quién es el "Partner" basándose en el currentUserId.
 * * @param dto - El objeto crudo que viene de Supabase (tabla conversations)
 * @param currentUserId - El ID del usuario autenticado (para saber cuál lado es "mío")
 * @param partnerProfile - Datos del otro participante (obtenidos por JOIN o fetch separado)
 * @param hasUnreadMessages - Flag booleano (calculado externamente o via count)
 */
export const mapConversationDTOToDomain = (
  dto: ConversationDTO,
  currentUserId: string,
  partnerProfile: PartnerProfileSummary,
  hasUnreadMessages: boolean = false
): Conversation => {
  // 1. Validaciones de integridad básicas
  if (!dto.id) {
    console.warn("Conversation Mapper: ID missing in DTO");
  }

  // 2. Determinar si el usuario actual es participante 1 o 2 (para validación)
  const isParticipant1 = dto.participant1_id === currentUserId;
  const isParticipant2 = dto.participant2_id === currentUserId;

  if (!isParticipant1 && !isParticipant2) {
    // Edge case: El usuario actual no pertenece a esta conversación
    console.warn(
      `Conversation Mapper: User ${currentUserId} is not in conversation ${dto.id}`
    );
  }

  // 3. Mapeo a Entidad de Dominio
  return {
    id: dto.id,

    // Convertir strings ISO de DB a objetos Date reales de JS
    updatedAt: new Date(dto.updated_at),

    partner: {
      id: partnerProfile.id,
      name: partnerProfile.name || "Usuario Zolver", // Fallback seguro
      avatar: partnerProfile.avatar,
      role: partnerProfile.role,
    },

    preview: {
      // Si last_message_content es null (chat nuevo), mostramos texto por defecto
      content: dto.last_message_content || "Nueva conversación iniciada",

      // La fecha del último mensaje o la de creación si no hay mensajes
      timestamp: new Date(dto.last_message_at || dto.updated_at),

      hasUnreadMessages: hasUnreadMessages,
    },
  };
};
