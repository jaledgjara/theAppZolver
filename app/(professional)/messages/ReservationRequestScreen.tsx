import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS } from "@/appASSETS/theme";
import { useSendBudget } from "@/appSRC/messages/Hooks/useSendBudget";
import { LargeButton } from "@/appCOMP/button/LargeButton";

const ReservationRequestScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();

  // Parámetros obligatorios recibidos desde el Chat
  const conversationId = params.conversationId as string;
  const targetClientId = params.clientId as string;

  // --- CUSTOM HOOK DE LOGICA ---
  const { sendBudget, loading } = useSendBudget(conversationId, targetClientId);

  // --- ESTADOS LOCALES (Solo inputs UI) ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText="Crear Presupuesto"
        showBackButton={true}
        onBackPress={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Header Informativo */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Estás enviando una propuesta oficial. El cliente podrá aceptarla
              directamente desde el chat.
            </Text>
          </View>

          <Text style={styles.label}>Título del Trabajo</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Cambio de cañería cocina"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Precio Total ($)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Detalles / Condiciones</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Describe qué incluye el precio..."
            placeholderTextColor="#9CA3AF"
          />

          <LargeButton
            title={loading ? "Enviando..." : "Enviar propuesta"}
            onPress={() => sendBudget(title, price, description)}
            loading={loading}
            disabled={!title || !price}
            backgroundColor={COLORS.primary}
            textColor={COLORS.white}
            iconName="send-outline"
            iconSize={20}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ReservationRequestScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  infoBox: {
    backgroundColor: COLORS.primaryBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  infoText: { color: COLORS.textSecondary, fontSize: 13 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#EEE",
    backgroundColor: "white",
  },
  submitButton: {
    backgroundColor: COLORS.tertiary, // Color distintivo para Acciones Pro
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
