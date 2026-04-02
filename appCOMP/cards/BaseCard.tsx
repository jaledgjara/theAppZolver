import React from "react";
import { TouchableOpacity, View, StyleSheet, ViewStyle } from "react-native";
import { COLORS, RADIUS, SHADOWS, SIZES } from "@/appASSETS/theme";

interface BaseCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  children,
  onPress,
  style,
  disabled = false,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    // @ts-ignore: TouchableOpacity / View types
    <Container
      style={[styles.card, style]}
      onPress={!disabled ? onPress : undefined}
      activeOpacity={0.75}
      disabled={disabled || !onPress}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SIZES.lg,
    marginVertical: SIZES.xs + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
});
