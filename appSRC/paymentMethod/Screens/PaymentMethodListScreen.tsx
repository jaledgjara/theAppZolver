// appSRC/paymentMethod/Screens/PaymentMethodListScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { SavedCardRow } from "@/appSRC/payments/Screens/SavedCardRow";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { COLORS } from "@/appASSETS/theme";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";
import { usePaymentMethods } from "@/appSRC/paymentMethod/Hooks/usePaymentMethods";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";

export const PaymentMethodListScreen = ({
  mode,
  onConfirmSelection,
  price,
}: PaymentMethodListViewProps) => {
  const router = useRouter();
  const { cards, loading, isEmpty, deleteCard } = usePaymentMethods();
  const [selectedCardId, setSelectedCardId] = useState<string>("");

  useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards]);

  const isCheckout = mode === "checkout";

  const handleNavigation = () => {
    isCheckout
      ? router.push("/(client)/(tabs)/home/HomePaymentFormScreen")
      : router.push("/(client)/(tabs)/profile/ProfilePaymentFormScreen");
  };

  if (loading && cards.length === 0) {
    return <MiniLoaderScreen />;
  }

  return (
    <View style={styles.container}>
      <ToolBarTitle
        titleText={isCheckout ? "Confirmar Pago" : "Métodos guardados"}
        showBackButton={true}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 1. LISTA DE TARJETAS */}
        <View style={styles.listWrapper}>
          {!isEmpty ? (
            cards.map((card) => (
              <SavedCardRow
                key={card.id}
                card={card}
                isSelected={isCheckout && selectedCardId === card.id}
                onPress={() => isCheckout && setSelectedCardId(card.id)}
                onDelete={() => deleteCard(card.id)}
              />
            ))
          ) : (
            <StatusPlaceholder
              icon="credit-card"
              title="No tienes tarjetas"
              subtitle="Agrega una para realizar tu reserva"
            />
          )}
        </View>

        {/* 2. BOTÓN AGREGAR (SIEMPRE ORGÁNICO) */}
        <TouchableOpacity
          style={styles.addNewInline}
          onPress={handleNavigation}>
          <Ionicons
            name="add-circle-outline"
            size={22}
            color={COLORS.primary}
          />
          <Text style={styles.addNewText}>Usar otra tarjeta</Text>
        </TouchableOpacity>

        {/* 3. RESUMEN Y ACCIÓN DE PAGO (INTEGRADO AL SCROLL) */}
        {isCheckout && !isEmpty && (
          <View style={styles.summaryContainer}>
            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.totalLabel}>Total a pagar</Text>
                <Text style={styles.taxNote}>
                  Incluye impuestos de plataforma
                </Text>
              </View>
              <Text style={styles.totalValue}>{price || "$0"}</Text>
            </View>

            <LargeButton
              title="Pagar ahora"
              onPress={() => onConfirmSelection?.(selectedCardId)}
              disabled={!selectedCardId}
            />

            <View style={styles.secureBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#888" />
              <Text style={styles.secureText}>Pago encriptado y seguro</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40, // Espacio extra al final para que respire
  },
  listWrapper: {
    marginBottom: 10,
  },
  addNewInline: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  addNewText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Nueva sección de resumen integrada
  summaryContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 25,
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  taxNote: {
    fontSize: 11,
    color: "#AAA",
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    gap: 5,
  },
  secureText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});

export default PaymentMethodListScreen;
