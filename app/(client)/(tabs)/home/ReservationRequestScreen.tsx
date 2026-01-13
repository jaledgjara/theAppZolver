// appSRC/reservations/Screens/ReservationRequestScreen.tsx
import React, { useState } from "react";
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
import { LargeButton } from "@/appCOMP/button/LargeButton";

// Hooks & Estilos
import { COLORS, SIZES } from "@/appASSETS/theme";
import { useReservationPricing } from "@/appSRC/reservations/Hooks/useReservationPricing";
import { useServiceMetadata } from "@/appSRC/searchable/Hooks/useServiceMetadata";
import { useLocationStore } from "@/appSRC/location/Store/LocationStore";
import { ServiceTag } from "@/appSRC/categories/Service/ProfessionalCatalog";

const ReservationRequestScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const activeAddress = useLocationStore((state) => state.activeAddress);

  // Params
  const professionalName = (params.name as string) || "Profesional";
  const categoryIdParam = params.categoryId as string;
  const categoryName = (params.category as string) || "General";
  const mode = (params.mode as any) || "quote";
  const pricePerHourParam = params.price
    ? parseFloat(params.price as string)
    : 0;
  const isInstant = mode === "instant";

  // Lógica de Metadatos
  const { tags: availableTags, loading: loadingTags } = useServiceMetadata(
    categoryIdParam,
    categoryName
  );

  const [selectedTags, setSelectedTags] = useState<ServiceTag[]>([]);
  const [description, setDescription] = useState("");

  // Cálculos dinámicos de precio y tiempo
  const estimates = useReservationPricing(
    selectedTags,
    pricePerHourParam,
    isInstant
  );

  const handlePreSend = () => {
    router.push("/(client)/(tabs)/home/PaymentScreen");
  };

  // Alerta de Ubicación
  const handleLocationPress = () => {
    Alert.alert(
      "Ubicación",
      "Para cambiar la dirección de este servicio, debes gestionarlo desde tus direcciones guardadas.",
      [{ text: "Cerrar", style: "cancel" }]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <ToolBarTitle
          titleText={isInstant ? "Nueva Reserva" : "Solicitud de Presupuesto"}
          showBackButton={true}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
          style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            decelerationRate="normal">
            {/* 1. Header de Profesional Organico */}
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

            {/* 2. Tags de Selección con lógica de objeto completo */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>¿Qué necesitas realizar?</Text>
              {loadingTags ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <QuickChips
                  items={availableTags}
                  selectedIds={selectedTags.map((t) => t.id)}
                  onToggle={(tag: ServiceTag) => {
                    const exists = selectedTags.find((t) => t.id === tag.id);
                    if (exists) {
                      setSelectedTags(
                        selectedTags.filter((t) => t.id !== tag.id)
                      );
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                />
              )}
            </View>

            {/* 3. Notas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notas para el Zolver</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Ej: El timbre no funciona, traer herramientas especiales..."
                placeholderTextColor="#999"
                multiline
                value={description}
                onChangeText={setDescription}
                blurOnSubmit={true}
              />
            </View>

            {/* 4. Ubicación con Alerta */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dirección del servicio</Text>
              <TouchableOpacity
                style={styles.locationCard}
                onPress={handleLocationPress}>
                <View style={styles.locationIcon}>
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.locTitle}>
                    {activeAddress?.label || "Seleccionar dirección"}
                  </Text>
                  <Text style={styles.locSub}>
                    {activeAddress
                      ? `${activeAddress.address_street} ${activeAddress.address_number}`
                      : "Configura tu ubicación"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CCC" />
              </TouchableOpacity>
            </View>

            {/* 5. Summary Box Orgánico y Dinámico */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tiempo estimado</Text>
                <Text style={styles.summaryValue}>
                  {estimates.hoursLabel} hs
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.totalLabel}>Total Estimado</Text>
                  <Text style={styles.subtext}>
                    Sujeto a cambios del profesional
                  </Text>
                </View>
                <Text style={styles.totalValue}>
                  ${estimates.finalPrice.toLocaleString()}
                </Text>
              </View>

              <LargeButton
                title={isInstant ? "Ir a Pagar" : "Enviar Solicitud"}
                onPress={handlePreSend}
                disabled={selectedTags.length === 0}
              />

              <Text style={styles.disclaimer}>
                No se realizará ningún cargo hasta que confirmes el método de
                pago en el siguiente paso.
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    paddingBottom: 20,
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
    height: 100,
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
  summaryBox: {
    marginTop: 10,
    padding: 24,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  summaryLabel: { fontSize: 14, color: "#666" },
  summaryValue: { fontSize: 15, fontWeight: "600", color: "#333" },
  divider: { height: 1, backgroundColor: "#EEE", marginBottom: 20 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  totalLabel: { fontSize: 14, fontWeight: "700", color: "#333" },
  subtext: { fontSize: 11, color: "#999", marginTop: 2 },
  totalValue: {
    fontSize: SIZES.h2,
    fontWeight: "800",
    color: COLORS.primary,
  },
  disclaimer: {
    fontSize: 12,
    color: "#AAA",
    textAlign: "center",
    marginTop: 15,
    paddingHorizontal: 10,
  },
});

export default ReservationRequestScreen;
