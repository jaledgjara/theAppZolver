import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

// Asegúrate de importar tu store de autenticación real
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { PaymentMethodType } from "../Type/PaymentMethodType";
import { PaymentMethodsService } from "../Service/PaymentMethodService";

// [PRODUCCION] Mueve esto a tu archivo .env (EXPO_PUBLIC_MP_PUBLIC_KEY)
const MP_PUBLIC_KEY = "TEST-35317e28-b429-4385-8257-f0cc4c278f2c";

export const useCreatePaymentMethod = () => {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 1. TOKENIZACIÓN REAL (Cliente -> MercadoPago)
   * Enviamos los datos sensibles DIRECTO a MP, ellos nos devuelven un token (tok_...).
   * Nosotros nunca guardamos el número de tarjeta en nuestro servidor.
   */
  const createCardToken = async (cardData: {
    number: string;
    expiry: string; // formato "MM/AA"
    cvc: string;
    holder: string;
    dni: string;
  }): Promise<string> => {
    // A. Parsear fecha MM/AA a Month/Year
    const [monthStr, yearStr] = cardData.expiry.split("/");
    if (!monthStr || !yearStr || yearStr.length !== 2) {
      throw new Error("Fecha de expiración inválida. Usa formato MM/AA");
    }

    const expirationMonth = parseInt(monthStr, 10);
    // Asumimos siglo 2000 (ej: 25 -> 2025)
    const expirationYear = parseInt(`20${yearStr}`, 10);

    // B. Construir Payload para MP
    // NOTA: Si MP devuelve error "214", necesitas agregar un campo DNI en el formulario
    // y enviarlo aquí en identification: { type: "DNI", number: "..." }
    const payload = {
      card_number: cardData.number.replace(/\s/g, ""),
      expiration_month: parseInt(monthStr, 10),
      expiration_year: expirationYear,
      security_code: cardData.cvc,
      cardholder: {
        name: cardData.holder,
        identification: {
          type: "DNI",
          number: cardData.dni, // [UPDATED] Sending DNI to MP
        },
      },
    };

    // C. Llamada a la API de Tokenización de MP
    const response = await fetch(
      `https://api.mercadopago.com/v1/card_tokens?public_key=${MP_PUBLIC_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    console.log("RESPONSE WITH THE PUBLIC KEY:", response);

    const data = await response.json();

    // D. Manejo de Errores de MP
    if (response.status !== 201 && response.status !== 200) {
      console.error("Error MP Token:", data);

      let friendlyError = "No se pudo validar la tarjeta.";

      if (data.cause && data.cause.length > 0) {
        const code = data.cause[0].code;
        switch (code) {
          case "208":
          case "209":
            friendlyError = "Mes/Año de expiración inválido.";
            break;
          case "212":
          case "213":
          case "214":
            friendlyError = "Documento o Titular inválido.";
            break;
          case "220":
          case "221":
            friendlyError = "El banco rechazó el nombre del titular.";
            break;
          case "E301":
            friendlyError = "Número de tarjeta inválido.";
            break;
          case "E302":
            friendlyError = "Código de seguridad (CVC) inválido.";
            break;
        }
      }
      throw new Error(friendlyError);
    }

    return data.id; // Retorna el "tok_12345..."
  };

  const createMethod = async (
    methodType: PaymentMethodType,
    formValues: {
      number: string;
      expiry: string;
      cvc: string;
      holder: string;
      dni: string;
    }
  ) => {
    // 1. Validaciones Básicas de Usuario
    // Nota: Ajusta 'user.id' o 'user.auth_uid' según tu AuthStore
    const userId = user?.uid;

    if (!userId || !user?.email) {
      Alert.alert(
        "Error de Sesión",
        "No se identificó al usuario. Reinicia la app."
      );
      return;
    }

    if (methodType === "platform_credit") {
      Alert.alert("Info", "La billetera ya está activa.");
      return;
    }

    // Validación de campos vacíos
    if (
      !formValues.number ||
      !formValues.expiry ||
      !formValues.cvc ||
      !formValues.holder ||
      !formValues.dni
    ) {
      Alert.alert("Datos Incompletos", "Por favor completa todos los campos.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ---------------------------------------------------------
      // PASO 1: Obtener Token Real desde MercadoPago (Cliente)
      // ---------------------------------------------------------
      console.log("[useCreatePayment] Iniciando tokenización con MP...");
      const token = await createCardToken(formValues);
      console.log("[useCreatePayment] Token generado exitosamente:", token);

      // ---------------------------------------------------------
      // PASO 2: Guardar en Base de Datos (Edge Function)
      // ---------------------------------------------------------
      console.log("[useCreatePayment] Enviando a Edge Function...");
      const newCard = await PaymentMethodsService.savePaymentMethod({
        user_id: userId,
        email: user.email,
        token: token,
        dni: formValues.dni,
      });
      console.log("NEW CARDDDDDDD:", newCard);

      // ---------------------------------------------------------
      // PASO 3: Éxito
      // ---------------------------------------------------------
      Alert.alert("¡Listo!", "Método de pago guardado correctamente.", [
        { text: "Continuar", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error("[useCreatePayment] Error Flow:", err);
      const msg = err.message || "Ocurrió un error inesperado.";
      setError(msg);
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return {
    createMethod,
    loading,
    error,
  };
};
