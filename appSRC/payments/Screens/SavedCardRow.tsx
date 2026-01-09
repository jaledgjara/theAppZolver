import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "@/appASSETS/theme";
import { UISavedCard } from "@/appSRC/paymentMethod/Type/PaymentMethodType";

interface Props {
  card: UISavedCard;
  isSelected: boolean;
  onPress: () => void;
}

export const SavedCardRow = ({ card, isSelected, onPress }: Props) => {
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Icono de la Marca */}
      <View style={styles.iconBox}>
        <Ionicons name="card" size={24} color="#555" />
      </View>

      {/* Info Central */}
      <View style={styles.info}>
        <Text style={styles.brand}>{card.brand.toUpperCase()}</Text>
        <Text style={styles.number}>•••• {card.last4}</Text>
        <Text style={styles.typeLabel}>
          {card.type === "credit_card" ? "Crédito" : "Débito"}
        </Text>
      </View>

      {/* Radio Button Visual */}
      <View style={styles.radio}>
        {isSelected ? (
          <Ionicons name="radio-button-on" size={24} color={COLORS.primary} />
        ) : (
          <Ionicons name="radio-button-off" size={24} color="#CCC" />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedContainer: {
    borderColor: COLORS.primary,
    backgroundColor: "#FFFBF0", // Color sutil de fondo seleccionado
  },
  iconBox: {
    width: 44,
    height: 34,
    backgroundColor: "#FFF",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  info: { flex: 1 },
  brand: { ...FONTS.h4, fontWeight: "bold", color: "#333" }, // Asumiendo que tienes FONTS.h4
  number: { color: "#666", fontSize: 14, marginTop: 2 },
  typeLabel: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
    textTransform: "uppercase",
  },
  radio: { paddingLeft: 10 },
});
