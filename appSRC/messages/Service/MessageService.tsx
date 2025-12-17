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
    budgetPayload: BudgetPayload
  ): Promise<void> => {
    const summaryText = `Presupuesto: ${budgetPayload.currency} ${budgetPayload.price}`;

    // A. Insertar mensaje con tipo 'budget_proposal' y payload JSONB
    const { error: msgError } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      type: "budget_proposal",
      content: summaryText, // Fallback visual para el Inbox
      payload: budgetPayload, // 👈 Aquí van los datos ricos
      is_read: false,
    });

    if (msgError) throw msgError;

    // B. Actualizar Inbox
    await supabase
      .from("conversations")
      .update({
        updated_at: new Date().toISOString(),
        last_message_content: "📄 Te ha enviado un presupuesto",
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
