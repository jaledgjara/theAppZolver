import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore"; // Adjust if path differs
import { UISavedCard } from "../Type/PaymentMethodType";
import { PaymentMethodsService } from "../Service/PaymentMethodService";

export const usePaymentMethods = () => {
  const { user } = useAuthStore(); // We need the Logged User ID
  const [cards, setCards] = useState<UISavedCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 1. FETCHING (Load Cards)
   */
  const loadMethods = useCallback(async () => {
    // If no user is logged in, we can't fetch. Stop loading.
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const userId = user.uid;

    try {
      setLoading(true);
      setError(null);
      const data = await PaymentMethodsService.fetchPaymentMethodsByUser(
        userId
      );
      setCards(data);
    } catch (err: any) {
      console.error("[usePaymentMethods] Error loading:", err);
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
              // Optimistic Update: Remove from UI immediately for speed perception
              const previousCards = [...cards];
              setCards((prev) => prev.filter((c) => c.id !== cardId));

              await PaymentMethodsService.deletePaymentMethod(cardId);
            } catch (err) {
              // Rollback if fails
              console.error("[usePaymentMethods] Delete failed", err);
              Alert.alert("Error", "No se pudo eliminar la tarjeta.");
              loadMethods(); // Revert to server state
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
