import React from "react";
import { TouchableOpacity, View, StyleSheet, ViewStyle } from "react-native";
import { COLORS } from "@/appASSETS/theme";

interface BaseCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle; // Para sobreescribir márgenes si es necesario
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
    // @ts-ignore: TouchableOpacity types vs View types compatibility
    <Container
      style={[styles.card, style]}
      onPress={!disabled ? onPress : undefined}
      activeOpacity={0.7}
      disabled={disabled || !onPress}>
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12, // Radio consistente en toda la app
    padding: 12, // Padding interno estándar
    marginVertical: 6,
    marginHorizontal: 16, // Márgenes laterales estándar

    // Sombra "Nativa" Robusta
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // Sutil pero visible
    shadowRadius: 6,
    elevation: 3, // Android

    // Borde sutil para definición extra
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
});
