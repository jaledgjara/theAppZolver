import React, { useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
  View,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, RADIUS, SHADOWS } from "@/appASSETS/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "destructive";

interface LargeButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;

  /** Overrides de color manual (opcional, prefiere variant) */
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  textColor?: string;
  disabled?: boolean;

  /** Ícono opcional */
  iconName?: IoniconName;
  iconColor?: string;
  iconSize?: number;

  /** Estado de carga */
  loading?: boolean;
  loaderColor?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: COLORS.brandDeep, text: COLORS.white },
  secondary: { bg: COLORS.brandLight, text: COLORS.brandDeep },
  accent: { bg: COLORS.accent, text: COLORS.textPrimary },
  ghost: { bg: "transparent", text: COLORS.brandDeep, border: COLORS.brandDeep },
  destructive: { bg: COLORS.error, text: COLORS.white },
};

export const LargeButton: React.FC<LargeButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  style,
  backgroundColor,
  textColor,
  disabled = false,
  iconName,
  iconColor,
  iconSize = 20,
  loading = false,
  loaderColor,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const variantStyle = VARIANT_STYLES[variant];
  const resolvedBg = isDisabled ? "#C8DBD6" : (backgroundColor ?? variantStyle.bg);
  const resolvedText = textColor ?? variantStyle.text;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        activeOpacity={1}
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          { backgroundColor: resolvedBg },
          variantStyle.border ? { borderWidth: 1.5, borderColor: variantStyle.border } : undefined,
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={loaderColor ?? resolvedText} />
        ) : (
          <View style={styles.contentRow}>
            {iconName && (
              <Ionicons
                name={iconName}
                size={iconSize}
                color={iconColor ?? resolvedText}
                style={styles.icon}
              />
            )}
            <Text style={[styles.label, { color: resolvedText }]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: RADIUS.md,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    ...SHADOWS.card,
  },
  disabled: {
    opacity: 0.55,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  label: {
    ...FONTS.bodyMedium,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    letterSpacing: 0.3,
    textAlign: "center",
  },
});
