// app/(client)/(tabs)/home/ReservationRequestScreen.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// Componentes
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import QuickChips from "@/appCOMP/quickChips/QuickChips";
import { CheckoutSummaryCard } from "@/appCOMP/cards/CheckoutSummaryCard";

// Hooks & Estilos
import { COLORS } from "@/appASSETS/theme";
import { useReservationPricing } from "@/appSRC/reservations/Hooks/useReservationPricing";
import { useLocationStore } from "@/appSRC/location/Store/LocationStore";
import { formatAddress } from "@/appSRC/location/Type/LocationType";
import { ProfessionalTemplate } from "@/appSRC/templates/Type/TemplateType";
import { useProfessionalServices } from "@/appSRC/templates/Hooks/useProfessionalServices";

const ReservationRequestScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const activeAddress = useLocationStore((state) => state.activeAddress);

  // Sincronización de Identidad: professionalId (UID de Firebase)
  const professionalId = params.professionalId as string;
  const professionalName = (params.name as string) || "Profesional";
  const mode = (params.mode as any) || "quote";
  const isInstant = mode === "instant";

  // Lógica de Servicios
  const { services: availableServices, loading: loadingServices } =
    useProfessionalServices(professionalId);

  const [selectedServices, setSelectedServices] = useState<
    ProfessionalTemplate[]
  >([]);
  const [description, setDescription] = useState("");

  const estimates = useReservationPricing(selectedServices, isInstant);

  useEffect(() => {
    console.log("🛠 [ReservationRequestScreen] ID:", professionalId);
  }, [professionalId]);

  const handlePreSend = () => {
    if (selectedServices.length === 0) return;

    // Pass reservation context to PaymentScreen via query params
    const serviceCategory = selectedServices.map((s) => s.label).join(", ");
    router.push({
      pathname: "/(client)/(tabs)/home/PaymentScreen",
      params: {
        subtotal: estimates.finalPrice.toString(),
        hoursLabel: estimates.hoursLabel,
        professionalId,
        professionalName,
        serviceCategory,
        serviceModality: isInstant ? "instant" : "quote",
      },
    });
  };

  const handleLocationPress = () => {
    Alert.alert(
      "Ubicación",
      "Para cambiar la dirección de este servicio, debes gestionarlo desde tus direcciones guardadas.",
      [{ text: "Cerrar", style: "cancel" }]
    );
  };

  const onToggleService = useCallback((item: ProfessionalTemplate) => {
    setSelectedServices((prev) =>
      prev.find((s) => s.id === item.id)
        ? prev.filter((s) => s.id !== item.id)
        : [...prev, item]
    );
  }, []);

  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText={isInstant ? "Nueva Reserva" : "Solicitud de Presupuesto"}
        showBackButton={true}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        style={styles.flex1}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          decelerationRate="fast"
          bounces={true}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
              {/* Header de Profesional */}
              <View style={styles.headerInfo}>
                <Text style={styles.proLabel}>Estás solicitando a:</Text>
                <Text style={styles.proName}>{professionalName}</Text>
                <View
                  style={[
                    styles.typeBadge,
                    {
                      backgroundColor: isInstant
                        ? COLORS.primary + "15"
                        : "#FFF3E0",
                    },
                  ]}>
                  <Ionicons
                    name={isInstant ? "flash" : "document-text"}
                    size={14}
                    color={isInstant ? COLORS.primary : "#F57C00"}
                  />
                  <Text
                    style={[
                      styles.typeBadgeText,
                      { color: isInstant ? COLORS.primary : "#F57C00" },
                    ]}>
                    {isInstant ? "Servicio Inmediato" : "Cotización previa"}
                  </Text>
                </View>
              </View>

              {/* SECCIÓN: QuickChips */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  ¿Qué necesitas realizar?
                </Text>
                {loadingServices ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <QuickChips
                    items={availableServices}
                    selectedIds={selectedServices.map((s) => s.id)}
                    onToggle={onToggleService}
                  />
                )}
              </View>

              {/* Notas */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notas para el Zolver</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Ej: El timbre no funciona..."
                  placeholderTextColor="#999"
                  multiline
                  value={description}
                  onChangeText={setDescription}
                  scrollEnabled={false}
                />
              </View>

              {/* Ubicación */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dirección del servicio</Text>
                <TouchableOpacity
                  style={styles.locationCard}
                  onPress={handleLocationPress}>
                  <View style={styles.locationIcon}>
                    <Ionicons
                      name="location"
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.locTitle}>
                      {activeAddress?.label || "Seleccionar dirección"}
                    </Text>
                    <Text style={styles.locSub}>
                      {activeAddress
                        ? formatAddress(activeAddress)
                        : "Configura tu ubicación"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </TouchableOpacity>
              </View>

              {/* Summary Box */}
              <CheckoutSummaryCard
                subtotal={estimates.finalPrice}
                hoursLabel={estimates.hoursLabel}
                buttonTitle={isInstant ? "Ir a Pagar" : "Enviar Solicitud"}
                onPress={handlePreSend}
                disabled={selectedServices.length === 0}
                disclaimer="No se realizará ningún cargo hasta que confirmes el método de pago."
              />

              <View style={{ height: 60 }} />
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  flex1: { flex: 1 },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  headerInfo: { marginBottom: 30, alignItems: "center" },
  proLabel: { fontSize: 13, color: "#999", marginBottom: 4 },
  proName: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    gap: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  section: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  textArea: {
    backgroundColor: "#F5F7F9",
    borderRadius: 12,
    padding: 15,
    minHeight: 120,
    fontSize: 15,
    color: "#333",
    textAlignVertical: "top",
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "10",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locTitle: { fontSize: 15, fontWeight: "700", color: "#333" },
  locSub: { fontSize: 13, color: "#999", marginTop: 2 },
});

export default ReservationRequestScreen;
