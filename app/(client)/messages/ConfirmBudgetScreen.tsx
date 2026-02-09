import React from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

// UI
import { COLORS } from "@/appASSETS/theme";
import PaymentMethodListScreen from "@/appSRC/paymentMethod/Screens/PaymentMethodListScreen";

// Logic
import {
  useCheckoutPayment,
  CheckoutConfig,
} from "@/appSRC/payments/Hooks/useCheckoutPayment";
import { useBudgetValidation } from "@/appSRC/reservations/Hooks/useBudgetValidation";

/**
 * ConfirmBudgetScreen (Budget Checkout Flow)
 *
 * Flujo:
 * 1. Valida integridad del presupuesto (useBudgetValidation)
 * 2. Muestra selección de tarjetas (PaymentMethodListScreen)
 * 3. Procesa pago y crea reserva (useCheckoutPayment)
 * 4. Actualiza el mensaje de presupuesto a "confirmed"
 * 5. Navega al tab de reservas
 */
const ConfirmBudgetScreen = () => {
  const params = useLocalSearchParams();

  const { professionalId, budgetPrice, budgetTitle, messageId, budgetNotes } =
    params;

  const subtotalNum = parseFloat(budgetPrice as string) || 0;

  // 1. Validación de integridad del presupuesto
  const { isValid, validating } = useBudgetValidation(messageId as string);

  // 2. Config explícita para reutilizar el checkout hook
  const checkoutConfig: CheckoutConfig = {
    subtotal: subtotalNum,
    hoursLabel: budgetTitle as string,
    professionalId: professionalId as string,
    serviceCategory: budgetTitle as string,
    serviceModality: "quote",
    messageId: messageId as string,
    budgetPayload: {
      serviceName: budgetTitle as string,
      price: subtotalNum,
      notes: budgetNotes as string,
      proposedDate: new Date().toISOString(),
    },
  };

  // 3. Hook de checkout reutilizable
  const { subtotal, hoursLabel, handleConfirmPayment, loading } =
    useCheckoutPayment(checkoutConfig);

  // --- Estado: Validando presupuesto ---
  if (validating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Verificando disponibilidad...</Text>
      </View>
    );
  }

  // --- Estado: Presupuesto inválido ---
  if (!isValid) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Presupuesto no disponible</Text>
      </View>
    );
  }

  // --- Checkout View: Tarjetas + Resumen + Pagar ---
  return (
    <PaymentMethodListScreen
      mode="checkout"
      subtotal={subtotal}
      hoursLabel={hoursLabel}
      infoLabel="Servicio"
      infoSuffix=""
      onConfirmSelection={handleConfirmPayment}
      paymentLoading={loading}
      formScreenPath="/(client)/messages/BudgetPaymentFormScreen"
    />
  );
};

export default ConfirmBudgetScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F6F8",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
  },
});
