import { supabase } from "@/appSRC/services/supabaseClient";
import { MessageDTO, ChatMessage, BudgetPayload } from "../Type/MessageType";
import { mapMessageDTOToDomain } from "../Mapper/MessageMapper";
import { obfuscateContactInfo } from "@/appSRC/utils/obfuscateContactInfo";

/**
 * ZOLVER ARCHITECTURE: Data Access Layer (Message Service)
 * Centraliza persistencia, actualización de Inbox y suscripciones Realtime.
 */
export const MessageService = {
  // --- HELPERS PRIVADOS ---

  async _updateConversationMetadata(conversationId: string, lastContent: string) {
    try {
      await supabase
        .from("conversations")
        .update({
          updated_at: new Date().toISOString(),
          last_message_content: lastContent,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
    } catch (e) {
      console.warn("⚠️ [Service] Error actualizando metadatos del Inbox:", e);
    }
  },

  async _persistMessage(payload: any, inboxPreview: string) {
    // Obfuscate phone numbers before persisting
    payload.content = obfuscateContactInfo(payload.content);
    inboxPreview = obfuscateContactInfo(inboxPreview);

    console.log(
      "[MessageService] _persistMessage payload:",
      JSON.stringify({
        conversation_id: payload.conversation_id,
        sender_id: payload.sender_id,
        receiver_id: payload.receiver_id,
        type: payload.type,
      }),
    );

    // DEBUG: Check if receiver exists in user_accounts
    const { data: receiverCheck } = await supabase
      .from("user_accounts")
      .select("auth_uid, email, role")
      .eq("auth_uid", payload.receiver_id)
      .maybeSingle();
    console.log(
      "[MessageService] Receiver lookup:",
      receiverCheck ? JSON.stringify(receiverCheck) : "NOT FOUND in user_accounts",
    );

    const { data, error } = await supabase.from("messages").insert(payload).select("*").single();

    if (error) {
      console.error("[MessageService] Insert error:", JSON.stringify(error));
      throw error;
    }

    // Actualización asíncrona del Inbox (Escalabilidad Operativa)
    this._updateConversationMetadata(payload.conversation_id, inboxPreview);
    return data as MessageDTO;
  },

  // --- MÉTODOS PÚBLICOS ---

  getMessages: async (
    conversationId: string,
    currentUserId: string,
    page: number = 0,
    pageSize: number = 20,
  ): Promise<ChatMessage[]> => {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    console.log(`[Service] 🔍 Fetching: Page ${page} | Range: [${from}-${to}]`);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[Service] ❌ Supabase Error:", error);
      throw error;
    }

    console.log(`[Service] ✅ Received ${data?.length || 0} messages`);
    return data.map((msg) => mapMessageDTOToDomain(msg, currentUserId));
  },

  sendTextMessage: async (cid: string, sid: string, rid: string, text: string) => {
    return MessageService._persistMessage(
      {
        conversation_id: cid,
        sender_id: sid,
        receiver_id: rid,
        type: "text",
        content: text,
        payload: {},
        is_read: false,
      },
      text,
    );
  },

  sendImageMessage: async (cid: string, sid: string, rid: string, url: string, text?: string) => {
    return MessageService._persistMessage(
      {
        conversation_id: cid,
        sender_id: sid,
        receiver_id: rid,
        type: "image",
        content: text || "📷 Imagen",
        payload: { imageUrl: url }, // 💡 El Mapper ahora buscará aquí
        is_read: false,
      },
      "📷 Imagen",
    );
  },

  sendBudgetProposal: async (cid: string, sid: string, rid: string, budgetData: BudgetPayload) => {
    return MessageService._persistMessage(
      {
        conversation_id: cid,
        sender_id: sid,
        receiver_id: rid,
        type: "budget",
        content: "Propuesta de Presupuesto",
        payload: budgetData,
        is_read: false,
      },
      "💰 Nueva propuesta de presupuesto",
    );
  },

  subscribeToConversation: (
    cid: string,
    userId: string,
    onNewMessage: (msg: ChatMessage) => void,
  ) => {
    return supabase
      .channel(`chat_room:${cid}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${cid}`,
        },
        (payload) => {
          try {
            const domainMsg = mapMessageDTOToDomain(payload.new as MessageDTO, userId);
            onNewMessage(domainMsg);
          } catch (e) {
            console.error("⚠️ [Realtime] Fallo en mapeo entrante:", e);
          }
        },
      )
      .subscribe();
  },
};

// --- SERVICIOS DE APOYO ---

export const getBudgetStatusService = async (messageId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from("messages")
    .select("payload")
    .eq("id", messageId)
    .single();
  if (error) return null;
  return data?.payload?.status || null;
};

export const updateBudgetMessageStatusService = async (messageId: string, fullPayload: any) => {
  const { data, error } = await supabase.rpc("update_message_payload_bypass", {
    p_message_id: messageId,
    p_new_payload: fullPayload,
  });
  return !error && data === true;
};
