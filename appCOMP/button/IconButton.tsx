// src/components/IconButton.tsx

import React, { useRef } from "react";
import {
  Pressable,
  StyleSheet,
  Animated,
  ViewStyle,
  StyleProp,
} from "react-native";

interface IconButtonProps {
  icon: React.ReactNode;         // Icono a renderizar
  size?: number;                 // Tamaño del botón (diámetro)
  iconSize?: number;             // Tamaño del icono si lo necesitas externamente
  backgroundColor?: string;      // Color del fondo
  iconColor?: string;            // Color del icono (usado solo si el icono lo soporta)
  onPress?: () => void;          // Callback al tocar
  disabled?: boolean;            // Deshabilitar el botón
  style?: StyleProp<ViewStyle>;  // Estilos extra
}

/**
 * Universal Icon Button – reusable, animated and customizable
 * 
 * This component provides:
 * - Animated press feedback (scale)
 * - Full circular shape
 * - Support for any icon component
 * - Configurable size and colors
 * - Disabled state handling
 */
const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 48,
  backgroundColor = "#000",
  onPress,
  disabled = false,
  style,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={animateIn}
      onPressOut={animateOut}
      style={({ pressed }) => [
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: disabled
            ? "rgba(0,0,0,0.2)"
            : pressed
            ? backgroundColor + "CC"
            : backgroundColor,
        },
        style,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {icon}
      </Animated.View>
    </Pressable>
  );
};

export default IconButton;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});
