import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { getBudgetStatusService } from "@/appSRC/messages/Service/MessageService";

export const useBudgetValidation = (messageId: string) => {
  const [isValid, setIsValid] = useState<boolean>(false);
  const [validating, setValidating] = useState<boolean>(true);
  const router = useRouter();

  const validateStatus = useCallback(async () => {
    if (!messageId) return;

    setValidating(true);
    const status = await getBudgetStatusService(messageId);

    console.log("🔍 [Validation] Status recibido:", status);

    // ✅ CORRECCIÓN LÓGICA:
    // Aceptamos 'pending_approval' (nuevo) y 'pending' (viejo/legacy)
    if (status === "pending" || status === "pending_approval") {
      setIsValid(true);
    } else {
      setIsValid(false);
      handleInvalidStatus(status);
    }
    setValidating(false);
  }, [messageId]);

  const handleInvalidStatus = (status: string | null) => {
    // ✅ CORRECCIÓN DE VARIABLE:
    // Renombramos 'message' a 'alertMsg' para evitar conflictos de palabras reservadas
    let alertMsg = "Este presupuesto ya no está disponible.";

    // En useBudgetValidation.ts
    if (
      status === "confirmed" ||
      status === "completed" ||
      status === "accepted"
    )
      alertMsg = "Este presupuesto ya fue aceptado anteriormente.";
    if (status === "rejected") alertMsg = "Este presupuesto fue rechazado.";
    if (status === "expired") alertMsg = "El presupuesto ha expirado.";

    Alert.alert("Aviso", alertMsg, [
      {
        text: "Volver",
        onPress: () => router.back(),
      },
    ]);
  };

  // Validación automática al montar el componente
  useEffect(() => {
    validateStatus();
  }, [validateStatus]);

  return { isValid, validating, revalidate: validateStatus };
};
