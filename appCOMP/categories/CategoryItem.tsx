import { COLORS } from "@/appASSETS/theme";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";

interface CategoryItemProps {
  name: string;
  icon: React.ReactNode; // Accepts Emojis, Ionicons, MaterialIcons, etc.
  onPress: () => void;

  // Optional overrides
  backgroundColor?: string;
  borderRadius?: number;
  shadow?: boolean;
  size?: number; // Controls width/height square
  nameColor?: string;
  nameSize?: number;
  containerStyle?: ViewStyle; // Full custom container override
  textStyle?: TextStyle; // Custom text style override
}

/**
 * CategoryItem
 * Universal category grid component.
 * - accepts ANY icon type (emoji, Ionicons, MaterialIcons, etc.)
 * - customizable size, colors, radius, shadow
 * - designed for grid usage with aspectRatio = 1
 */
const CategoryItem: React.FC<CategoryItemProps> = ({
  name,
  icon,
  onPress,

  backgroundColor = COLORS.backgroundInput,
  borderRadius = 20,
  shadow = true,
  size = 100,
  nameColor = "black",
  nameSize = 14,

  containerStyle,
  textStyle,
}) => {
  const dynamicStyle: ViewStyle = {
    backgroundColor,
    borderRadius,
    width: size,
    height: size,
    ...(shadow ? styles.shadow : {}),
  };

  return (
    <TouchableOpacity
      style={[styles.container, dynamicStyle, containerStyle]}
      onPress={onPress}
      activeOpacity={0.85}>
      {icon}

      <Text
        style={[
          styles.nameText,
          { color: nameColor, fontSize: nameSize },
          textStyle,
        ]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

export default CategoryItem;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
  },
  nameText: {
    color: COLORS.primary,
    marginTop: 17,
    fontWeight: "600",
    textAlign: "center",
  },

  // subtle modern shadow
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
});
