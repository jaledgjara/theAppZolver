import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { COLORS, FONTS } from "@/appASSETS/theme"; // Ajusta rutas si es necesario
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type MaterialIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

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
  // Ajustamos altura dinámica, pero permitimos flexibilidad
  const containerHeight = buttonTitle ? 260 : 200;

  return (
    <View style={[styles.cardContainer, { minHeight: containerHeight }]}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={32} color={COLORS.tertiary} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {buttonTitle && (
        <Pressable onPress={onButtonPress} style={styles.button}>
          <Text style={styles.buttonText}>{buttonTitle}</Text>
        </Pressable>
      )}
    </View>
  );
};

export default StatusPlaceholder;

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "white",
    // ELIMINAMOS width: '100%' para que respete el padding del padre
    alignSelf: "stretch",
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginHorizontal: 20, // Margen seguro horizontal
    marginTop: 40, // Separación superior
    alignItems: "center",
    justifyContent: "center",

    // Sombras más suaves
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 100,
    backgroundColor: COLORS.backgroundLight, // Fondo suave para el icono
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    ...FONTS.h2,
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    ...FONTS.body3,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 50,
    marginTop: 24,
  },
  buttonText: {
    ...FONTS.h4,
    fontWeight: "700",
    color: "white",
  },
});
