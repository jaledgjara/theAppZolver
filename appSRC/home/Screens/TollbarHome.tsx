import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLocation } from "@/appSRC/location/Hooks/useLocation";
import { COLORS, FONTS } from "@/appASSETS/theme";

interface ToolBarHomeProps {
  showMenukButton?: boolean;
}

export const ToolBarHome: React.FC<ToolBarHomeProps> = ({
  showMenukButton = true,
}) => {
  const router = useRouter();

  // 🟢 Lógica de Ubicación (Smart Component)
  const { activeAddress, loading } = useLocation();

  const titleText = activeAddress
    ? `${activeAddress.address_street} ${activeAddress.address_number}`
    : loading
    ? "Cargando ubicación..."
    : "Seleccionar ubicación";

  // Acción única para toda la barra
  const handleGlobalPress = () => {
    console.log("📍 [ToolBarHome] Navegando a selección de dirección...");
    router.push("/(client)/home/LocationScreen");
  };

  return (
    <Pressable
      onPress={handleGlobalPress}
      // Efecto visual nativo para Android
      android_ripple={{ color: "rgba(255,255,255,0.2)" }}
      // ✅ CORRECCIÓN: Un solo prop 'style' dinámico
      style={({ pressed }) => [
        styles.container,
        pressed && { opacity: 0.9 }, // Efecto de opacidad para iOS (y Android si no usa ripple)
      ]}>
      {/* Icono Menú (Solo visual, el click lo captura el padre) */}
      {showMenukButton ? (
        <View style={styles.menuIconWrapper}>
          <MaterialIcons name="menu" size={28} color="white" />
        </View>
      ) : (
        <View style={{ width: 28 }} />
      )}

      {/* Contenedor Central de Texto */}
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {titleText}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={20} color="white" />
      </View>

      {/* Espaciador para balancear layout */}
      <View style={{ width: 28 }} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: 130, // Altura cómoda
    paddingHorizontal: 20,
    paddingTop: 50, // Status bar
    paddingBottom: 15,
    backgroundColor: COLORS.tertiary,
  },
  menuIconWrapper: {
    // No es touchable por sí mismo, es parte del bloque
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)", // Fondo sutil
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  title: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: "600",
    marginRight: 4,
    maxWidth: "85%",
  },
});
