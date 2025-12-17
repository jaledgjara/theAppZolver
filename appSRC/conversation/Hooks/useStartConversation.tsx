import { useState, useCallback } from "react";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { ConversationService } from "../Service/ConversationService";
import { Alert } from "react-native";

export const useStartConversation = () => {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);

  /**
   * Busca una conversación existente o crea una nueva.
   * Retorna el ID de la conversación para poder navegar.
   */
  const startConversation = useCallback(
    async (partnerId: string): Promise<string | null> => {
      if (!user?.uid) {
        console.warn("⚠️ [useStartConversation] No user logged in");
        return null;
      }

      try {
        setLoading(true);
        console.log("🚀 [Hook] Iniciando conversación con:", partnerId);

        // Llamada al Servicio (Capa Lógica)
        const conversationId =
          await ConversationService.getOrCreateConversation(
            user.uid,
            partnerId
          );

        console.log("✅ [Hook] Conversación resuelta ID:", conversationId);
        return conversationId;
      } catch (error) {
        console.error("❌ [Hook] Error iniciando conversación:", error);
        Alert.alert("Error", "No se pudo iniciar el chat.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user?.uid]
  );

  return {
    startConversation,
    loading,
  };
};
