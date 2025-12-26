import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

// UI Components
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { COLORS } from "@/appASSETS/theme";

// Logic
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useConfirmBudget } from "@/appSRC/reservations/Hooks/useConfirmBudget";
import { useBudgetValidation } from "@/appSRC/reservations/Hooks/useBudgetValidation"; // ✅ Importamos el nuevo hook

const ConfirmBudgetScreen = () => {
  const params = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);

  const { professionalId, budgetPrice, budgetTitle, messageId, budgetNotes } =
    params;

  // 1. Hook de Validación de Integridad (Gatekeeper)
  const { isValid, validating } = useBudgetValidation(messageId as string);

  // 2. Hook de Acción de Confirmación
  const { confirmBudget, loading: confirming } = useConfirmBudget();

  const handleConfirm = async () => {
    if (!user || !isValid) return;

    const budgetPayload = {
      serviceName: budgetTitle as string,
      price: parseFloat(budgetPrice as string),
      notes: budgetNotes as string,
      proposedDate: new Date().toISOString(),
    };

    await confirmBudget(
      user.uid,
      professionalId as string,
      budgetPayload,
      messageId as string
    );
  };

  // --- Renderizado Condicional ---

  if (validating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Verificando disponibilidad...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Confirmar Contratación" showBackButton />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.ticket}>
          <Text style={styles.header}>RESUMEN DEL SERVICIO</Text>
          <Text style={styles.label}>SERVICIO</Text>
          <Text style={styles.value}>{budgetTitle}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>PRECIO FINAL</Text>
          <Text style={styles.price}>
            ${parseFloat(budgetPrice as string).toLocaleString("es-AR")}
          </Text>

          {budgetNotes ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.label}>NOTAS</Text>
              <Text style={styles.notes}>"{budgetNotes}"</Text>
            </>
          ) : null}
        </View>

        {isValid && (
          <Text style={styles.disclaimer}>
            Al confirmar, aceptas las condiciones y compartirás tu ubicación.
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <LargeButton
          title={confirming ? "CONFIRMANDO..." : "CONFIRMAR Y CONTRATAR"}
          onPress={handleConfirm}
          // El botón se deshabilita si estamos cargando O si la validación falló
          disabled={confirming || !isValid}
        />
      </View>
    </View>
  );
};

export default ConfirmBudgetScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F8" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#6B7280" },
  content: { padding: 20 },
  ticket: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 20,
  },
  header: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 1,
  },
  label: { fontSize: 12, color: "#9CA3AF", fontWeight: "700", marginBottom: 4 },
  value: { fontSize: 18, fontWeight: "600", color: "#1F2937", marginBottom: 8 },
  price: { fontSize: 36, fontWeight: "bold", color: "#1F2937" },
  notes: { fontSize: 14, color: "#6B7280", fontStyle: "italic" },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 16 },
  disclaimer: { textAlign: "center", color: "#6B7280", fontSize: 12 },
  footer: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#EEE",
  },
});
