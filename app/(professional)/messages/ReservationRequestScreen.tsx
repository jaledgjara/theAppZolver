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
  // 1. Obtener Usuario Logueado (Firebase ID)
  const user = useAuthStore((state) => state.user);

  // 2. Obtener Params de Navegación (Contexto del Chat)
  const params = useLocalSearchParams();
  const { createReservation, loading } = useCreateReservation();

  // --- 🧠 LÓGICA CORE: INVERSIÓN DE ROLES ---
  const isProfessional = user?.role === "professional";

  // Si soy PRO: Yo soy el professionalId, el cliente viene por params.
  // Si soy CLIENTE: Yo soy el clientId, el profesional viene por params.
  const targetClientId = isProfessional
    ? (params.clientId as string) // ID del cliente con el que chateo
    : user?.uid; // Mi ID

  const targetProfessionalId = isProfessional
    ? user?.uid // Mi ID
    : (params.id as string); // ID del perfil que estoy viendo

  // Modo por defecto
  const mode = (params.mode as ProfessionalTypeWork) || "quote";
  const isInstant = mode === "instant";

  // State del Formulario
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  // Nota: Si es Quote, la dirección podría venir del pedido original o dejarse en blanco para negociar.

  const handleSend = () => {
    // 1. Validación de Seguridad
    if (!user?.uid) return Alert.alert("Error", "Sesión no válida");

    // 2. Validación de Datos Cruzados
    if (!targetClientId || !targetProfessionalId) {
      console.log("DEBUG ERROR IDs:", { targetClientId, targetProfessionalId });
      return Alert.alert(
        "Error Técnico",
        "Faltan los IDs de las partes involucradas."
      );
    }

    if (!title.trim() || !description.trim()) {
      return Alert.alert(
        "Faltan datos",
        "Por favor completa título y detalle."
      );
    }

    // 3. Construcción del Payload (Ahora con los IDs correctos)
    const payload = buildReservationPayload({
      clientId: targetClientId, // <--- ID Correcto
      professionalId: targetProfessionalId, // <--- ID Correcto (Tu ID de Firebase)
      category: (params.category as string) || "General",
      title,
      description,
      address: address || "A coordinar",
      startTime: new Date(),
      isInstant,
      pricePerHour: params.price ? parseFloat(params.price as string) : 0,
    });
    console.log("INTENTANDO CREAR RESERVA:", {
      mode,
      professionalId: payload.professionalId, // <--- ESTO SEGURO ES UNDEFINED
      clientId: payload.clientId,
    });
    // 4. Ejecutar
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
          {/* Aviso Visual de Rol */}
          <View
            style={{
              marginBottom: 20,
              padding: 10,
              backgroundColor: isProfessional ? "#E3F2FD" : "#FFF3E0",
              borderRadius: 8,
            }}>
            <Text
              style={{
                color: isProfessional ? "#1565C0" : "#E65100",
                fontWeight: "bold",
              }}>
              {isProfessional
                ? `📝 Creando cotización para el Cliente`
                : `📅 Solicitando servicio al Profesional`}
            </Text>
          </View>

          {/* Inputs... (Mismos de tu código anterior) */}
          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Instalación eléctrica completa"
          />

          <Text style={styles.label}>Detalle / Costos</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Describe el trabajo y el costo total propuesto..."
          />

          <Text style={styles.label}>Dirección / Ubicación</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Dirección del trabajo"
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
