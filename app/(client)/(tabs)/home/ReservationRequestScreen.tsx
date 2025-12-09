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

// 👇 IMPORTACIÓN DEL BUILDER (El encargado de la limpieza)

const ReservationRequestScreen = () => {
  // 1. ESTADO & HOOKS
  const user = useAuthStore((state) => state.user);
  const { createReservation, loading } = useCreateReservation();

  // 2. PARÁMETROS (Contexto)
  const params = useLocalSearchParams();
  const professionalId = params.id as string;
  const professionalName = (params.name as string) || "Profesional";
  const category = (params.category as string) || "General";
  const mode = (params.mode as ProfessionalTypeWork) || "quote";
  const pricePerHour = params.price ? parseFloat(params.price as string) : 0;
  const isInstant = mode === "instant";

  // 3. INPUTS DEL USUARIO
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [startTime] = useState(new Date()); // MVP: Fecha fija "Ahora"

  // 4. HANDLER LIMPIO ✨
  const handleSend = () => {
    // Validaciones de UI (Solo checkear que existan datos)
    if (!user?.uid)
      return Alert.alert("Error", "Sesión inválida. Recarga la App.");
    if (!title.trim() || !description.trim() || !address.trim()) {
      return Alert.alert(
        "Faltan datos",
        "Completa todos los campos por favor."
      );
    }

    // Delegamos la complejidad al Builder 🏗️
    const payload = buildReservationPayload({
      clientId: user.uid,
      professionalId,
      category,
      title,
      description,
      address,
      startTime,
      isInstant,
      pricePerHour,
    });

    // Ejecutamos la acción 🚀
    createReservation(mode, payload);
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText={isInstant ? "Confirmar Reserva" : "Solicitar Presupuesto"}
        showBackButton={true}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Tarjeta de Información */}
          <View style={styles.infoCard}>
            <Text style={styles.proName}>Zolver: {professionalName}</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: isInstant ? "#E3F2FD" : "#FFF3E0" },
              ]}>
              <Text
                style={[
                  styles.badgeText,
                  { color: isInstant ? "#1976D2" : "#F57C00" },
                ]}>
                {isInstant
                  ? "⚡️ SERVICIO INMEDIATO"
                  : "📄 SOLICITUD DE COTIZACIÓN"}
              </Text>
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título Breve</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Cambio de cerradura"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Detalle</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe el trabajo..."
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dirección</Text>
            <TextInput
              style={styles.input}
              placeholder="Calle y altura..."
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Horario</Text>
            <Text style={styles.readOnlyText}>
              {isInstant ? "Lo antes posible (Ahora)" : "A coordinar"}
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {isInstant && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total Estimado (2hs)</Text>
              <Text style={styles.priceValue}>
                ${(pricePerHour * 2 * 1.1).toFixed(0)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: isInstant ? COLORS.primary : COLORS.tertiary },
              (!user || loading) && { opacity: 0.5 },
            ]}
            onPress={handleSend}
            disabled={loading || !user}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isInstant ? "CONFIRMAR PEDIDO" : "ENVIAR SOLICITUD"}
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
  scrollContent: { padding: 20 },
  infoCard: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  proName: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 8 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: { fontSize: 12, fontWeight: "bold" },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#555", marginBottom: 8 },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  readOnlyText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    marginTop: 5,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#EEE",
    backgroundColor: "white",
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    alignItems: "center",
  },
  priceLabel: { fontSize: 14, color: "#666" },
  priceValue: { fontSize: 22, fontWeight: "bold", color: COLORS.textPrimary },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
