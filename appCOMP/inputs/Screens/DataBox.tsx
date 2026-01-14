import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "@/appASSETS/theme";

interface DataBoxProps {
  label: string;
  value: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  helperText?: string;
  onPress?: () => void;
}

export const DataBox = ({
  label,
  value,
  iconName = "lock-closed",
  iconColor = "#999",
  helperText,
  onPress,
}: DataBoxProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.lockedInput}>
        <Text style={styles.lockedText}>{value || "No disponible"}</Text>
        <Ionicons name={iconName} size={18} color={iconColor} />
      </View>
      {helperText && <Text style={styles.helperText}>{helperText}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  inputGroup: { marginBottom: 20, opacity: 0.9 },
  label: {
    fontSize: SIZES.h4,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  lockedInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  lockedText: { fontSize: 16, color: "#666" },
  helperText: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    marginTop: 5,
    marginLeft: 5,
  },
});
