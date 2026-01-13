import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { COLORS } from "@/appASSETS/theme";
import { PaymentTypeSelector } from "@/appSRC/payments/Screens/PaymentTypeSelector";
import { useCreatePaymentMethod } from "@/appSRC/paymentMethod/Hooks/useCreatePaymentMethod";
import { PaymentMethodType } from "@/appSRC/paymentMethod/Type/PaymentMethodType";

export const PaymentFormScreen = ({ mode, onSuccess }: PaymentFormProps) => {
  // 2. ESTADOS DEL FORMULARIO
  const [newMethodType, setNewMethodType] =
    useState<PaymentMethodType>("credit_card");

  // Inputs
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [holderName, setHolderName] = useState("");
  const [identification, setIdentification] = useState("");

  // 3. HOOK DE LÓGICA (Feature-Based)
  const { createMethod, loading } = useCreatePaymentMethod();

  const isCheckout = mode === "checkout";

  // Helper para formatear fecha MM/AA automáticamente
  const handleExpiryChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, "");
    if (clean.length >= 2) {
      setExpiry(clean.slice(0, 2) + "/" + clean.slice(2, 4));
    } else {
      setExpiry(clean);
    }
  };

  const handleSave = async () => {
    const success = await createMethod(newMethodType, {
      number: cardNumber,
      expiry,
      cvc,
      holder: holderName,
      dni: identification,
    });
  };

  // Validación visual
  const isValid =
    newMethodType === "platform_credit" ||
    (cardNumber.length >= 15 &&
      expiry.length === 5 &&
      cvc.length >= 3 &&
      holderName.length > 3 &&
      identification.length > 6);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}>
      <View style={styles.container}>
        {/* Título dinámico según el contexto */}
        <ToolBarTitle
          titleText={isCheckout ? "Confirmar y Pagar" : "Nuevo Método"}
          showBackButton={true}
        />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 1. SELECTOR DE TIPO */}
          <PaymentTypeSelector
            selectedMethod={newMethodType}
            onSelect={(type) => setNewMethodType(type)}
          />

          {/* 2. FORMULARIO DINÁMICO */}
          <View style={styles.formContainer}>
            {newMethodType !== "platform_credit" ? (
              <View style={styles.inputsWrapper}>
                <Text style={styles.label}>Datos de la tarjeta</Text>

                <TextInput
                  placeholder="Número de Tarjeta"
                  placeholderTextColor="#999"
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={16}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                />

                <View style={styles.row}>
                  <TextInput
                    placeholder="MM/AA"
                    placeholderTextColor="#999"
                    style={[styles.input, { flex: 1, marginRight: 10 }]}
                    maxLength={5}
                    value={expiry}
                    onChangeText={handleExpiryChange}
                    keyboardType="numeric"
                  />
                  <TextInput
                    placeholder="CVC"
                    placeholderTextColor="#999"
                    style={[styles.input, { flex: 1 }]}
                    keyboardType="numeric"
                    maxLength={4}
                    value={cvc}
                    onChangeText={setCvc}
                    secureTextEntry={true}
                  />
                </View>

                <TextInput
                  placeholder="Nombre del Titular (Como figura en tarjeta)"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={holderName}
                  onChangeText={setHolderName}
                  autoCapitalize="characters"
                />

                <TextInput
                  placeholder="DNI / Cédula del Titular"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={identification}
                  onChangeText={setIdentification}
                  keyboardType="numeric"
                  maxLength={10}
                />

                {newMethodType === "credit_card" && (
                  <View style={styles.installmentBox}>
                    <Text style={styles.helperText}>
                      Las cuotas se seleccionan al momento de pagar.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              // 3. VISTA WALLET
              <View style={styles.walletInfo}>
                <Ionicons name="wallet" size={40} color={COLORS.primary} />
                <Text style={styles.walletText}>Zolver Wallet</Text>
                <Text style={styles.walletSub}>
                  Este método ya está activo en tu cuenta.
                </Text>
              </View>
            )}
          </View>

          <LargeButton
            title={
              loading
                ? "Procesando..."
                : isCheckout
                ? "Pagar ahora"
                : "Guardar Método"
            }
            onPress={handleSave}
            disabled={loading || !isValid}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "white" },
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  formContainer: { marginVertical: 10 },
  inputsWrapper: { gap: 15 },
  label: { fontSize: 14, fontWeight: "bold", color: "#333", marginBottom: 5 },
  input: {
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: "#333",
  },
  row: { flexDirection: "row" },
  installmentBox: {
    padding: 20,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    marginTop: 5,
    alignItems: "center",
  },
  helperText: { color: "#666", fontSize: 13 },
  walletInfo: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  walletText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  walletSub: { fontSize: 13, color: "#999", marginTop: 5, textAlign: "center" },
});

export default PaymentFormScreen;
