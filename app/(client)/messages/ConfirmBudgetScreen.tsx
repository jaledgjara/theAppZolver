import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { COLORS } from "@/appASSETS/theme";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useConfirmBudget } from "@/appSRC/reservations/Hooks/useConfirmBudget";

const ConfirmBudgetScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);

  const {
    professionalId,
    budgetPrice,
    budgetTitle,
    messageId,
    budgetNotes,
    conversationId,
  } = params;

  // Usamos el hook, pero sobreescribiremos la navegación de éxito
  const { confirmBudget, loading } = useConfirmBudget();

  const handleConfirm = async () => {
    if (!user) return;

    const budgetPayload = {
      serviceName: budgetTitle as string,
      price: parseFloat(budgetPrice as string),
      notes: budgetNotes as string,
      proposedDate: new Date().toISOString(),
    };

    // Llamamos al hook
    await confirmBudget(
      user.uid,
      professionalId as string,
      budgetPayload,
      messageId as string
    );
  };

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
        <Text style={styles.disclaimer}>
          Al confirmar, aceptas las condiciones y compartirás tu ubicación.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <LargeButton
          title={loading ? "CONFIRMANDO..." : "CONFIRMAR Y CONTRATAR"}
          onPress={handleConfirm}
          disabled={loading}
        />
      </View>
    </View>
  );
};

export default ConfirmBudgetScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F8" },
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
