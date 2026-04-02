import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { COLORS, FONTS, RADIUS } from "@/appASSETS/theme";

interface RatingBadgeProps {
  rating: number;
  /** Si true muestra el badge con fondo accent-light. Si false, muestra inline. */
  filled?: boolean;
}

export const RatingBadge: React.FC<RatingBadgeProps> = ({ rating, filled = true }) => {
  return (
    <View style={[styles.container, filled && styles.filledBg]}>
      <FontAwesome name="star" size={12} color={COLORS.accent} />
      <Text style={styles.score}>{rating > 0 ? rating.toFixed(1) : "Nuevo"}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  filledBg: {
    backgroundColor: COLORS.accentLight,
  },
  score: {
    ...FONTS.caption,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.textPrimary,
  },
});
