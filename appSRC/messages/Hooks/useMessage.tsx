import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { MessageService } from "../Service/MessageService";
import { ChatMessage, BudgetPayload } from "../Type/MessageType";
import { mapMessageDTOToDomain } from "../Mapper/MessageMapper"; // Necesitamos importar el mapper
import { Alert } from "react-native";

export const useMessages = (conversationId: string, partnerId: string) => {
  const user = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<any>(null);

  // 1. CARGAR HISTORIAL Y SUSCRIBIRSE
  useEffect(() => {
    let isMounted = true;
    const initChat = async () => {
      if (!user?.uid || !conversationId) return;

      try {
        setLoading(true);
        const history = await MessageService.getMessages(
          conversationId,
          user.uid
        );

        if (isMounted) {
          setMessages(history);
          setLoading(false);
        }

        // B. Conectar Realtime
        if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

        subscriptionRef.current = MessageService.subscribeToConversation(
          conversationId,
          user.uid,
          (newMsgDomain) => {
            // 🛡️ FILTRO ANTI-DUPLICADOS (Efecto Eco)
            // Si llega un mensaje que es MÍO, verificamos si ya lo tenemos en la lista.
            // Esto evita que salga doble cuando llega la confirmación del servidor.
            if (newMsgDomain.isMine) {
              setMessages((prev) => {
                // Si ya existe un mensaje con ese ID real, ignoramos el evento
                const exists = prev.some((m) => m.id === newMsgDomain.id);
                if (exists) return prev;
                return [...prev, newMsgDomain];
              });
            } else {
              // Si es del OTRO, lo agregamos siempre
              setMessages((prev) => [...prev, newMsgDomain]);
            }
          }
        );
      } catch (error) {
        console.error("Error init chat:", error);
        if (isMounted) setLoading(false);
      }
    };

    initChat();

    return () => {
      isMounted = false;
      if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
    };
  }, [conversationId, user?.uid]);

  // 2. FUNCIÓN PARA ENVIAR TEXTO (OPTIMISTIC UI 🚀)
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !user?.uid) return;

      // 1. CREAR MENSAJE TEMPORAL (Falso)
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        conversationId: conversationId,
        createdAt: new Date(),
        isMine: true,
        isRead: false,
        type: "text",
        text: text,
      };

      try {
        // 2. AGREGAR A LA UI INMEDIATAMENTE (Sin esperar)
        setMessages((prev) => [...prev, optimisticMsg]);

        // 3. ENVIAR AL SERVIDOR
        const realDto = await MessageService.sendTextMessage(
          conversationId,
          user.uid,
          partnerId,
          text
        );

        // 4. REEMPLAZAR EL TEMPORAL POR EL REAL
        // Mapeamos el DTO real a dominio
        const realMsgDomain = mapMessageDTOToDomain(realDto, user.uid);

        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? realMsgDomain : msg))
        );
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "No se entregó el mensaje");
        // Rollback: Si falla, borramos el mensaje temporal
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      }
    },
    [conversationId, user?.uid, partnerId]
  );

  // 3. FUNCIÓN PARA ENVIAR PRESUPUESTO (Igual que antes)
  const sendBudget = useCallback(
    async (budgetData: BudgetPayload) => {
      if (!user?.uid) return;
      try {
        await MessageService.sendBudgetProposal(
          conversationId,
          user.uid,
          partnerId,
          budgetData
        );
      } catch (error) {
        Alert.alert("Error", "Falló el envío del presupuesto");
      }
    },
    [conversationId, user?.uid, partnerId]
  );

  return { messages, loading, sendMessage, sendBudget };
};
