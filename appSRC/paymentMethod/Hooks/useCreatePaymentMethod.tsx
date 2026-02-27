// @ts-nocheck
// UBICACIÓN: appSRC/paymentMethod/Hooks/useCreatePaymentMethod.tsx

import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { PaymentMethodsService } from "../Service/PaymentMethodService";

const MP_PUBLIC_KEY = process.env.EXPO_PUBLIC_MP_PUBLIC_KEY!;

export const useCreatePaymentMethod = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // PASO A: IDENTIFICAR TARJETA (via MP API)
  // ---------------------------------------------------------------------------
  const fetchCardInfo = async (bin: string) => {
    try {
      const response = await fetch(
        `https://api.mercadopago.com/v1/payment_methods/search?public_key=${MP_PUBLIC_KEY}&bin=${bin}`
      );
      const data = await response.json();
      const result = data.results && data.results[0];

      if (!result) throw new Error("Tarjeta no identificada por Mercado Pago.");

      return {
        payment_method_id: result.id,
        issuer_id: result.issuer?.id ?? null,
      };
    } catch (e) {
      console.error("Error identificando tarjeta:", e);
      throw new Error("No se pudo identificar la tarjeta. Verificá los datos.");
    }
  };

  // ---------------------------------------------------------------------------
  // PASO B: CREAR "SÚPER TOKEN" (Incluye la metadata dentro)
  // ---------------------------------------------------------------------------
  const createCardToken = async (cardData: any, info: any) => {
    console.log("🛠️ [2. Tokenizar] Creando payload para MP...");

    const [monthStr, yearStr] = cardData.expiry.split("/");
    const year = yearStr.length === 2 ? `20${yearStr}` : yearStr;

    // Construimos el objeto de la tarjeta
    const mpPayload: any = {
      card_number: cardData.number.replace(/\s/g, ""),
      security_code: cardData.cvc,
      expiration_month: parseInt(monthStr, 10),
      expiration_year: parseInt(year, 10),
      cardholder: {
        name: cardData.holder,
        identification: { type: "DNI", number: cardData.dni },
      },
    };

    // INYECCIÓN DE DATOS: Metemos la marca y el emisor DENTRO del token
    if (info.payment_method_id) {
      mpPayload.payment_method_id = info.payment_method_id;
    }
    if (info.issuer_id) {
      mpPayload.issuer = { id: info.issuer_id };
    }

    console.log(
      `📤 [2. Tokenizar] Enviando Metadata en Token: Brand=${info.payment_method_id}, Issuer=${info.issuer_id}`
    );

    const response = await fetch(
      `https://api.mercadopago.com/v1/card_tokens?public_key=${MP_PUBLIC_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mpPayload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Error MP Token:", data);
      throw new Error(data.cause?.[0]?.description || "Error generando Token");
    }

    return data.id; // Retornamos el ID del Token "Súper cargado"
  };

  // ---------------------------------------------------------------------------
  // FUNCIÓN PRINCIPAL
  // ---------------------------------------------------------------------------
  const createMethod = async (type: string, formValues: any) => {
    setLoading(true);
    setError(null);

    try {
      if (!user) throw new Error("Sin usuario");

      const bin = formValues.number.replace(/\s/g, "").substring(0, 6);

      // 1. Identificar Tarjeta
      const cardInfo = await fetchCardInfo(bin);

      // 2. Crear Token
      const token = await createCardToken(formValues, cardInfo);

      // 3. Enviar a Backend
      const userEmail = user.email;
      if (!userEmail) throw new Error("Se necesita un email asociado a tu cuenta.");

      const newCard = await PaymentMethodsService.savePaymentMethod({
        user_id: user.uid || user.id,
        email: userEmail,
        token: token,
        dni: formValues.dni,
      });

      console.log("🎉 [EXITO FINAL]:", newCard);
      Alert.alert("¡Éxito!", "Tarjeta guardada correctamente.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error("🛑 Excepción:", err);
      setError(err.message);
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return { createMethod, loading, error };
};
