import React from "react";
import { Pressable, StyleSheet, Text, View, Platform, StatusBar } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLocation } from "@/appSRC/location/Hooks/useLocation";
import { formatAddress } from "@/appSRC/location/Type/LocationType";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";

interface ToolBarHomeProps {
  showMenukButton?: boolean;
}

export const ToolBarHome: React.FC<ToolBarHomeProps> = ({ showMenukButton = true }) => {
  const router = useRouter();
  const { activeAddress, loading } = useLocation();

  const titleText = activeAddress
    ? formatAddress(activeAddress)
    : loading
      ? "Cargando ubicación..."
      : "Seleccionar ubicación";

  const handleGlobalPress = () => {
    router.push("/(client)/home/LocationScreen");
  };

  return (
    <Pressable
      onPress={handleGlobalPress}
      android_ripple={{ color: "rgba(255,255,255,0.2)" }}
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.9 }]}
    >
      {showMenukButton ? (
        <View style={styles.menuIconWrapper}>
          <MaterialIcons name="menu" size={26} color={COLORS.white} />
        </View>
      ) : (
        <View style={styles.spacer} />
      )}

      <View style={styles.textContainer}>
        <MaterialIcons name="location-on" size={16} color={COLORS.accent} />
        <Text style={styles.title} numberOfLines={1}>
          {titleText}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={18} color={COLORS.brandLight} />
      </View>

      <View style={styles.spacer} />
    </Pressable>
  );
};

const STATUS_BAR_HEIGHT = Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 44;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: SIZES.xl,
    paddingTop: STATUS_BAR_HEIGHT + SIZES.lg,
    paddingBottom: SIZES.lg,
    backgroundColor: COLORS.brandDeep,
  },
  menuIconWrapper: {
    width: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  spacer: {
    width: 28,
  },
  textContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingVertical: SIZES.sm,
    paddingHorizontal: SIZES.md,
    borderRadius: SIZES.xxxl,
    marginHorizontal: SIZES.md,
    gap: 4,
  },
  title: {
    ...FONTS.body,
    color: COLORS.white,
    fontFamily: "PlusJakartaSans_600SemiBold",
    flex: 1,
    textAlign: "center",
  },
});
