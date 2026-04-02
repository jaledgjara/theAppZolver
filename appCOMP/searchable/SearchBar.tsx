import React, { useRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, RADIUS, SHADOWS, SIZES } from "@/appASSETS/theme";

interface SearchBarProps {
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  /** Si se proporciona, la barra completa es presionable (modo navegación) */
  onPress?: () => void;
}

/**
 * SearchBar
 * - Modo navegación: barra presionable (ej. home screen de Airbnb)
 * - Modo edición: TextInput normal con focus animado
 * - Fondo blanco sobre bg-primary de pantalla para máximo contraste
 */
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "¿Qué servicio necesitás hoy?",
  onPress,
}) => {
  const borderAnim = useRef(new Animated.Value(0)).current;
  const isNavigational = !!onPress;

  const handleFocus = () => {
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.brandMid],
  });

  if (isNavigational) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.navigationalContainer}>
        <Ionicons name="search" size={20} color={COLORS.textTertiary} style={styles.icon} />
        <Text style={styles.placeholder}>{placeholder}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={[styles.editableContainer, { borderColor }]}>
      <Ionicons name="search" size={20} color={COLORS.textTertiary} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </Animated.View>
  );
};

export default SearchBar;

const baseContainer: ViewStyle = {
  height: 52,
  backgroundColor: COLORS.bgCard,
  borderRadius: RADIUS.md,
  paddingHorizontal: 16,
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  ...SHADOWS.card,
};

const styles = StyleSheet.create({
  navigationalContainer: {
    ...baseContainer,
    borderColor: COLORS.border,
  },
  editableContainer: {
    ...baseContainer,
    borderColor: COLORS.border,
  },
  icon: {
    marginRight: 10,
  },
  placeholder: {
    ...FONTS.body,
    color: COLORS.textTertiary,
    flex: 1,
  },
  input: {
    ...FONTS.body,
    color: COLORS.textPrimary,
    flex: 1,
    padding: 0,
  },
});
