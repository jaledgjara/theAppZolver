import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { MessageService } from "../Service/MessageService";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { BudgetPayload } from "../Type/MessageType";
import { createNotification } from "@/appSRC/notifications/Service/NotificationCrudService";

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

    // --- 🔍 LOGGING INICIAL ---
    console.log("------------------------------------------------");
    console.log("[DEBUG PRICE] 1. Input Original:", priceStr);

    try {
      // 1. SANITIZACIÓN DE PRECIO (Formato Argentina/Latam)
      // a. Eliminamos los puntos de miles (ej: "2.000.000" -> "2000000")
      // b. Reemplazamos la coma decimal por punto (ej: "1500,50" -> "1500.50")
      let sanitizedPrice = priceStr.replace(/\./g, "").replace(",", ".");

      console.log("[DEBUG PRICE] 2. Sanitized String:", sanitizedPrice);

      const priceValue = parseFloat(sanitizedPrice);

      console.log("[DEBUG PRICE] 3. Final Number Value:", priceValue);

      if (isNaN(priceValue) || priceValue <= 0) {
        throw new Error("El precio ingresado no es válido.");
      }

      // FIX: Tipado explícito para que TypeScript valide los literales
      const budgetPayload: BudgetPayload = {
        serviceName: title,
        price: priceValue, // Aquí va el número limpio (ej: 2000000)
        currency: "ARS",
        proposedDate: new Date().toISOString(),
        notes: description,
        status: "pending_approval",
      };

      console.log(
        "[useSendBudget] Sending Payload:",
        JSON.stringify(budgetPayload, null, 2)
      );

      await MessageService.sendBudgetProposal(
        conversationId,
        user.uid,
        targetClientId,
        budgetPayload
      );

      // Side-effect: Notificar al cliente (fire & forget)
      createNotification({
        user_id: targetClientId,
        title: "Nuevo presupuesto",
        body: `Recibiste una propuesta de $${priceValue} por "${title}".`,
        type: "budget_received",
        data: { conversation_id: conversationId, screen: `/(client)/messages/MessagesDetailsScreen/${conversationId}` },
      });

      Alert.alert("Enviado", "El presupuesto ha sido enviado al chat.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error("[useSendBudget] Error:", error);
      Alert.alert(
        "Error",
        "No se pudo enviar el presupuesto. Verifica el formato del precio."
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
