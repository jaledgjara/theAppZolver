import { supabase } from "@/appSRC/services/supabaseClient";
import { MessageDTO, ChatMessage, BudgetPayload } from "../Type/MessageType";
import { mapMessageDTOToDomain } from "../Mapper/MessageMapper";

export const MessageService = {
  /**
   * Obtiene el historial completo de mensajes de una conversación.
   * Los resultados se ordenan cronológicamente de forma ascendente.
   *
   * @param conversationId ID de la conversación a consultar.
   * @param currentUserId ID del usuario actual para el mapeo de dominio.
   * @returns Array de objetos ChatMessage.
   */
  getMessages: async (
    conversationId: string,
    currentUserId: string
  ): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      throw new Error("No se pudieron cargar los mensajes.");
    }

    if (!data) return [];

    return data.map((dto) =>
      mapMessageDTOToDomain(dto as MessageDTO, currentUserId)
    );
  },

  /**
   * Envía un mensaje de texto y actualiza la metadata de la conversación (Inbox).
   *
   * @param conversationId ID de la conversación.
   * @param senderId ID del remitente.
   * @param receiverId ID del destinatario.
   * @param content Contenido del mensaje.
   * @returns El objeto MessageDTO del mensaje creado.
   */
  sendTextMessage: async (
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<MessageDTO> => {
    // 1. Inserción del mensaje y recuperación del registro creado.
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        type: "text",
        content: content,
        payload: {},
        is_read: false,
      })
      .select("*")
      .single();

    if (error) throw error;

    // 2. Actualización de la conversación (Cache para el Inbox).
    await supabase
      .from("conversations")
      .update({
        updated_at: new Date().toISOString(),
        last_message_content: content,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    return data as MessageDTO;
  },

  /**
   * Envía una propuesta de presupuesto con una carga útil estructurada (JSONB).
   *
   * @param conversationId ID de la conversación.
   * @param senderId ID del profesional (remitente).
   * @param receiverId ID del cliente (destinatario).
   * @param budgetData Datos estructurados del presupuesto.
   */
  sendBudgetProposal: async (
    conversationId: string,
    senderId: string,
    receiverId: string,
    budgetData: BudgetPayload
  ): Promise<void> => {
    const safePayload = JSON.parse(JSON.stringify(budgetData));

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      type: "budget",
      content: "Propuesta de Presupuesto", // Texto fallback para notificaciones/preview
      payload: safePayload,
      is_read: false,
    });

    if (error) {
      console.error("Supabase Error sending budget:", error.message);
      throw new Error(error.message);
    }

    await supabase
      .from("conversations")
      .update({
        last_message_content: "💰 Nueva propuesta de presupuesto",
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId);
  },

  /**
   * Establece una suscripción Realtime para escuchar nuevos mensajes en una conversación.
   * Mapea automáticamente los eventos entrantes a entidades de dominio.
   *
   * @param conversationId ID de la conversación a escuchar.
   * @param currentUserId ID del usuario actual.
   * @param onNewMessage Callback ejecutado al recibir un nuevo mensaje.
   * @returns Instancia del canal de Realtime.
   */
  subscribeToConversation: (
    conversationId: string,
    currentUserId: string,
    onNewMessage: (msg: ChatMessage) => void
  ) => {
    const channel = supabase
      .channel(`chat_room:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsgDTO = payload.new as MessageDTO;
          const domainMsg = mapMessageDTOToDomain(newMsgDTO, currentUserId);
          onNewMessage(domainMsg);
        }
      )
      .subscribe();

    return channel;
  },
};

/**
 * Obtiene el estado actual de un presupuesto extrayendo datos del payload JSONB.
 *
 * @param messageId ID del mensaje que contiene el presupuesto.
 * @returns Estado del presupuesto (string) o null si falla.
 */
export const getBudgetStatusService = async (
  messageId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("payload")
      .eq("id", messageId)
      .single();

    if (error) throw error;
    console.log("RETURNING getBudgetStatusService:", data?.payload);

    return data?.payload?.status || null;
  } catch (error) {
    console.error("Error fetching budget status:", error);
    return null;
  }
};

/**
 * Actualiza el payload de un mensaje utilizando una función RPC.
 * Esta aproximación permite eludir restricciones de RLS (Row Level Security)
 * del lado del cliente para actualizaciones específicas de estado.
 *
 * @param messageId ID del mensaje a actualizar.
 * @param fullPayload Nuevo objeto payload completo.
 * @returns Booleano indicando el éxito de la operación.
 */
export const updateBudgetMessageStatusService = async (
  messageId: string,
  fullPayload: any
) => {
  const DEBUG_TAG = "🔍 [DEBUG-FLOW] [Service]";

  console.log(`${DEBUG_TAG} 1. Iniciando actualización (Vía RPC Bypass)...`);
  console.log(`${DEBUG_TAG}    ID Mensaje:`, messageId);

  try {
    // Ejecución de procedimiento almacenado para actualización segura/privilegiada
    const { data, error } = await supabase.rpc(
      "update_message_payload_bypass",
      {
        p_message_id: messageId,
        p_new_payload: fullPayload,
      }
    );

    if (error) {
      console.error(`${DEBUG_TAG} ❌ Error en RPC:`, error.message);
      throw error;
    }

    if (data === true) {
      console.log(`${DEBUG_TAG} ✅ Mensaje actualizado exitosamente (RPC).`);
      return true;
    } else {
      console.warn(
        `${DEBUG_TAG} ⚠️ El RPC no encontró el mensaje o no lo actualizó.`
      );
      return false;
    }
  } catch (error) {
    console.error(`${DEBUG_TAG} 💥 Excepción capturada:`, error);
    return false;
  }
};
