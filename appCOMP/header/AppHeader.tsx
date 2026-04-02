import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SHADOWS } from "@/appASSETS/theme";

interface AppHeaderProps {
  userName?: string;
  onNotificationsPress?: () => void;
  onAvatarPress?: () => void;
  avatarInitial?: string;
  /** Animated.Value de la pantalla para el colapso al scroll */
  scrollY?: Animated.Value;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  userName,
  onNotificationsPress,
  onAvatarPress,
  avatarInitial,
  scrollY,
}) => {
  const fallbackScrollY = useRef(new Animated.Value(0)).current;
  const animatedScrollY = scrollY ?? fallbackScrollY;

  // Al scrollear hacia abajo: padding pasa de 16 a 10
  const paddingVertical = animatedScrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [16, 10],
    extrapolate: "clamp",
  });

  const greetingText = userName ? `Hola, ${userName} 👋` : null;

  return (
    <Animated.View style={[styles.container, { paddingVertical }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.brandDeep} />

      {/* Logo */}
      <View style={styles.logoWrapper}>
        <Text style={styles.logoNexo}>Nexo</Text>
        <Text style={styles.logoFix}>Fix</Text>
        {greetingText && (
          <Text style={styles.greeting} numberOfLines={1}>
            {greetingText}
          </Text>
        )}
      </View>

      {/* Acciones derecha */}
      <View style={styles.actions}>
        {onNotificationsPress && (
          <TouchableOpacity
            onPress={onNotificationsPress}
            style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {onAvatarPress && (
          <TouchableOpacity
            onPress={onAvatarPress}
            style={styles.avatarBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {avatarInitial ? (
              <Text style={styles.avatarInitial}>{avatarInitial.toUpperCase()}</Text>
            ) : (
              <Ionicons name="person" size={18} color={COLORS.brandDeep} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 44;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.brandDeep,
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT,
    minHeight: 56 + STATUS_BAR_HEIGHT,
    ...SHADOWS.float,
  },
  logoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    flex: 1,
  },
  logoNexo: {
    ...FONTS.h1,
    color: COLORS.white,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  logoFix: {
    ...FONTS.h1,
    color: COLORS.accent,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  greeting: {
    ...FONTS.caption,
    color: COLORS.brandLight,
    marginLeft: 12,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  avatarInitial: {
    ...FONTS.bodyMedium,
    color: COLORS.brandDeep,
    fontFamily: "PlusJakartaSans_700Bold",
  },
});
