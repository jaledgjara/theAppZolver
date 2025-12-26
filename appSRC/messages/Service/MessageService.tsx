import { supabase } from "@/appSRC/services/supabaseClient";
import { MessageDTO, ChatMessage, BudgetPayload } from "../Type/MessageType";
import { mapMessageDTOToDomain } from "../Mapper/MessageMapper";

export const MessageService = {
  /**
   * 1. OBTENER HISTORIAL DE MENSAJES
   * Trae todos los mensajes de una conversación ordenados cronológicamente.
   */
  getMessages: async (
    conversationId: string,
    currentUserId: string
  ): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }); // Del más viejo al más nuevo

    if (error) {
      console.error("Error fetching messages:", error);
      throw new Error("No se pudieron cargar los mensajes.");
    }

    if (!data) return [];

    // Mapeamos DTO -> Domain para que la UI los consuma
    return data.map((dto) =>
      mapMessageDTOToDomain(dto as MessageDTO, currentUserId)
    );
  },

  /**
   * 2. ENVIAR MENSAJE DE TEXTO
   * Inserta el mensaje y actualiza la conversación para que suba en el Inbox.
   */
  // 2. ENVIAR MENSAJE DE TEXTO (Ahora retorna el mensaje creado)
  sendTextMessage: async (
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<MessageDTO> => {
    // 👈 Cambiamos void por MessageDTO

    // A. Insertamos y pedimos que nos devuelva el registro (.select().single())
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
      .select("*") // 👈 IMPORTANTE: Traer el dato insertado
      .single();

    if (error) throw error;

    // B. Actualizar la 'conversation' (Inbox Cache)
    await supabase
      .from("conversations")
      .update({
        updated_at: new Date().toISOString(),
        last_message_content: content,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    return data as MessageDTO; // 👈 Retornamos el DTO real
  },

  /**
   * 3. ENVIAR PRESUPUESTO (Budget Proposal)
   * Crea un mensaje especial con los datos estructurados del presupuesto.
   */
  sendBudgetProposal: async (
    conversationId: string,
    senderId: string,
    receiverId: string,
    budgetData: BudgetPayload
  ): Promise<void> => {
    // Validamos que el payload sea serializable
    const safePayload = JSON.parse(JSON.stringify(budgetData));

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      type: "budget", // Requiere el FIX SQL de arriba
      content: "Propuesta de Presupuesto", // Texto fallback para notificaciones push
      payload: safePayload,
      is_read: false,
    });

    if (error) {
      console.error("Supabase Error sending budget:", error.message);
      throw new Error(error.message);
    }

    // Opcional: Actualizar la conversación para mostrar "Te ha enviado un presupuesto..."
    await supabase
      .from("conversations")
      .update({
        last_message_content: "💰 Nueva propuesta de presupuesto",
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId);
  },

  /**
   * 4. SUSCRIPCIÓN REALTIME (Live Chat)
   * Escucha nuevos mensajes y los devuelve mapeados al instante.
   * @param onNewMessage Callback que recibe el ChatMessage ya procesado
   */
  subscribeToConversation: (
    conversationId: string,
    currentUserId: string,
    onNewMessage: (msg: ChatMessage) => void
  ) => {
    // Creamos el canal de escucha para ESTA conversación específica
    const channel = supabase
      .channel(`chat_room:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT", // Solo nos interesa cuando llegan nuevos
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // El payload.new es el registro crudo (MessageDTO)
          const newMsgDTO = payload.new as MessageDTO;

          // Lo mapeamos inmediatamente a Domain Entity
          const domainMsg = mapMessageDTOToDomain(newMsgDTO, currentUserId);

          // Se lo entregamos a la UI
          onNewMessage(domainMsg);
        }
      )
      .subscribe();

    // Retornamos el canal para poder hacer .unsubscribe() al salir
    return channel;
  },
};

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
    // Accedemos al JSONB payload y extraemos el status
    return data?.payload?.status || null;
  } catch (error) {
    console.error("Error fetching budget status:", error);
    return null;
  }
};

// ... imports

// ... imports

// Función Modificada para usar RPC (Bypass de Seguridad)
export const updateBudgetMessageStatusService = async (
  messageId: string,
  fullPayload: any
) => {
  const DEBUG_TAG = "🔍 [DEBUG-FLOW] [Service]";

  console.log(`${DEBUG_TAG} 1. Iniciando actualización (Vía RPC Bypass)...`);
  console.log(`${DEBUG_TAG}    ID Mensaje:`, messageId);

  try {
    // ✅ CAMBIO CRÍTICO: Usamos .rpc en lugar de .from().update()
    // Esto llama a la función SQL que acabamos de crear con permisos de admin.
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
