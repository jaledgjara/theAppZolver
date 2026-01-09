import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { SavedCardRow } from "@/appSRC/payments/Screens/SavedCardRow";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { COLORS } from "@/appASSETS/theme";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";
import { usePaymentMethods } from "@/appSRC/paymentMethod/Hooks/usePaymentMethods";

const PaymentScreen = () => {
  const router = useRouter();

  // 1. INJECT DEPENDENCY (The Hook)
  const { cards, loading, error, isEmpty, deleteCard } = usePaymentMethods();

  const [selectedCardId, setSelectedCardId] = useState<string>("");

  // Auto-select the first card when data loads
  useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards]);

  const handleConfirmPayment = () => {
    if (!selectedCardId) return;
    console.log("Processing payment with card ID:", selectedCardId);
    // Logic to call Edge Function createPaidReservation...
  };

  const handleAddNewMethod = () => {
    router.push("/(client)/(tabs)/home/PaymentFormScreen");
  };

  // 2. LOADING STATE
  if (loading && cards.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: "#666" }}>
          Cargando bóveda segura...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Confirmar y Pagar" showBackButton={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* SECTION A: SAVED CARDS */}
        <Text style={styles.sectionTitle}>Mis métodos guardados</Text>

        {/* 3. ERROR STATE */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 4. DATA STATE OR EMPTY STATE */}
        {!isEmpty ? (
          cards.map((card) => (
            <SavedCardRow
              key={card.id}
              card={card}
              isSelected={selectedCardId === card.id}
              onPress={() => setSelectedCardId(card.id)}
            />
          ))
        ) : (
          <StatusPlaceholder
            icon={"credit-card"}
            title={"No tienes métodos guardados"}
            subtitle={"Agrega uno para pagar más rápido"}
          />
        )}

        {/* SECTION B: ADD NEW BUTTON */}
        <TouchableOpacity
          style={styles.addNewButton}
          onPress={handleAddNewMethod}>
          <Ionicons
            name="add-circle-outline"
            size={24}
            color={COLORS.primary}
          />
          <Text style={styles.addNewText}>Agregar nuevo método de pago</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Total a Pagar:</Text>
            <Text style={styles.priceValue}>$10.000</Text>
          </View>
        </View>

        <LargeButton
          title="Confirmar Pago"
          onPress={handleConfirmPayment}
          disabled={!selectedCardId}
        />
      </View>
    </View>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginTop: 10,
  },

  // States
  emptyContainer: { alignItems: "center", padding: 20 },
  emptyText: {
    color: "#999",
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
  },
  errorBox: {
    padding: 10,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: { color: "#D32F2F", fontSize: 14 },

  addNewButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#FFF",
    marginTop: 40,
    justifyContent: "space-between",
  },
  addNewText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: 10,
    flex: 1,
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
  priceContainer: { marginBottom: 15 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: { fontSize: 16, color: "#666" },
  priceValue: { fontSize: 24, fontWeight: "bold", color: COLORS.textPrimary },
});
