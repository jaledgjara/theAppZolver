import React from "react";
import PaymentMethodListScreen from "@/appSRC/paymentMethod/Screens/PaymentMethodListScreen";
import { useCheckoutPayment } from "@/appSRC/payments/Hooks/useCheckoutPayment";

/**
 * PaymentScreen (View Layer)
 *
 * Pantalla de checkout. Toda la lógica vive en useCheckoutPayment.
 * Esta vista solo renderiza el selector de tarjetas con el resumen.
 */
export default function PaymentScreen() {
  const { subtotal, hoursLabel, handleConfirmPayment, loading } =
    useCheckoutPayment();

  return (
    <PaymentMethodListScreen
      mode="checkout"
      subtotal={subtotal}
      hoursLabel={hoursLabel}
      onConfirmSelection={handleConfirmPayment}
      paymentLoading={loading}
    />
  );
}
