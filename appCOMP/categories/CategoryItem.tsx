import { COLORS, FONTS, RADIUS, SHADOWS, SIZES } from "@/appASSETS/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle, TextStyle } from "react-native";

// Alterna entre fondo verde-claro y amarillo-claro para variedad visual
const ICON_BG_COLORS = ["#E8F4F1", "#FFF8E0"];

interface CategoryItemProps {
  name: string;
  icon: React.ReactNode;
  onPress: () => void;
  index?: number; // usado para alternar fondo del icon-wrap
  size?: number;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  name,
  icon,
  onPress,
  index = 0,
  size = 100,
  containerStyle,
  textStyle,
}) => {
  const iconBg = ICON_BG_COLORS[index % ICON_BG_COLORS.length];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { width: size, minHeight: size }, containerStyle]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={[styles.label, textStyle]} numberOfLines={2}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

export default CategoryItem;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: SIZES.sm,
    margin: SIZES.sm,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SIZES.sm,
  },
  label: {
    ...FONTS.caption,
    fontFamily: "PlusJakartaSans_600SemiBold",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
});
