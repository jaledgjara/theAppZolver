// appSRC/paymentMethod/Screens/PaymentMethodListScreen.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { SavedCardRow } from "@/appSRC/payments/Screens/SavedCardRow";
import { CheckoutSummaryCard } from "@/appCOMP/cards/CheckoutSummaryCard";
import { COLORS, SIZES, FONTS } from "@/appASSETS/theme";
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
  feeRate,
  formScreenPath,
}: PaymentMethodListViewProps) => {
  const router = useRouter();
  const { cards, loading, isEmpty, deleteCard } = usePaymentMethods();
  const [selectedCardId, setSelectedCardId] = useState<string>("");

  // CVV Modal state
  const [cvvModalVisible, setCvvModalVisible] = useState(false);
  const [cvv, setCvv] = useState("");
  const [cvvError, setCvvError] = useState<string | null>(null);
  const cvvInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards]);

  const isCheckout = mode === "checkout";

  const selectedCard = cards.find((c) => c.id === selectedCardId);

  const handleNavigation = () => {
    if (formScreenPath) {
      router.push(formScreenPath as Href);
    } else {
      isCheckout
        ? router.push("/(client)/(tabs)/home/HomePaymentFormScreen")
        : router.push("/(client)/(tabs)/profile/ProfilePaymentFormScreen");
    }
  };

  // "Pagar ahora" tapped → open CVV modal instead of paying directly
  const handlePayPress = () => {
    setCvv("");
    setCvvError(null);
    setCvvModalVisible(true);
    setTimeout(() => cvvInputRef.current?.focus(), 300);
  };

  // CVV confirmed → validate and proceed to payment
  const handleCvvConfirm = () => {
    const trimmed = cvv.trim();
    if (trimmed.length < 3 || trimmed.length > 4) {
      setCvvError("Ingresá los 3 o 4 dígitos de seguridad.");
      return;
    }
    if (!/^\d+$/.test(trimmed)) {
      setCvvError("Solo números.");
      return;
    }
    setCvvModalVisible(false);
    setCvvError(null);
    onConfirmSelection?.(selectedCardId, trimmed);
  };

  const handleCvvCancel = () => {
    setCvvModalVisible(false);
    setCvv("");
    setCvvError(null);
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
            feeRate={feeRate}
            hoursLabel={hoursLabel}
            infoLabel={infoLabel}
            infoSuffix={infoSuffix}
            buttonTitle="Pagar ahora"
            onPress={handlePayPress}
            disabled={!selectedCardId}
            loading={paymentLoading}
          />
        )}
      </ScrollView>

      {/* ─── CVV INPUT MODAL ─── */}
      <Modal
        visible={cvvModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCvvCancel}>
        <Pressable style={styles.modalOverlay} onPress={handleCvvCancel}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Ionicons name="lock-closed" size={24} color={COLORS.tertiary} />
                <Text style={styles.modalTitle}>Código de seguridad</Text>
              </View>

              {/* Card info */}
              {selectedCard && (
                <View style={styles.modalCardInfo}>
                  <Ionicons name="card" size={20} color={COLORS.textSecondary} />
                  <Text style={styles.modalCardText}>
                    {selectedCard.brand.toUpperCase()} •••• {selectedCard.last4}
                  </Text>
                </View>
              )}

              {/* CVV Input */}
              <Text style={styles.modalLabel}>
                Ingresá el CVV que figura en el dorso de tu tarjeta
              </Text>
              <TextInput
                ref={cvvInputRef}
                style={[styles.cvvInput, cvvError ? styles.cvvInputError : null]}
                value={cvv}
                onChangeText={(text) => {
                  setCvv(text.replace(/\D/g, "").slice(0, 4));
                  if (cvvError) setCvvError(null);
                }}
                placeholder="CVV"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                autoFocus
              />
              {cvvError && <Text style={styles.cvvErrorText}>{cvvError}</Text>}

              {/* Actions */}
              <TouchableOpacity
                style={[
                  styles.modalConfirmButton,
                  cvv.length < 3 && styles.modalConfirmButtonDisabled,
                ]}
                onPress={handleCvvConfirm}
                disabled={cvv.length < 3}
                activeOpacity={0.7}>
                <Text style={styles.modalConfirmText}>Confirmar pago</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleCvvCancel}
                activeOpacity={0.7}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
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

  // ─── CVV MODAL ───
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SIZES.padding,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius * 2,
    paddingVertical: 28,
    paddingHorizontal: SIZES.padding,
    width: "100%",
    maxWidth: 360,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  modalTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  modalCardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.backgroundLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: SIZES.radius,
    marginBottom: 16,
  },
  modalCardText: {
    ...FONTS.body3,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  modalLabel: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  cvvInput: {
    backgroundColor: COLORS.backgroundInput,
    borderRadius: SIZES.radius,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 8,
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  cvvInputError: {
    borderColor: COLORS.error,
  },
  cvvErrorText: {
    ...FONTS.body4,
    color: COLORS.error,
    marginTop: 6,
  },
  modalConfirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  modalConfirmButtonDisabled: {
    opacity: 0.4,
  },
  modalConfirmText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
  modalCancelButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  modalCancelText: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
  },
});

export default PaymentMethodListScreen;
