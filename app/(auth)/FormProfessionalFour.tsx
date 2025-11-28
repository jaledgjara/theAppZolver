import { COLORS, FONTS } from "@/appASSETS/theme";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { useProfessionalForm } from "@/appSRC/auth/Hooks/useProfessionalForm";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";

const FormProfessionalFour = () => {
  // Consumimos el Hook Unificado
  const { cbuAlias, updateField, submitProfile, isSubmitting } =
    useProfessionalForm();

  const handleLinkCBU = () => {
    // Lógica visual si quieres mostrar un input o modal extra
    Alert.alert("Info", "Ingresa tu Alias o CBU abajo");
  };

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Método de ganancia" showBackButton={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentContainer}>
          <View style={styles.topSection}>
            <Text style={styles.sectionTitle}>
              ¿Dónde quieres recibir tu dinero?
            </Text>
            <Text style={styles.sectionSubtitle}>
              Ingresa tu CBU o Alias para recibir los pagos.
            </Text>
          </View>

          {/* INPUT CBU */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>CBU / CVU / Alias</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: mi.alias.mp"
              value={cbuAlias}
              onChangeText={(t) => updateField("cbuAlias", t)}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.buttonsWrapper}>
            <LargeButton
              title={isSubmitting ? "FINALIZANDO..." : "FINALIZAR REGISTRO"}
              iconName="checkmark-done-circle-outline"
              style={{ backgroundColor: COLORS.primary }}
              onPress={submitProfile} // 🔥 EL GATILLO FINAL
              loading={isSubmitting}
              disabled={isSubmitting || cbuAlias.length < 6}
            />

            <Text style={styles.helperText}>
              Al finalizar, se guardará tu perfil y podrás comenzar a ofrecer
              servicios.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default FormProfessionalFour;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1 },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 30,
    justifyContent: "space-between",
    paddingBottom: 40,
  },
  topSection: { alignItems: "center", marginBottom: 30 },
  sectionTitle: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  sectionSubtitle: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  inputContainer: { width: "100%", marginBottom: 20 },
  label: { ...FONTS.h3, marginBottom: 8, color: COLORS.textPrimary },
  input: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  buttonsWrapper: { width: "100%" },
  helperText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginTop: 15,
  },
});
