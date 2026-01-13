import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { UISavedCard } from "../Type/PaymentMethodType";
import { PaymentMethodsService } from "../Service/PaymentMethodService";

export const usePaymentMethods = () => {
  // Debug del Store de Auth
  const { user } = useAuthStore();

  const [cards, setCards] = useState<UISavedCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 1. FETCHING (Load Cards)
   */
  const loadMethods = useCallback(async () => {
    console.log("🪝 [Hook] loadMethods disparado.");

    // Chequeo de seguridad del usuario
    if (!user) {
      console.warn("⚠️ [Hook] Usuario es null en AuthStore.");
      setLoading(false);
      return;
    }

    if (!user.uid) {
      console.warn("⚠️ [Hook] user.uid es undefined.", user);
      setLoading(false);
      return;
    }

    const userId = user.uid;
    console.log("👤 [Hook] Usuario detectado:", userId);

    try {
      setLoading(true);
      setError(null);

      const data = await PaymentMethodsService.fetchPaymentMethodsByUser(
        userId
      );

      console.log(
        `✅ [Hook] Datos recibidos en el componente: ${data.length} tarjetas.`
      );
      setCards(data);
    } catch (err: any) {
      console.error("❌ [Hook] Error loading:", err);
      setError("No se pudieron cargar tus métodos de pago.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * 2. DELETING (Remove Card)
   */
  const removeMethod = async (cardId: string) => {
    Alert.alert(
      "Eliminar método",
      "¿Estás seguro de que quieres eliminar esta tarjeta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const previousCards = [...cards];
              setCards((prev) => prev.filter((c) => c.id !== cardId));
              await PaymentMethodsService.deletePaymentMethod(cardId);
            } catch (err) {
              console.error("[usePaymentMethods] Delete failed", err);
              Alert.alert("Error", "No se pudo eliminar la tarjeta.");
              loadMethods();
            }
          },
        },
      ]
    );
  };

  // Initial Load
  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  return {
    cards,
    loading,
    error,
    refetch: loadMethods,
    deleteCard: removeMethod,
    isEmpty: !loading && cards.length === 0,
  };
};
