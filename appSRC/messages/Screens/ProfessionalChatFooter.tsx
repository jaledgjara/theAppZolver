import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "@/appASSETS/theme";
import { LargeButton } from "@/appCOMP/button/LargeButton";
import { QUICK_CHIPS_LIST_PROFESSIONAL } from "@/appSRC/messages/Type/QuickMessageType";

const MIN_DAYS = 1;
const MAX_DAYS = 30;
const COOLDOWN_MS = 1500;

interface ProfessionalChatFooterProps {
  onSendBudget: () => void;
  onSendQuickMessage: (text: string) => void;
}

export const ProfessionalChatFooter: React.FC<ProfessionalChatFooterProps> = ({
  onSendBudget,
  onSendQuickMessage,
}) => {
  const [stepperOpen, setStepperOpen] = useState(false);
  const [days, setDays] = useState(3);
  const [disabled, setDisabled] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendWithCooldown = (text: string) => {
    if (disabled) return;
    setDisabled(true);
    onSendQuickMessage(text);
    cooldownRef.current = setTimeout(() => setDisabled(false), COOLDOWN_MS);
  };

  const handleChipPress = (chip: (typeof QUICK_CHIPS_LIST_PROFESSIONAL)[number]) => {
    if (chip.type === "stepper") {
      setStepperOpen((prev) => !prev);
      return;
    }
    sendWithCooldown(chip.label);
  };

  const handleStepperConfirm = () => {
    sendWithCooldown(`Lo tendría listo para: ${days} ${days === 1 ? "día" : "días"}`);
    setStepperOpen(false);
    setDays(3);
  };

  const incrementDays = () => setDays((d) => Math.min(d + 1, MAX_DAYS));
  const decrementDays = () => setDays((d) => Math.max(d - 1, MIN_DAYS));

  return (
    <View style={styles.container}>
      {stepperOpen && (
        <View style={styles.stepperPanel}>
          <Text style={styles.stepperLabel}>Lo tendría listo para:</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[styles.stepperButton, days <= MIN_DAYS && styles.stepperButtonDisabled]}
              onPress={decrementDays}
              disabled={days <= MIN_DAYS}
            >
              <Ionicons
                name="remove"
                size={20}
                color={days <= MIN_DAYS ? "#D1D5DB" : COLORS.textPrimary}
              />
            </TouchableOpacity>

            <Text style={styles.stepperValue}>
              {days} {days === 1 ? "día" : "días"}
            </Text>

            <TouchableOpacity
              style={[styles.stepperButton, days >= MAX_DAYS && styles.stepperButtonDisabled]}
              onPress={incrementDays}
              disabled={days >= MAX_DAYS}
            >
              <Ionicons
                name="add"
                size={20}
                color={days >= MAX_DAYS ? "#D1D5DB" : COLORS.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.stepperConfirm, disabled && styles.chipDisabled]}
            onPress={handleStepperConfirm}
            disabled={disabled}
          >
            <Text style={styles.stepperConfirmText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.chipsRow}>
        {QUICK_CHIPS_LIST_PROFESSIONAL.map((chip) => (
          <TouchableOpacity
            key={chip.label}
            style={[
              styles.chip,
              chip.type === "stepper" && stepperOpen && styles.chipActive,
              disabled && chip.type === "instant" && styles.chipDisabled,
            ]}
            onPress={() => handleChipPress(chip)}
            disabled={disabled && chip.type === "instant"}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                chip.type === "stepper" && stepperOpen && styles.chipTextActive,
              ]}
            >
              {chip.label}
            </Text>
            {chip.type === "stepper" && (
              <Ionicons
                name={stepperOpen ? "chevron-down" : "chevron-forward"}
                size={14}
                color={stepperOpen ? COLORS.white : COLORS.tertiary}
                style={styles.chipIcon}
              />
            )}
          </TouchableOpacity>
        ))}
        <LargeButton
          title="Enviar Presupuesto"
          onPress={onSendBudget}
          iconName="document-text-outline"
          iconColor="white"
          textColor="white"
          disabled={disabled}
          style={styles.budgetButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDFA",
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: COLORS.tertiary,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Roboto-Bold",
    fontWeight: "600",
    color: COLORS.tertiary,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  chipIcon: {
    marginLeft: 4,
  },
  budgetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  budgetButtonText: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
  },
  stepperPanel: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stepperLabel: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
    marginBottom: 12,
    textAlign: "center",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 12,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: {
    borderColor: "#F3F4F6",
    backgroundColor: "#F9FAFB",
  },
  stepperValue: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    minWidth: 80,
    textAlign: "center",
  },
  stepperConfirm: {
    backgroundColor: COLORS.tertiary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  stepperConfirmText: {
    ...FONTS.h4,
    color: COLORS.white,
  },
});
