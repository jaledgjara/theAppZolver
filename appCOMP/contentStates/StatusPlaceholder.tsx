import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { COLORS, FONTS, RADIUS, SHADOWS, SIZES } from "@/appASSETS/theme";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

interface StatusPlaceholderProps {
  icon: MaterialIconName;
  title: string;
  subtitle: string;
  buttonTitle?: string;
  onButtonPress?: () => void;
}

const StatusPlaceholder: React.FC<StatusPlaceholderProps> = ({
  icon,
  title,
  subtitle,
  buttonTitle,
  onButtonPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={32} color={COLORS.brandDeep} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {buttonTitle && (
        <Pressable
          onPress={onButtonPress}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>{buttonTitle}</Text>
        </Pressable>
      )}
    </View>
  );
};

export default StatusPlaceholder;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgCard,
    alignSelf: "stretch",
    borderRadius: RADIUS.lg,
    paddingVertical: 40,
    paddingHorizontal: SIZES.xl,
    marginHorizontal: SIZES.xl,
    marginTop: SIZES.xxxl,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.card,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SIZES.lg,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SIZES.sm,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: SIZES.sm,
  },
  button: {
    backgroundColor: COLORS.brandDeep,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: RADIUS.md,
    marginTop: SIZES.xxl,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    ...FONTS.bodyMedium,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.white,
  },
});
