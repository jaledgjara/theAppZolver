import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "@/appASSETS/theme";

interface MyLocationProps {
  isSelected: boolean;
  onPress: () => void;
}

const MyLocation: React.FC<MyLocationProps> = ({ isSelected, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.gpsContainer, isSelected && styles.gpsSelected]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.gpsIconBox}>
        <Ionicons name="navigate" size={24} color={COLORS.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.gpsTitle}>Usar ubicación actual</Text>
        <Text style={styles.gpsSubtitle}>Activar GPS</Text>
      </View>

      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );
};

export default MyLocation;

const styles = StyleSheet.create({
  gpsContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  gpsSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#FFFBF0",
  },
  gpsIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  gpsTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
  gpsSubtitle: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
  },
});
