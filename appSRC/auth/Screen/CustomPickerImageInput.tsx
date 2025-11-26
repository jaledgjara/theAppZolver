// appCOMP/inputs/CustomPickerImageInput.tsx
import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "@/appASSETS/theme";

interface Props {
  title: string;
  subtitle: string;
  iconTitle: React.ComponentProps<typeof Ionicons>["name"];
  isUploaded: boolean;
  onPress: () => void;
}

export const CustomPickerImageInput: React.FC<Props> = ({
  title,
  subtitle,
  iconTitle,
  isUploaded,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, isUploaded && styles.containerSuccess]}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Icono del Tipo de Documento */}
      <View style={styles.iconWrapper}>
        <Ionicons
          name={iconTitle}
          size={28}
          color={isUploaded ? COLORS.success : COLORS.textSecondary}
        />
      </View>

      {/* Textos */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Indicador de Estado (Check o Flecha) */}
      <Ionicons
        name={isUploaded ? "checkmark-circle" : "chevron-forward"}
        size={24}
        color={isUploaded ? COLORS.success : "#D1D5DB"}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    // Sombra suave
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  containerSuccess: {
    borderColor: COLORS.success, // Borde verde si está listo
    backgroundColor: "#F0FDF4", // Fondo verde muy sutil
  },
  iconWrapper: {
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
