import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/appSRC/services/supabaseClient";
import { ChatMessage } from "../Type/MessageType";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { MessageService } from "../Service/MessageService";
import { StorageService } from "../Service/StorageService";
import { mapMessageDTOToDomain } from "../Mapper/MessageMapper";
import { createNotification } from "@/appSRC/notifications/Service/NotificationCrudService";
import { obfuscateContactInfo } from "@/appSRC/utils/obfuscateContactInfo";

export const useMessages = (conversationId: string, professionalId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(0);
  const isFetchingRef = useRef(false); // 💡 Bloqueo de peticiones simultáneas
  const hasMoreRef = useRef(true);

  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.uid || null;

  const fetchMessages = useCallback(
    async (isInitial = false) => {
      // 1. Validaciones de guardia
      if (!currentUserId) return;
      if (isFetchingRef.current) {
        console.log("[Hook] ⏳ Fetch blocked: Already fetching...");
        return;
      }
      if (!isInitial && !hasMoreRef.current) {
        console.log("[Hook] 🛑 Fetch blocked: No more messages.");
        return;
      }

      console.log(
        `[Hook] 🚀 Fetch Started | Initial: ${isInitial} | Current Page: ${pageRef.current}`,
      );

      isFetchingRef.current = true;
      if (isInitial) {
        setLoading(true);
        pageRef.current = 0;
        hasMoreRef.current = true;
      } else {
        setLoadingMore(true);
      }

      try {
        const from = pageRef.current * 20;
        const to = from + 19;

        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) throw error;

        const domainMessages = data.map((msg) => mapMessageDTOToDomain(msg, currentUserId));

        console.log(`[Hook] 📦 Data mapped: ${domainMessages.length} items`);

        const canLoadMore = domainMessages.length === 20;
        hasMoreRef.current = canLoadMore;
        setHasMore(canLoadMore);

        setMessages((prev) => {
          const newList = isInitial ? domainMessages : [...prev, ...domainMessages];
          console.log(`[Hook] 📊 New total messages in state: ${newList.length}`);
          return newList;
        });

        pageRef.current += 1;
      } catch (error) {
        console.error("❌ [useMessages] Fatal Error:", error);
      } finally {
        isFetchingRef.current = false; // 💡 Liberamos el bloqueo
        setLoading(false);
        setLoadingMore(false);
        console.log("[Hook] 🏁 Fetch Finished");
      }
    },
    [conversationId, currentUserId],
  );

  // Suscripción Realtime (Mantiene el mismo orden inverted)
  useEffect(() => {
    if (!currentUserId) return;
    console.log("[Hook] 🛠 Setting up subscription and initial fetch");
    fetchMessages(true);

    const channel = MessageService.subscribeToConversation(
      conversationId,
      currentUserId,
      (newMsg) => {
        console.log("[Hook] 🔔 Realtime Message Received:", newMsg.id);
        setMessages((prev) => {
          if (newMsg.isMine) {
            const filtered = prev.filter((m) => !m.id.startsWith("temp-"));
            if (filtered.some((m) => m.id === newMsg.id)) return filtered;
            return [newMsg, ...filtered];
          }
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [newMsg, ...prev];
        });
      },
    );

    return () => {
      console.log("[Hook] 🧹 Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, fetchMessages]);

  const sendMessage = useCallback(
    async (text: string, imageUri?: string) => {
      if (!text.trim() && !imageUri) return;
      console.log(
        `[Hook] ✉️ Sending message — sender: ${currentUserId} | receiver (partnerId): ${professionalId} | convId: ${conversationId}`,
      );

      const maskedText = obfuscateContactInfo(text);
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        conversationId,
        createdAt: new Date(),
        isMine: true,
        isRead: false,
        type: imageUri ? "image" : "text",
        data: imageUri ? { imageUrl: imageUri, text: maskedText } : { text: maskedText },
      } as ChatMessage;

      setMessages((prev) => [optimisticMsg, ...prev]);

      try {
        if (imageUri) {
          // 1. Subida al Storage
          const publicUrl = await StorageService.uploadMessageImage(imageUri, conversationId);

          // 💡 FIX: Enviamos los 5 parámetros requeridos en el orden exacto
          await MessageService.sendImageMessage(
            conversationId, // cid
            currentUserId!, // sid (Sender - EL QUE FALTABA)
            professionalId, // rid (Receiver)
            publicUrl, // url
            text, // text (Opcional)
          );
        } else {
          // Texto simple
          await MessageService.sendTextMessage(
            conversationId,
            currentUserId!,
            professionalId,
            text,
          );
        }
        console.log("[Hook] ✅ Send success");

        // Side-effect: Notificar al receptor (estilo WhatsApp)
        const senderName = user?.legalName || user?.displayName || "Usuario";
        const notifBody = imageUri
          ? `${senderName} envió una imagen.`
          : maskedText.length > 80
            ? `${senderName}: ${maskedText.substring(0, 80)}...`
            : `${senderName}: ${maskedText}`;

        // Determinar la pantalla destino según quién RECIBE la notificación.
        // Si yo soy client → el receptor es professional → su pantalla es /(professional)/...
        // Si yo soy professional → el receptor es client → su pantalla es /(client)/...
        const currentStatus = useAuthStore.getState().status;
        const receiverScreen =
          currentStatus === "authenticatedProfessional"
            ? "/(client)/(tabs)/messages"
            : "/(professional)/(tabs)/messages";

        createNotification({
          user_id: professionalId,
          title: "Nuevo mensaje",
          body: notifBody,
          type: "message_new",
          data: {
            conversation_id: conversationId,
            screen: receiverScreen,
          },
        });
      } catch (error) {
        console.error("[Hook] ❌ Send failed:", error);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    },
    [conversationId, professionalId, currentUserId],
  );

  const loadMore = useCallback(() => {
    console.log("[UI] 👆 User reached end (loadMore)");
    fetchMessages(false);
  }, [fetchMessages]);

  const refreshMessages = useCallback(() => {
    console.log("[UI] 🔄 Manual refresh triggered");
    fetchMessages(true);
  }, [fetchMessages]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    sendMessage,
    loadMore,
    refreshMessages,
  };
};
