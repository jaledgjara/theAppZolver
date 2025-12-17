import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { ConversationService } from "../Service/ConversationService";
import { Conversation } from "../Type/ConversationType"; // Ajusta según tu ruta real

export const useProFetchingConversation = () => {
  const user = useAuthStore((state) => state.user);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Nuevo estado para el "Pull to Refresh" nativo (el spinner de arriba)
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(
    async (isExplicitRefresh = false) => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        // LOGICA DE CARGA SILENCIOSA 🤫
        // Solo mostramos loading GRANDE si la lista está vacía y NO es un pull-to-refresh
        if (conversations.length === 0 && !isExplicitRefresh) {
          setLoading(true);
        }

        const data = await ConversationService.getMyConversations(user.uid);
        setConversations(data);
      } catch (err) {
        console.error(err);
      } finally {
        // Apagamos ambos indicadores
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.uid, conversations.length]
  ); // Añadimos dependency length

  // Auto-refresco al entrar (Focus)
  useFocusEffect(
    useCallback(() => {
      // Llamamos sin argumentos -> Refresco silencioso si ya hay datos
      fetchConversations();
    }, [fetchConversations])
  );

  // Función para el control manual (Pull to Refresh del usuario)
  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations(true);
  };

  return {
    conversations,
    loading, // Spinner inicial (Pantalla completa)
    refreshing, // Spinner superior (Pull to Refresh)
    refreshConversations: onRefresh, // Conectar esto al FlatList
  };
};
