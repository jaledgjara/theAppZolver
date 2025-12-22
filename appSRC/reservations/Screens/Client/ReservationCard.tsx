import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";
import { BaseCard } from "@/appCOMP/cards/BaseCard";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "on_route"
  | "in_progress"
  | "finalized"
  | "canceled";

export interface ReservationCardProps {
  id: string;
  professionalName: string;
  serviceName: string;
  date: string;
  time: string;
  status: ReservationStatus;
  price?: string;
  avatar: any;
  onPress?: () => void;
}

const getStatusConfig = (status: ReservationStatus) => {
  switch (status) {
    case "pending":
      return { label: "Pendiente", color: "#F59E0B", bg: "#FEF3C7" };
    case "confirmed":
      return { label: "Confirmada", color: "#3B82F6", bg: "#DBEAFE" };
    case "on_route":
      return { label: "En Camino", color: "#8B5CF6", bg: "#EDE9FE" };
    case "in_progress":
      return { label: "En Curso", color: "#10B981", bg: "#D1FAE5" };
    case "finalized":
      return { label: "Finalizada", color: "#10B981", bg: "transparent" };
    case "canceled":
      return { label: "Cancelada", color: "#EF4444", bg: "#FEE2E2" };
    default:
      return { label: status, color: "#6B7280", bg: "#F3F4F6" };
  }
};

export const ReservationCard: React.FC<ReservationCardProps> = ({
  professionalName,
  serviceName,
  date,
  time,
  status,
  price,
  onPress,
}) => {
  const statusInfo = getStatusConfig(status);

  return (
    <BaseCard onPress={onPress}>
      {/* HEADER: Refactorizado a Columna (Vertical) */}
      <View style={styles.header}>
        <Text style={styles.serviceTitle} numberOfLines={2}>
          {serviceName}
        </Text>

        {/* Badge debajo del título */}
        <View style={[styles.badge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.badgeText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* BODY: Info Clave */}
      <View style={styles.body}>
        <View style={styles.row}>
          <Ionicons
            name="person-circle-outline"
            size={16}
            color={COLORS.textSecondary}
          />
          <Text style={styles.infoText}>{professionalName}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.row}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={COLORS.textSecondary}
            />
            <Text style={styles.smallText}>
              {date} • {time}
            </Text>
          </View>
          {price && <Text style={styles.price}>{price}</Text>}
        </View>
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  header: {
    // CAMBIO: Eliminado flexDirection row para layout vertical
    alignItems: "flex-start", // Alinea contenido a la izquierda
    justifyContent: "center",
    marginBottom: 10,
    gap: 8, // Espacio entre Título y Badge
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 22, // Mejor legibilidad si el texto ocupa 2 líneas
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: 10,
  },
  body: { gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  infoText: { fontSize: 14, color: "#444" },
  smallText: { fontSize: 12, color: "#666" },
  price: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
});
