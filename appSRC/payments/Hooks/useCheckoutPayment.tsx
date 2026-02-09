import { useState, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useLocationStore } from "@/appSRC/location/Store/LocationStore";
import { PaymentMethodsService } from "@/appSRC/paymentMethod/Service/PaymentMethodService";
import { PaymentService } from "../Service/PaymentService";
import { CreatePaymentPayload } from "../Type/PaymentType";
import { updateBudgetMessageStatusService } from "@/appSRC/messages/Service/MessageService";

// ============================================================================
// CONSTANTES
// ============================================================================
const PLATFORM_FEE_RATE = 0.05;
const MP_PUBLIC_KEY = "TEST-35317e28-b429-4385-8257-f0cc4c278f2c";

// ============================================================================
// UTILIDAD: Re-tokenizar tarjeta guardada via MP Public API
// ============================================================================
const createSavedCardToken = async (
  providerCardId: string,
): Promise<string> => {
  console.log("[useCheckoutPayment] Re-tokenizando tarjeta guardada...");

  const response = await fetch(
    `https://api.mercadopago.com/v1/card_tokens?public_key=${MP_PUBLIC_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_id: providerCardId,
        security_code: "123", // TODO PROD: Reemplazar con input real del CVV
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("[useCheckoutPayment] MP Token Error:", data);
    throw new Error(
      data.cause?.[0]?.description ||
        data.message ||
        "Error generando token de pago.",
    );
  }

  console.log("[useCheckoutPayment] Token generado:", data.id);
  return data.id;
};

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Config explícita para el hook. Si se provee, tiene prioridad sobre
 * los parámetros de navegación. Esto permite reutilizar el hook desde
 * cualquier pantalla (Instant checkout, Budget confirmation, etc.)
 */
export interface CheckoutConfig {
  subtotal: number;
  hoursLabel?: string;
  professionalId: string;
  serviceCategory: string;
  serviceModality: string;
  /** ID del mensaje de presupuesto (solo flujo Budget). */
  messageId?: string;
  /** Payload del budget para actualizar el mensaje post-pago. */
  budgetPayload?: Record<string, unknown>;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

/**
 * Hook reutilizable que orquesta todo el flujo de checkout:
 *
 * Flujo Instant (sin config): Lee params de useLocalSearchParams().
 * Flujo Budget  (con config): Recibe los datos directamente.
 *
 * Pasos:
 * 1. Re-tokeniza la tarjeta guardada
 * 2. Construye el payload completo
 * 3. Llama al servicio de pago (Edge Function)
 * 4. [Budget] Actualiza el mensaje de presupuesto a "confirmed"
 * 5. Navega al tab de reservas
 */
export const useCheckoutPayment = (config?: CheckoutConfig) => {
  const router = useRouter();
  const navParams = useLocalSearchParams();
  const { user } = useAuthStore();
  const activeAddress = useLocationStore((state) => state.activeAddress);

  // --- Estado ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  // --- Resolver datos: config explícita tiene prioridad sobre nav params ---
  const subtotal = (config?.subtotal ?? Number(navParams.subtotal)) || 0;
  const hoursLabel =
    (config?.hoursLabel ?? (navParams.hoursLabel as string)) || undefined;
  const professionalId =
    config?.professionalId ?? (navParams.professionalId as string);
  const serviceCategory =
    (config?.serviceCategory ?? (navParams.serviceCategory as string)) || "";
  const serviceModality =
    (config?.serviceModality ?? (navParams.serviceModality as string)) ||
    "quote";
  const messageId =
    (config?.messageId ?? (navParams.messageId as string)) || undefined;
  const budgetPayload = config?.budgetPayload;

  // --- Calculo de precio ---
  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
  const totalAmount = subtotal + platformFee;

  // --- Handler principal ---
  const handleConfirmPayment = useCallback(
    async (selectedCardId: string) => {
      // LOCK: Prevenir doble-tap
      if (submittingRef.current) {
        console.warn(
          "[useCheckoutPayment] Pago ya en curso, ignorando tap duplicado.",
        );
        return;
      }

      // Validaciones
      if (!user || !user.uid) {
        Alert.alert("Error", "Debes iniciar sesión.");
        return;
      }
      if (!professionalId) {
        Alert.alert("Error", "No se encontró el profesional.");
        return;
      }
      if (totalAmount <= 0) {
        Alert.alert("Error", "El monto no es válido.");
        return;
      }

      submittingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        // STEP 1: Obtener IDs del proveedor (MP)
        const providerDetails =
          await PaymentMethodsService.fetchCardProviderDetails(selectedCardId);

        console.log("[useCheckoutPayment] Provider:", {
          card: providerDetails.provider_card_id,
          customer: providerDetails.provider_customer_id,
          brand: providerDetails.brand,
        });

        // STEP 2: Re-tokenizar
        const realToken = await createSavedCardToken(
          providerDetails.provider_card_id,
        );

        // STEP 3: Construir payload
        const payload: CreatePaymentPayload = {
          card_token: realToken,
          amount: totalAmount,
          payer_email: user.email || "",
          payment_method_id: providerDetails.brand,
          user_id: user.uid,
          professional_id: professionalId,
          service_category: serviceCategory,
          service_modality: serviceModality,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 3600000).toISOString(),
          address_display: activeAddress
            ? `${activeAddress.address_street} ${activeAddress.address_number}`
            : "Sin dirección",
          coordinates: activeAddress?.coords
            ? {
                latitude: activeAddress.coords.lat,
                longitude: activeAddress.coords.lng,
              }
            : undefined,
          customer_id: providerDetails.provider_customer_id,
          saved_card_id: selectedCardId,
          method: "credit_card",
        };

        console.log("[useCheckoutPayment] Initiating payment:", {
          amount: totalAmount,
          card: providerDetails.brand,
          professional: professionalId,
          mode: messageId ? "BUDGET" : "INSTANT",
        });

        // STEP 4: Procesar pago via Edge Function
        const data = await PaymentService.createPayment(payload);
        console.log(
          "[useCheckoutPayment] Payment success:",
          data.reservation_id,
        );

        // STEP 5 (Budget only): Actualizar mensaje a "confirmed"
        if (messageId) {
          try {
            const updatedPayload = {
              ...(budgetPayload || {}),
              status: "confirmed",
            };
            const updated = await updateBudgetMessageStatusService(
              messageId,
              updatedPayload,
            );
            console.log(
              `[useCheckoutPayment] Message update: ${updated ? "OK" : "FAILED"}`,
            );
          } catch (msgErr) {
            console.warn(
              "[useCheckoutPayment] Failed to update message status:",
              msgErr,
            );
            // No bloqueamos: el pago ya fue exitoso
          }
        }

        // STEP 6: Navegar al tab de reservas
        Alert.alert("Pago procesado", "Tu reserva fue creada exitosamente.", [
          {
            text: "Ver mis reservas",
            onPress: () => router.replace("/(client)/(tabs)/reservations"),
          },
        ]);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error procesando el pago.";
        console.error("[useCheckoutPayment] Error:", message);
        setError(message);
        Alert.alert("Error en el pago", message);
      } finally {
        submittingRef.current = false;
        setLoading(false);
      }
    },
    [
      user,
      professionalId,
      totalAmount,
      activeAddress,
      serviceCategory,
      serviceModality,
      messageId,
      budgetPayload,
      router,
    ],
  );

  return {
    loading,
    error,
    subtotal,
    hoursLabel,
    handleConfirmPayment,
  };
};
