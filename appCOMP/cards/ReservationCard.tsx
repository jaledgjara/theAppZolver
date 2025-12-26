import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";
import { BaseCard } from "@/appCOMP/cards/BaseCard";
// Asumo que este helper existe según tu código anterior
import { getStatusConfig } from "../../appSRC/reservations/Helper/MapStatusToUIClient";
import { ReservationStatusDTO } from "@/appSRC/reservations/Type/ReservationType";

export interface ReservationCardProps {
  id: string;
  counterpartName: string; // <--- CAMBIO: Nombre genérico (Cliente o Profesional)
  serviceName: string;
  date: string;
  time: string;
  status: ReservationStatusDTO;
  price?: string;
  avatar?: any; // Hecho opcional por si acaso
  onPress?: () => void;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({
  counterpartName,
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
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.serviceTitle} numberOfLines={2}>
          {serviceName}
        </Text>

        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.badgeText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* BODY */}
      <View style={styles.body}>
        <View style={styles.row}>
          <Ionicons
            name="person-circle-outline"
            size={16}
            color={COLORS.textSecondary}
          />
          {/* Aquí se muestra el nombre genérico */}
          <Text style={styles.infoText}>{counterpartName}</Text>
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
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 10,
    gap: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    lineHeight: 22,
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
