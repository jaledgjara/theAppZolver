import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/appSRC/services/supabaseClient";
import { ChatMessage, MessageDTO } from "../Type/MessageType";

export const useMessages = (conversationId: string, professionalId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch de Mensajes (Lo necesitamos fuera para poder exportarlo)
  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Mapeo a Entidades de Dominio
      const parsedMessages: ChatMessage[] = (data as MessageDTO[]).map(
        (msg) => {
          // Mapeo para Texto
          if (msg.type === "text") {
            return {
              id: msg.id,
              conversationId: msg.conversation_id,
              createdAt: new Date(msg.created_at),
              isMine: msg.sender_id !== professionalId,
              isRead: msg.is_read,
              type: "text",
              data: { text: msg.content || "" }, // ✅ Estructura Correcta
            };
          }
          // Mapeo para Presupuesto
          if (msg.type === "budget") {
            return {
              id: msg.id,
              conversationId: msg.conversation_id,
              createdAt: new Date(msg.created_at),
              isMine: msg.sender_id !== professionalId,
              isRead: msg.is_read,
              type: "budget",
              data: msg.payload,
            };
          }
          // ... (otros tipos)
          return { ...msg } as any;
        }
      );

      setMessages(parsedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, professionalId]);

  // Carga inicial
  useEffect(() => {
    fetchMessages();

    // Aquí iría la suscripción a Realtime...
  }, [fetchMessages]);

  // 2. FUNCIÓN PARA ENVIAR TEXTO (OPTIMISTIC UI 🚀)
  const sendMessage = useCallback(
    async (text: string) => {
      // Necesitamos el ID del usuario actual (mock o desde store)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!text.trim() || !user?.id) return;

      // A. Optimistic Update (CORREGIDO ERROR 1)
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        conversationId: conversationId,
        createdAt: new Date(),
        isMine: true,
        isRead: false,
        type: "text",
        // ✅ CORRECCIÓN: Envolvemos en 'data' según la interfaz TextMessage
        data: {
          text: text,
        },
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      // B. Envío real a Supabase
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: professionalId,
        type: "text",
        content: text,
        payload: {}, // Payload vacío para texto
      });

      if (error) {
        console.error("Error sending message:", error);
        // Rollback si falla (filtrar el optimista)
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } else {
        // Refrescar para obtener el ID real (o reemplazar in-place)
        fetchMessages();
      }
    },
    [conversationId, professionalId, fetchMessages]
  );

  return {
    messages,
    loading,
    sendMessage,
    refreshMessages: fetchMessages,
  };
};
