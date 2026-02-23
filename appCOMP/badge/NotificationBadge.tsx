import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/appASSETS/theme";

interface NotificationBadgeProps {
  count: number;
  size?: "small" | "medium";
}

const SIZES_MAP = {
  small: { minWidth: 18, height: 18, borderRadius: 9, fontSize: 11 },
  medium: { minWidth: 22, height: 22, borderRadius: 11, fontSize: 12 },
};

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  size = "medium",
}) => {
  if (count <= 0) return null;

  const dim = SIZES_MAP[size];
  const label = count > 99 ? "99+" : String(count);

  return (
    <View
      style={[
        styles.container,
        {
          minWidth: dim.minWidth,
          height: dim.height,
          borderRadius: dim.borderRadius,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: dim.fontSize, lineHeight: dim.height },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.tertiary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  text: {
    color: COLORS.white,
    fontWeight: "700",
    textAlign: "center",
  },
});
