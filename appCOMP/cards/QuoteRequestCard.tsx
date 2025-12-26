import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS } from "@/appASSETS/theme";
import { BaseCard } from "@/appCOMP/cards/BaseCard";
// Helpers de Estado
import {
  getStatusConfig,
  mapStatusToUI,
} from "@/appSRC/reservations/Helper/MapStatusToUIClient";
import { ReservationStatusDTO } from "@/appSRC/reservations/Type/ReservationType";

export interface QuoteRequestCardProps {
  id: string;
  counterpartName: string; // Nombre del Cliente
  serviceName: string; // Título del trabajo
  date: string; // Fecha formateada
  time: string; // Hora formateada
  status: ReservationStatusDTO; // Estado crudo de la DB (DTO)
  price?: string;
  onPress?: () => void;
}

const QuoteRequestCard: React.FC<QuoteRequestCardProps> = ({
  counterpartName,
  serviceName,
  date,
  time,
  status,
  price,
  onPress,
}) => {
  // 1. Mapeo Centralizado: DTO -> UI Status -> Color Config
  const uiStatus = mapStatusToUI(status);
  const statusInfo = getStatusConfig(uiStatus);

  return (
    <BaseCard onPress={onPress}>
      {/* --- HEADER: Título y Estado --- */}
      <View style={styles.header}>
        <Text style={styles.serviceTitle} numberOfLines={2}>
          {serviceName}
        </Text>

        {/* Badge de Estado Dinámico */}
        <View style={[styles.badge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.badgeText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* --- BODY: Cliente y Fecha --- */}
      <View style={styles.body}>
        {/* Fila Cliente */}
        <View style={styles.row}>
          <Ionicons
            name="person-circle-outline"
            size={18}
            color={COLORS.textSecondary}
          />
          <Text style={styles.infoText} numberOfLines={1}>
            {counterpartName}
          </Text>
        </View>

        {/* Fila Meta (Fecha y Precio) */}
        <View style={styles.metaRow}>
          <View style={styles.row}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.smallText}>
              {date} • {time}
            </Text>
          </View>

          {/* Precio condicional */}
          {price && <Text style={styles.price}>{price}</Text>}
        </View>
      </View>
    </BaseCard>
  );
};

export default QuoteRequestCard;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  serviceTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6", // gray-100
    marginBottom: 12,
  },
  body: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  infoText: {
    ...FONTS.body3,
    color: COLORS.textPrimary,
    fontWeight: "500",
    flex: 1,
  },
  smallText: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
});
