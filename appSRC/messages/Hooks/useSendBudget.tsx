import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { MessageService } from "../Service/MessageService";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { BudgetPayload } from "../Type/MessageType"; // <--- IMPORTANTE

export const useSendBudget = (
  conversationId: string,
  targetClientId: string
) => {
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const sendBudget = async (
    title: string,
    priceStr: string,
    description: string
  ) => {
    if (!user) return;
    if (!priceStr || !title) {
      Alert.alert("Campos requeridos", "Debes ingresar un título y un precio.");
      return;
    }

    setLoading(true);
    try {
      const priceValue = parseFloat(priceStr);
      if (isNaN(priceValue)) throw new Error("Precio inválido");

      // FIX: Tipado explícito para que TypeScript valide los literales ('pending', 'ARS')
      const budgetPayload: BudgetPayload = {
        serviceName: title,
        price: priceValue,
        currency: "ARS",
        proposedDate: new Date().toISOString(),
        notes: description,
        status: "pending",
      };

      console.log("[useSendBudget] Sending:", budgetPayload);

      await MessageService.sendBudgetProposal(
        conversationId,
        user.uid,
        targetClientId,
        budgetPayload
      );

      Alert.alert("Enviado", "El presupuesto ha sido enviado al chat.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error",
        "No se pudo enviar el presupuesto. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    sendBudget,
    loading,
  };
};
