import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";

interface Props {
  label: string;
  icon: any;
  isSelected: boolean;
  onPress: () => void;
}

export const AddNewMethodRow = ({
  label,
  icon,
  isSelected,
  onPress,
}: Props) => {
  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onPress}>
      <View style={styles.iconCircle}>
        <Ionicons
          name={icon}
          size={20}
          color={isSelected ? COLORS.primary : "#666"}
        />
      </View>
      <Text style={[styles.label, isSelected && styles.selectedLabel]}>
        {label}
      </Text>

      {isSelected && (
        <Ionicons name="checkmark" size={20} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  selectedContainer: {
    backgroundColor: "#F9F9FF",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  label: { fontSize: 15, color: "#444", flex: 1 },
  selectedLabel: { color: COLORS.primary, fontWeight: "600" },
});
