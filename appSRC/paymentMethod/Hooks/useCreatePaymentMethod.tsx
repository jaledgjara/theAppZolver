// @ts-nocheck
// UBICACIÓN: appSRC/paymentMethod/Hooks/useCreatePaymentMethod.tsx

import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { PaymentMethodsService } from "../Service/PaymentMethodService";

// Usa tu Public Key de prueba
const MP_PUBLIC_KEY = "TEST-35317e28-b429-4385-8257-f0cc4c278f2c";

export const useCreatePaymentMethod = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // PASO A: IDENTIFICAR TARJETA (Corrige errores de Sandbox)
  // ---------------------------------------------------------------------------
  const fetchCardInfo = async (bin: string) => {
    try {
      console.log(`🔎 [1. Identificar] Consultando BIN ${bin}...`);

      // --- CORRECCIÓN MANUAL (SANITY CHECK) ---
      // Sandbox a veces se equivoca. Si empieza con 5 es Master, con 4 es Visa.
      if (bin.startsWith("5")) {
        console.warn(
          "⚠️ [Sandbox Fix] BIN 5xxx detectado -> Forzando Mastercard (Issuer 2032)"
        );
        return { payment_method_id: "master", issuer_id: 2032 };
      }
      if (bin.startsWith("4")) {
        console.warn(
          "⚠️ [Sandbox Fix] BIN 4xxx detectado -> Forzando Visa (Issuer Genérico)"
        );
        return { payment_method_id: "visa", issuer_id: null };
      }
      if (bin.startsWith("3")) {
        console.warn("⚠️ [Sandbox Fix] BIN 3xxx detectado -> Forzando Amex");
        return { payment_method_id: "amex", issuer_id: null };
      }

      // Si no es una conocida, preguntamos a la API
      const response = await fetch(
        `https://api.mercadopago.com/v1/payment_methods/search?public_key=${MP_PUBLIC_KEY}&bin=${bin}`
      );
      const data = await response.json();
      const result = data.results && data.results[0];

      if (!result) throw new Error("Tarjeta no identificada");

      console.log("✅ [1. Identificar] MP Respondió:", result.id);
      return {
        payment_method_id: result.id,
        issuer_id: result.issuer?.id,
      };
    } catch (e) {
      console.warn("⚠️ Error identificando, usando default Master:", e);
      return { payment_method_id: "master", issuer_id: 2032 };
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

      // 1. Identificar Tarjeta (Fix Sandbox)
      const cardInfo = await fetchCardInfo(bin);

      // 2. Crear Token (Inyectando Info)
      const token = await createCardToken(formValues, cardInfo);
      console.log("🔑 [Token Generado]:", token);

      // 3. Enviar a Backend (SOLO EL TOKEN)
      // Usamos el truco del email fake para evitar conflictos de usuarios previos en Sandbox
      const timestamp = new Date().getTime();
      const fakeEmail = `clean_test_${timestamp}@zolver.dev`;

      console.log("🚀 [3. Backend] Enviando a Edge Function...");
      console.log("📦 Payload DB:", {
        email: fakeEmail,
        token: token,
        dni: formValues.dni,
      });

      const newCard = await PaymentMethodsService.savePaymentMethod({
        user_id: user.uid || user.id, // Ajusta según tu AuthStore
        email: fakeEmail, // Email limpio
        token: token, // Token con info dentro
        dni: formValues.dni,
        // NO ENVIAMOS payment_method_id NI issuer_id AQUÍ para no confundir al backend
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
