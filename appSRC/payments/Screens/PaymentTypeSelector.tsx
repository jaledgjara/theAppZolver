import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "@/appASSETS/theme"; // Asegúrate de que esta ruta sea correcta
import {
  PaymentMethodType,
  PaymentMethodUI,
} from "@/appSRC/paymentMethod/Type/PaymentMethodType";

export const PAYMENT_METHODS_CONFIG: PaymentMethodUI[] = [
  {
    id: "credit_card",
    label: "Crédito",
    icon: "card",
    description: "Paga en cuotas",
  },
  {
    id: "debit_card",
    label: "Débito",
    icon: "card-outline",
    description: "Pago al instante",
  },
  {
    id: "platform_credit",
    label: "Zolver Wallet",
    icon: "wallet",
    description: "Saldo a favor",
  },
];

interface Props {
  selectedMethod: PaymentMethodType;
  onSelect: (method: PaymentMethodType) => void;
}

export const PaymentTypeSelector = ({ selectedMethod, onSelect }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Selecciona método de pago</Text>

      <View style={styles.typesContainer}>
        {PAYMENT_METHODS_CONFIG.map((item) => {
          const isSelected = selectedMethod === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.typeButton,
                isSelected && styles.typeButtonSelected,
              ]}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.7}>
              <Ionicons
                name={item.icon}
                size={28}
                color={isSelected ? COLORS.primary : "#666"}
              />

              <Text
                style={[
                  styles.typeText,
                  isSelected && styles.typeTextSelected,
                ]}>
                {item.label}
              </Text>

              {/* Agregamos descripción pequeña para diferenciar */}
              <Text
                style={[
                  styles.descText,
                  isSelected && styles.descTextSelected,
                ]}>
                {item.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    ...FONTS.h3, // Asegúrate de tener FONTS definido en tu theme, sino usa fontSize: 16
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 15,
  },
  typesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10, // Si gap no funciona en versiones viejas de RN, usa marginHorizontal en typeButton
  },
  typeButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    // Sombra sutil
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#FFFBF0", // Un tono muy suave del primario si es posible, o blanco
    elevation: 3,
  },
  typeText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    textAlign: "center",
  },
  typeTextSelected: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  descText: {
    marginTop: 4,
    fontSize: 10,
    color: "#999",
    textAlign: "center",
  },
  descTextSelected: {
    color: COLORS.primary, // O un tono más oscuro del primario
    opacity: 0.8,
  },
});
