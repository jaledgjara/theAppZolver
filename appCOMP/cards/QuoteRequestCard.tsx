import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "@/appASSETS/theme"; // Asumiendo imports del theme
import { LargeButton } from "@/appCOMP/button/LargeButton";

export interface QuoteRequestCardProps {
  clientName: string;
  category: string;
  description: string; // Ej: "Instalación eléctrica"
  date: string;
  status: "Pendiente" | "Enviado" | "Rechazado" | "Confirmado";
  onViewDetails: () => void;
}

const QuoteRequestCard = ({
  clientName,
  category,
  description,
  date,
  status,
  onViewDetails,
}: QuoteRequestCardProps) => {
  // 1. Lógica de Colores de Estado (Helper)
  const getStatusColor = () => {
    switch (status) {
      case "Pendiente":
        return "#FFC107"; // Amarillo (Atención requerida)
      case "Confirmado":
        return "#4CAF50"; // Verde (Éxito/Trabajo Activo)
      case "Rechazado":
        return "#EF4444"; // Rojo (Descartado)
      case "Enviado":
        return COLORS.primary; // Azul/Primary (Esperando respuesta)
      default:
        return COLORS.primary;
    }
  };

  // 2. Lógica de Texto del Botón (UX)
  const getButtonTitle = () => {
    if (status === "Confirmado") return "VER DETALLES DEL TRABAJO";
    if (status === "Enviado") return "VER PRESUPUESTO";
    return "VER DETALLE";
  };

  return (
    <View style={styles.cardContainer}>
      {/* HEADER: Categoría y Fecha */}
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
        <Text style={styles.dateText}>{date}</Text>
      </View>

      {/* BODY: Información Principal */}
      <View style={styles.body}>
        <Text style={styles.descriptionText} numberOfLines={2}>
          {description}
        </Text>

        <View style={styles.clientRow}>
          <Ionicons
            name="person-circle-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          <Text style={styles.clientText}>Cliente: {clientName}</Text>
        </View>

        {/* Estado Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
          />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* FOOTER: Acciones */}
      <View style={styles.footer}>
        <LargeButton title={getButtonTitle()} onPress={onViewDetails} />
      </View>
    </View>
  );
};

export default QuoteRequestCard;

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB", // gray-200
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: "#F3F4F6", // gray-100
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    fontSize: 10,
  },
  dateText: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
  },
  body: {
    marginBottom: 16,
  },
  descriptionText: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    fontWeight: "bold",
    marginBottom: 8,
    fontSize: 18,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  clientText: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB", // Fondo amarillo muy claro para resaltar pendiente
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    ...FONTS.body4,
    color: "#B45309", // Color oscuro para contraste en amarillo
    fontWeight: "bold",
    fontSize: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
});
