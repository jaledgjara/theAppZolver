import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "@/appASSETS/theme";
import { UISavedCard } from "@/appSRC/paymentMethod/Type/PaymentMethodType";

// 🟢 IMPORTANTE: Importar Swipeable
import { Swipeable } from "react-native-gesture-handler";

interface Props {
  card: UISavedCard;
  isSelected: boolean;
  onPress: () => void;
  onDelete: () => void; // 🟢 Nueva Prop
}

export const SavedCardRow = ({
  card,
  isSelected,
  onPress,
  onDelete,
}: Props) => {
  // 🟢 Lógica de Animación (Igual a tu LocationCard)
  const renderRightActions = (progress: any, dragX: any) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <TouchableOpacity
        onPress={onDelete}
        style={styles.deleteButtonContainer}
        activeOpacity={0.6}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={24} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
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
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedContainer: {
    borderColor: COLORS.primary,
    backgroundColor: "#FFFBF0",
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
  brand: { fontSize: 16, fontWeight: "bold", color: "#333" },
  number: { color: "#666", fontSize: 14, marginTop: 2 },
  typeLabel: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
    textTransform: "uppercase",
  },
  radio: { paddingLeft: 10 },

  // 🟢 Estilos del botón de borrar (Ajustados para coincidir con la altura de la tarjeta)
  deleteButtonContainer: {
    backgroundColor: COLORS.error || "#FF4444",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "90%", // Ocupa toda la altura disponible
    borderRadius: 12, // Mismo radio que el container
    marginLeft: 10,
    marginBottom: 10, // Para alinearse con el container que tiene margin
  },
  deleteText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 2,
  },
});
