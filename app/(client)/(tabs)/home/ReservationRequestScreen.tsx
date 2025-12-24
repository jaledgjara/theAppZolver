import React, { useState, useEffect } from "react";
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

// Componentes
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import QuickChips from "@/appCOMP/quickChips/QuickChips";

// Hooks & Servicios
import { COLORS } from "@/appASSETS/theme";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useCreateReservation } from "@/appSRC/reservations/Hooks/useCreateReservation";
import { buildReservationPayload } from "@/appSRC/reservations/Build/ReservationBuilder";
import { ServiceTag } from "@/appSRC/categories/Service/ProfessionalCatalog";
import { ProfessionalTypeWork } from "@/appSRC/users/Model/ProfessionalTypeWork";
import { useReservationPricing } from "@/appSRC/reservations/Hooks/useReservationPricing";
import { useServiceMetadata } from "@/appSRC/searchable/Hooks/useServiceMetadata";
import { useLocationStore } from "@/appSRC/location/Store/LocationStore";

const ReservationRequestScreen = () => {
  // --- 1. CONTEXTO Y PARAMS ---
  const user = useAuthStore((state) => state.user);
  const activeAddress = useLocationStore((state) => state.activeAddress); // <--- LECTURA DEL STORE
  const params = useLocalSearchParams();
  const router = useRouter();

  const professionalId = params.id as string;
  const professionalName = (params.name as string) || "Profesional";
  const categoryIdParam = params.categoryId as string;
  const categoryName = (params.category as string) || "General";
  const mode = (params.mode as ProfessionalTypeWork) || "quote";
  const pricePerHour = params.price ? parseFloat(params.price as string) : 0;
  const isInstant = mode === "instant";

  // --- 2. LOGICA DE NEGOCIO ---
  const { createReservation, loading: submitting } = useCreateReservation();
  const { tags: availableTags, loading: loadingTags } = useServiceMetadata(
    categoryIdParam,
    categoryName
  );

  // Estado Local
  const [selectedTags, setSelectedTags] = useState<ServiceTag[]>([]);
  const [description, setDescription] = useState("");
  // Eliminamos 'address' del estado local
  const [startTime] = useState(new Date());

  const estimates = useReservationPricing(
    selectedTags,
    pricePerHour,
    isInstant
  );

  // --- 3. HANDLERS ---
  const handleTagToggle = (tag: ServiceTag) => {
    const exists = selectedTags.find((t) => t.id === tag.id);
    if (exists) {
      setSelectedTags(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSend = () => {
    if (!user?.uid) return Alert.alert("Error", "Sesión inválida.");
    console.log("🔍 [UI] Mode:", mode);
    console.log("🔍 [UI] Is Instant?:", isInstant);
    console.log("🔍 [UI] Price Per Hour (Params):", pricePerHour);
    // 1. Validación de Integridad
    if (!activeAddress)
      return Alert.alert(
        "Faltan datos",
        "Por favor selecciona una dirección de servicio."
      );

    // 2. Construcción del Payload
    // NOTA: Ya no calculamos 'generatedTitle' ni 'addressString' aquí.
    // Pasamos los objetos completos al Builder.
    const payload = buildReservationPayload({
      clientId: user.uid,
      professionalId,
      category: categoryName,
      selectedTags: selectedTags,
      activeAddress: activeAddress,
      description: description,
      startTime,
      isInstant,
      pricePerHour: estimates.finalPrice,
    });
    console.log("🔍 [UI] Mode:", mode);
    console.log("🔍 [UI] Is Instant?:", isInstant);
    console.log("🔍 [UI] Price Per Hour (Params):", pricePerHour);

    createReservation(mode, payload);

    console.log("🔍 [UI] Mode:", mode);
    console.log("🔍 [UI] Is Instant?:", isInstant);
    console.log("🔍 [UI] Price Per Hour (Params):", pricePerHour);
  };

  const handleChangeLocation = () => {
    // Aquí navegarías a tu pantalla de selección de dirección si es necesario
    // router.push("/(client)/(tabs)/profile/addresses");
    Alert.alert("Navegación", "Ir a mis direcciones (Implementar ruta)");
  };

  // --- 4. RENDER ---
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
          {/* Info Card - Sin cambios */}
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

          {/* Sección de Tags (INPUT PRINCIPAL) */}
          <View style={styles.section}>
            <Text style={styles.label}>¿Qué necesitas realizar?</Text>
            {loadingTags ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <QuickChips
                items={availableTags}
                selectedIds={selectedTags.map((t) => t.id)}
                onToggle={handleTagToggle}
              />
            )}
          </View>

          {/* IMPLEMENTACIÓN DE LA OPCIÓN 1: Enfoque Híbrido */}
          <View style={styles.inputGroup}>
            <Text style={styles.labelSecondary}>Notas opcionales</Text>
            <TextInput
              style={[styles.input, styles.textAreaSecondary]}
              placeholder="Ej: El timbre no funciona, traer herramientas especiales..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* IMPLEMENTACIÓN DE LA OPCIÓN 2: Ubicación desde Store */}
          <View style={styles.section}>
            <Text style={styles.label}>Ubicación del servicio</Text>
            <View style={styles.locationContainer}>
              <View style={styles.locationIconContainer}>
                <Text style={{ fontSize: 20 }}>📍</Text>
              </View>
              <View style={{ flex: 1 }}>
                {activeAddress ? (
                  <>
                    <Text style={styles.locationTitle}>
                      {activeAddress.label || "Mi Ubicación"}
                    </Text>
                    <Text style={styles.locationText}>
                      {activeAddress.address_street}{" "}
                      {activeAddress.address_number}
                    </Text>
                    {activeAddress.apartment && (
                      <Text style={styles.locationSubText}>
                        Piso: {activeAddress.floor}, Depto:{" "}
                        {activeAddress.apartment}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={[styles.locationText, { color: COLORS.error }]}>
                    Sin dirección seleccionada
                  </Text>
                )}
              </View>

              {/* Botón discreto para cambiar si es necesario */}
              <TouchableOpacity onPress={handleChangeLocation}>
                <Text style={styles.changeLink}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Footer - Sin cambios */}
        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tiempo Estimado:</Text>
              <Text style={styles.priceValueSmall}>
                {estimates.hoursLabel} hs
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Total Estimado:</Text>
              <Text style={styles.priceValue}>
                ${estimates.finalPrice.toLocaleString()}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: isInstant ? COLORS.primary : COLORS.tertiary },
              submitting && { opacity: 0.5 },
            ]}
            onPress={handleSend}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isInstant ? `CONFIRMAR` : "ENVIAR SOLICITUD"}
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
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24 }, // Aumentado ligeramente para separar bloques
  infoCard: {
    marginBottom: 20,
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

  // ESTILOS PARA INPUTS
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: "700", color: "#333", marginBottom: 10 },

  // Estilo "Secundario" para el Híbrido (Texto opcional)
  labelSecondary: {
    fontSize: 13,
    fontWeight: "500",
    color: "#777",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  textAreaSecondary: {
    height: 60, // Menor altura para denotar menos importancia
    textAlignVertical: "top",
    backgroundColor: "#FAFAFA", // Fondo ligeramente gris
    fontSize: 14,
  },

  // ESTILOS PARA UBICACIÓN (READ ONLY)
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F4F8",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E1E8ED",
  },
  locationIconContainer: {
    marginRight: 12,
    width: 32,
    alignItems: "center",
  },
  locationTitle: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "bold",
    marginBottom: 2,
  },
  locationText: { fontSize: 15, color: "#333", fontWeight: "500" },
  locationSubText: { fontSize: 12, color: "#666", marginTop: 2 },
  changeLink: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
    paddingLeft: 8,
  },

  // Footer styles
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
  priceContainer: { marginBottom: 15 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    alignItems: "center",
  },
  priceLabel: { fontSize: 14, color: "#666" },
  priceValueSmall: { fontSize: 16, fontWeight: "600", color: "#444" },
  priceValue: { fontSize: 24, fontWeight: "bold", color: COLORS.textPrimary },
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
