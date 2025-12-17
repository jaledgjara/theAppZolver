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
import { useLocalSearchParams } from "expo-router";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS } from "@/appASSETS/theme";
import { useCreateReservation } from "@/appSRC/reservations/Hooks/useCreateReservation";
import { ProfessionalTypeWork } from "@/appSRC/userProf/Type/ProfessionalTypeWork";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { buildReservationPayload } from "@/appSRC/reservations/Build/ReservationBuilder";

const ReservationRequestScreen = () => {
  const user = useAuthStore((state) => state.user);
  const params = useLocalSearchParams();
  const { createReservation, loading } = useCreateReservation();

  const isProfessional = user?.role === "professional";

  // IDs cruzados
  const targetClientId = isProfessional
    ? (params.clientId as string)
    : user?.uid;
  const targetProfessionalId = isProfessional
    ? user?.uid
    : (params.id as string);

  const mode = (params.mode as ProfessionalTypeWork) || "quote";
  const isInstant = mode === "instant";

  // --- ESTADOS DEL FORMULARIO ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  // 💰 NUEVO: Estado para el precio propuesto
  const [priceStr, setPriceStr] = useState("");

  const handleSend = () => {
    if (!user?.uid) return Alert.alert("Error", "Sesión no válida");

    if (!title.trim())
      return Alert.alert("Falta Título", "Ingresa un título corto.");

    // Validación de precio si es presupuesto
    const proposedPrice = parseFloat(priceStr);
    if (!isInstant && (isNaN(proposedPrice) || proposedPrice <= 0)) {
      return Alert.alert(
        "Precio Inválido",
        "Por favor ingresa un monto estimado mayor a 0."
      );
    }

    // Usamos el Builder corregido
    const payload = buildReservationPayload({
      clientId: targetClientId!,
      professionalId: targetProfessionalId!,
      category: (params.category as string) || "General",
      title: title!,
      description: description, // Aquí va el detalle de texto
      startTime: new Date(),
      isInstant,
      pricePerHour: params.price ? parseFloat(params.price as string) : 0,

      // Pasamos el precio manual
      proposedPrice: proposedPrice,
    });

    createReservation(mode, payload);
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText={isProfessional ? "Enviar Presupuesto" : "Solicitar Reserva"}
        showBackButton={true}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Header Visual */}
          <View
            style={[
              styles.headerBadge,
              { backgroundColor: isProfessional ? "#E3F2FD" : "#FFF3E0" },
            ]}>
            <Text
              style={{
                color: isProfessional ? "#1565C0" : "#E65100",
                fontWeight: "bold",
              }}>
              {isProfessional ? "📝 Cotización" : "📅 Solicitud"}
            </Text>
          </View>

          {/* 1. TÍTULO */}
          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Reparación de Aire Acondicionado"
            placeholderTextColor="#999"
          />

          {/* 2. COSTO (DINERO) - Solo visible si es Cotización o Reserva con precio variable */}
          <Text style={styles.label}>Costo Estimado (ARS)</Text>
          <TextInput
            style={styles.input}
            value={priceStr}
            onChangeText={setPriceStr}
            placeholder="0.00"
            keyboardType="numeric"
            placeholderTextColor="#999"
          />

          {/* 3. DETALLE / DESCRIPCIÓN */}
          <Text style={styles.label}>Detalle del Trabajo</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Describe qué incluye el presupuesto..."
            placeholderTextColor="#999"
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: isProfessional
                  ? COLORS.tertiary
                  : COLORS.primary,
              },
            ]}
            onPress={handleSend}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isProfessional ? "ENVIAR PRESUPUESTO" : "CONFIRMAR SOLICITUD"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ReservationRequestScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  headerBadge: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
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
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
    backgroundColor: "white",
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
