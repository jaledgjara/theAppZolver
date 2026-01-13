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

const PaymentFormScreen = () => {
  // 1. ESTADOS DEL FORMULARIO
  const [newMethodType, setNewMethodType] =
    useState<PaymentMethodType>("credit_card");

  // Inputs
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [holderName, setHolderName] = useState("");
  const [identification, setIdentification] = useState(""); // [NUEVO] DNI para MercadoPago

  // 2. HOOK DE LÓGICA
  const { createMethod, loading } = useCreatePaymentMethod();

  // Helper para formatear fecha MM/AA automáticamente
  const handleExpiryChange = (text: string) => {
    // Eliminar todo lo que no sea número
    const clean = text.replace(/[^0-9]/g, "");
    if (clean.length >= 2) {
      // Agregar la barra después del mes
      setExpiry(clean.slice(0, 2) + "/" + clean.slice(2, 4));
    } else {
      setExpiry(clean);
    }
  };

  const handleSave = () => {
    // Aquí ya estás pasando todo lo que el nuevo Hook necesita
    createMethod(newMethodType, {
      number: cardNumber, // El Hook usará esto para detectar la Marca/Issuer
      expiry,
      cvc,
      holder: holderName,
      dni: identification, // El Hook usará esto para el Token
    });
  };

  // Validación visual para deshabilitar botón
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
      style={{ flex: 1, backgroundColor: "white" }}>
      <View style={styles.container}>
        <ToolBarTitle titleText="Nuevo Método" showBackButton={true} />

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

                {/* NÚMERO DE TARJETA */}
                <TextInput
                  placeholder="Número de Tarjeta"
                  placeholderTextColor="#999"
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={16}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                />

                {/* FECHA Y CVC */}
                <View style={styles.row}>
                  <TextInput
                    placeholder="MM/AA"
                    placeholderTextColor="#999"
                    style={[styles.input, { flex: 1, marginRight: 10 }]}
                    maxLength={5}
                    value={expiry}
                    onChangeText={handleExpiryChange} // Usamos el helper con máscara
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

                {/* NOMBRE TITULAR */}
                <TextInput
                  placeholder="Nombre del Titular (Como figura en tarjeta)"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={holderName}
                  onChangeText={setHolderName}
                  autoCapitalize="characters"
                />

                {/* [CRÍTICO] DNI DEL TITULAR */}
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
                    <Text style={{ color: "#666", fontSize: 13 }}>
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
            title={loading ? "Procesando..." : "Guardar Método"}
            onPress={handleSave}
            disabled={loading || !isValid}
          />
        </ScrollView>

        {/* FOOTER */}
      </View>
    </KeyboardAvoidingView>
  );
};

export default PaymentFormScreen;

const styles = StyleSheet.create({
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

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#EEE",
    // Fix para teclados en iOS/Android que tapan el botón
    marginBottom: Platform.OS === "ios" ? 10 : 0,
  },
});
