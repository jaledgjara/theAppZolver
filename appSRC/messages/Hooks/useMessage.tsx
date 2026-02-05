import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/appSRC/services/supabaseClient";
import { ChatMessage } from "../Type/MessageType";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { MessageService } from "../Service/MessageService";
import { StorageService } from "../Service/StorageService";

export const useMessages = (conversationId: string, professionalId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.uid || null;

  const fetchMessages = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const data = await MessageService.getMessages(
        conversationId,
        currentUserId
      );
      setMessages(data);
    } finally {
      setLoading(false);
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    fetchMessages();

    const channel = MessageService.subscribeToConversation(
      conversationId,
      currentUserId,
      (newMsg) => {
        setMessages((prev) => {
          // 💡 RECONCILIACIÓN: Evita duplicados eliminando el optimista 'temp-'
          if (newMsg.isMine) {
            return [...prev.filter((m) => !m.id.startsWith("temp-")), newMsg];
          }
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    );

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, fetchMessages]);

  const sendMessage = useCallback(
    async (text: string, imageUri?: string) => {
      if (!text.trim() && !imageUri) return;
      if (!currentUserId) return;

      const tempId = `temp-${Date.now()}`;
      const isImage = !!imageUri;

      // 1. Mensaje Optimista (Usa la URI local temporal)
      const optimisticMsg: ChatMessage = isImage
        ? ({
            id: tempId,
            conversationId,
            createdAt: new Date(),
            isMine: true,
            isRead: false,
            type: "image",
            data: { imageUrl: imageUri!, text },
          } as ChatMessage)
        : ({
            id: tempId,
            conversationId,
            createdAt: new Date(),
            isMine: true,
            isRead: false,
            type: "text",
            data: { text },
          } as ChatMessage);

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        if (isImage) {
          // 💡 PASO PRODUCTIVO: Subimos el archivo a la nube y obtenemos URL real
          const publicUrl = await StorageService.uploadMessageImage(
            imageUri!,
            conversationId
          );

          await MessageService.sendImageMessage(
            conversationId,
            currentUserId,
            professionalId,
            publicUrl,
            text
          );
        } else {
          await MessageService.sendTextMessage(
            conversationId,
            currentUserId,
            professionalId,
            text
          );
        }
      } catch (error) {
        console.error("❌ Error en flujo de envío:", error);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    },
    [conversationId, professionalId, currentUserId]
  );

  return { messages, loading, sendMessage, refreshMessages: fetchMessages };
};
