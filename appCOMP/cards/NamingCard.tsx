import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, FONTS } from "@/appASSETS/theme";

interface NamingCardProps {
  label: string; // The "Apartado" (e.g., "Nombre", "Email")
  value: string | null; // The "Answer" (e.g., "Juan Perez")
  onPress?: () => void; // Function to trigger when pressed (makes it editable)
  editable?: boolean; // Explicit flag to show the chevron (optional)
}

const NamingCard: React.FC<NamingCardProps> = ({
  label,
  value,
  onPress,
  editable = false, // Default to false if not provided
}) => {
  // Determine if the card should look active/editable
  const isInteractive = !!onPress || editable;

  const ContainerComponent = isInteractive ? TouchableOpacity : View;

  return (
    <ContainerComponent
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!isInteractive}>
      <View style={styles.textContainer}>
        {/* Apartado */}
        <Text style={styles.label}>{label}</Text>

        {/* Answer */}
        <Text style={[styles.value, !isInteractive && styles.readOnlyValue]}>
          {value || "No especificado"}
        </Text>
      </View>

      {/* Optional (>) Emoji/Icon */}
      {isInteractive && (
        <View style={styles.iconContainer}>
          <Ionicons
            name="chevron-forward"
            size={24}
            color={COLORS.textSecondary}
          />
        </View>
      )}
    </ContainerComponent>
  );
};

export default NamingCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || "#E0E0E0",
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  label: {
    fontSize: SIZES.h4,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: "600",
  },
  value: {
    fontSize: SIZES.h3,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  readOnlyValue: {
    color: COLORS.textSecondary,
  },
  iconContainer: {
    marginLeft: 8,
  },
});
