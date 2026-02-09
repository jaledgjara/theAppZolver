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
import { CheckoutSummaryCard } from "@/appCOMP/cards/CheckoutSummaryCard";
import { COLORS } from "@/appASSETS/theme";
import StatusPlaceholder from "@/appCOMP/contentStates/StatusPlaceholder";
import { usePaymentMethods } from "@/appSRC/paymentMethod/Hooks/usePaymentMethods";
import { PaymentMethodListViewProps } from "@/appSRC/paymentMethod/Type/PaymentMethodScreenType";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";

export const PaymentMethodListScreen = ({
  mode,
  onConfirmSelection,
  subtotal = 0,
  hoursLabel,
  infoLabel,
  infoSuffix,
  paymentLoading = false,
  formScreenPath,
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
    if (formScreenPath) {
      router.push(formScreenPath as any);
    } else {
      isCheckout
        ? router.push("/(client)/(tabs)/home/HomePaymentFormScreen")
        : router.push("/(client)/(tabs)/profile/ProfilePaymentFormScreen");
    }
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
        {/* 1. CARD LIST */}
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

        {/* 2. ADD NEW CARD */}
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

        {/* 3. CHECKOUT SUMMARY (reusable component) */}
        {isCheckout && !isEmpty && (
          <CheckoutSummaryCard
            subtotal={subtotal}
            hoursLabel={hoursLabel}
            infoLabel={infoLabel}
            infoSuffix={infoSuffix}
            buttonTitle="Pagar ahora"
            onPress={() => onConfirmSelection?.(selectedCardId)}
            disabled={!selectedCardId}
            loading={paymentLoading}
          />
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
    paddingBottom: 40,
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
});

export default PaymentMethodListScreen;
