import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/appSRC/services/supabaseClient";
import { ChatMessage } from "../Type/MessageType";
import { MessageService } from "../Service/MessageService";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore"; // 👈 IMPORTANTE

export const useMessages = (conversationId: string, professionalId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. OBTENER EL ID CORRECTO (FIREBASE UID) DESDE EL STORE GLOBAL
  // Ya no usamos supabase.auth.getUser() porque da un ID diferente.
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.uid || null;

  // 2. Fetch de Mensajes usando el SERVICIO
  const fetchMessages = useCallback(async () => {
    if (!currentUserId) return;

    try {
      const data = await MessageService.getMessages(
        conversationId,
        currentUserId
      );
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, currentUserId]);

  // 3. Suscripción Realtime
  useEffect(() => {
    if (!currentUserId) return;

    fetchMessages();

    const channel = MessageService.subscribeToConversation(
      conversationId,
      currentUserId,
      (newMsg: ChatMessage) => {
        setMessages((prev: ChatMessage[]) => [...prev, newMsg]);
      }
    );

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, conversationId, currentUserId]);

  // 4. Enviar Mensaje
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !currentUserId) {
        console.error("❌ Error: Intentando enviar sin User ID válido", {
          currentUserId,
        });
        return;
      }

      const tempId = `temp-${Date.now()}`;

      const optimisticMsg: ChatMessage = {
        id: tempId,
        conversationId: conversationId,
        createdAt: new Date(),
        isMine: true,
        isRead: false,
        type: "text",
        data: { text: text },
      };

      setMessages((prev: ChatMessage[]) => [...prev, optimisticMsg]);

      try {
        console.log("🚀 Enviando mensaje con ID REAL:", currentUserId); // Ahora sí coincidirá

        await MessageService.sendTextMessage(
          conversationId,
          currentUserId,
          professionalId,
          text
        );
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev: ChatMessage[]) =>
          prev.filter((m: ChatMessage) => m.id !== tempId)
        );
        alert("No se pudo enviar el mensaje.");
      }
    },
    [conversationId, professionalId, currentUserId]
  );

  return {
    messages,
    loading,
    sendMessage,
    refreshMessages: fetchMessages,
  };
};
