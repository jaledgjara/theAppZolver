import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, SIZES, FONTS } from "@/appASSETS/theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export interface SectionItemProps {
  title: string; // Ej: "Juan Pérez" o "Instalación Eléctrica"
  subtitle?: string; // Ej: "Solicitud de Gasista" o "14:00 HS"
  status?: string; // Ej: "Confirmado", "Pendiente"
  onPress?: () => void;
  // Opcional: Para diferenciar visualmente si es hora o texto
  isTime?: boolean;
}

// Helper para colores de estado (UX)
const getStatusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("confirm")) return { bg: "#E6F4EA", text: "#1E8E3E" }; // Verde
  if (s.includes("pendie")) return { bg: "#FFF4E5", text: "#B06000" }; // Naranja
  if (s.includes("cancel")) return { bg: "#FCE8E6", text: "#C5221F" }; // Rojo
  if (s.includes("alert")) return { bg: "#FEF7E0", text: "#F9AB00" }; // Amarillo
  return { bg: "#F1F3F4", text: "#5F6368" }; // Gris Default
};

const SectionItem: React.FC<SectionItemProps> = ({
  title,
  subtitle,
  status,
  onPress,
  isTime,
}) => {
  const statusStyle = status ? getStatusColor(status) : null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* COLUMNA IZQUIERDA: Info Principal */}
      <View style={styles.leftColumn}>
        {/* Título Grande y Profesional */}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {/* Subtítulo (Ej: Solicitud de gasista) */}
        {subtitle && (
          <View style={styles.subtitleContainer}>
            {isTime && (
              <MaterialCommunityIcons
                name="clock-outline"
                size={14}
                color={COLORS.textSecondary}
                style={{ marginRight: 4 }}
              />
            )}
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        )}
      </View>

      {/* COLUMNA DERECHA: Status y Acción */}
      <View style={styles.rightColumn}>
        {status && (
          <View style={[styles.badge, { backgroundColor: statusStyle?.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle?.text }]}>
              {status}
            </Text>
          </View>
        )}

        {/* Chevron para indicar navegabilidad */}
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={"gray"}
          style={{ marginLeft: 8 }}
        />
      </View>
    </TouchableOpacity>
  );
};

export default SectionItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16, // Más espacio vertical para touch target
    paddingHorizontal: 4, // Pequeño margen interno
  },
  leftColumn: {
    flex: 1, // Toma todo el espacio disponible
    justifyContent: "center",
    marginRight: 16,
  },
  rightColumn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 17, // Texto grande solicitado
    fontWeight: "700", // Más peso visual
    color: "#1A1A1A", // Casi negro para contraste
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  subtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary, // Gris profesional
    fontWeight: "500",
  },
  // EL ESTILO DE "STATUS PEQUEÑO" Y CON COLOR
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12, // Bordes redondeados (Pill shape)
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 11, // Texto pequeño solicitado
    fontWeight: "700",
    textTransform: "uppercase", // Toque profesional
  },
});
