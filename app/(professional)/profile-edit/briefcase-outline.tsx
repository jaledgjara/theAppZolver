// app/(professional)/(tabs)/profile/ProfessionalSettingsWorkScreen.tsx
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { COLORS, SIZES, FONTS } from "@/appASSETS/theme";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { ResizableInput } from "@/appCOMP/inputs/Screens/ResizableInput";
import { BaseCard } from "@/appCOMP/cards/BaseCard"; // Agregado para mejor estructura
import { ServiceSwitcherCatalog } from "@/appSRC/auth/Screen/ServiceSwitcherCatalog";

import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import { useProfessionalSettings } from "@/appSRC/users/Professional/Instant/Hooks/useProfessionalSettingsPricing";

const ProfessionalSettingsWorkScreen = () => {
  // El Hook ahora autogestiona la identidad de Jorge usando el AuthStore
  const {
    templates,
    customPrices,
    setCustomPrices,
    activeModes,
    handleToggleMode, // Usamos la función del hook
    handleSave,
    loading,
    isSaving,
  } = useProfessionalSettings();

  if (loading) {
    return <MiniLoaderScreen />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}>
      <ToolBarTitle
        titleText="Configuración de Trabajo"
        showBackButton={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* SECCIÓN 1: MODALIDAD */}
        <View style={styles.card}>
          <Text style={styles.label}>Modalidad de Servicio</Text>
          <Text style={styles.subLabel}>
            ¿Cómo quieres recibir solicitudes hoy?
          </Text>
          {/* Conectado al Hook centralizado */}
          <ServiceSwitcherCatalog
            modes={activeModes}
            onToggle={(mode) => handleToggleMode(mode)}
          />
        </View>

        {/* SECCIÓN 2: TARIFAS */}
        {activeModes.includes("instant") && (
          <View>
            <Text style={styles.label}>Tus Tarifas Zolver Ya</Text>
            <Text style={styles.subLabel}>
              Ajusta tus precios para competir mejor.
            </Text>
            {templates.map((item) => (
              <BaseCard key={item.id} style={styles.skuCard}>
                <View style={styles.skuHeader}>
                  <Text style={styles.skuLabel}>{item.label}</Text>
                  <Text style={styles.suggestedLabel}>
                    Sugerido: ${item.basePrice}
                  </Text>
                </View>
                <ResizableInput
                  value={customPrices[item.id] || ""}
                  onChangeText={(val) =>
                    setCustomPrices((prev: any) => ({
                      ...prev,
                      [item.id]: val,
                    }))
                  }
                  keyboardType="numeric"
                  icon={<Text style={styles.currency}>$</Text>}
                />
              </BaseCard>
            ))}
          </View>
        )}

        {/* SECCIÓN 3: FOOTER CONSOLIDADO */}
        <View style={styles.footerContainer}>
          <LargeButton
            title={isSaving ? "Guardando..." : "Actualizar Perfil"}
            onPress={handleSave}
            loading={isSaving}
            iconName="checkmark-circle-outline"
            backgroundColor={COLORS.primary}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfessionalSettingsWorkScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scrollContent: { padding: 20 },
  card: { marginBottom: 24 },
  label: { fontSize: SIZES.h3, fontWeight: "700", color: COLORS.textPrimary },
  subLabel: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  skuCard: { padding: 16, marginBottom: 12, backgroundColor: "#F9F9FB" },
  skuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  skuLabel: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary },
  suggestedLabel: { fontSize: 12, color: COLORS.primary, fontWeight: "500" },
  currency: { fontSize: 18, fontWeight: "bold", color: COLORS.textPrimary },

  // ESTILOS SOLICITADOS (FOOTER Y DISCLAIMER)
  footerContainer: {
    marginTop: 10, // Más cerca de la sección anterior
    alignItems: "center",
    marginBottom: 40,
  },
  disclaimerText: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.textSecondary, // Aplicado COLORS.tertiary
    marginTop: 8, // Pegado al botón
    fontWeight: "500",
  },
});
