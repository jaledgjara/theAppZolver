import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BaseCard } from "@/appCOMP/cards/BaseCard";
import { ReservationStatusUI } from "@/appSRC/reservations/Type/ReservationType";

// ✅ Exportamos la interfaz para que el Mapper pueda usarla si es necesario
export interface ReservationCardProps {
  id: string;
  counterpartName: string;
  serviceName: string;
  date: string;
  time: string;
  status: ReservationStatusUI;
  price: string;
  avatar: any;
  onPress?: () => void;
}

// Configuración visual local (Rompe la dependencia circular con el Mapper)
const getStatusConfig = (status: ReservationStatusUI) => {
  switch (status) {
    case "confirmed":
      return { text: "Confirmada", bg: "#DBEAFE", color: "#3B82F6" };
    case "on_route":
      return { text: "En Camino", bg: "#EDE9FE", color: "#8B5CF6" };
    case "in_progress":
      return { text: "En Curso", bg: "#D1FAE5", color: "#10B981" };
    case "finalized":
      return { text: "Finalizada", bg: "#F3F4F6", color: "#374151" };
    case "canceled":
      return { text: "Cancelada", bg: "#FEE2E2", color: "#EF4444" };
    default:
      return { text: "Pendiente", bg: "#FEF3C7", color: "#F59E0B" };
  }
};

export const ReservationCard: React.FC<ReservationCardProps> = ({
  counterpartName,
  serviceName,
  date,
  time,
  status,
  price,
  avatar,
  onPress,
}) => {
  const config = getStatusConfig(status);

  return (
    <BaseCard onPress={onPress}>
      <View style={styles.container}>
        {/* Header: Titulo y Badge */}
        <View style={styles.headerRow}>
          <Text style={styles.serviceName} numberOfLines={1}>
            {serviceName}
          </Text>
          <View style={[styles.badge, { backgroundColor: config.bg }]}>
            <Text style={[styles.badgeText, { color: config.color }]}>
              {config.text}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Body: Avatar, Nombre, Fecha */}
        <View style={styles.bodyRow}>
          <Image source={avatar} style={styles.avatar} />
          <View style={styles.infoCol}>
            <Text style={styles.counterpartName}>{counterpartName}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.metaText}>
                {date} • {time}
              </Text>
            </View>
          </View>
          <Text style={styles.price}>{price}</Text>
        </View>
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  container: { padding: 4 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginBottom: 25,
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DDD",
    marginRight: 10,
  },
  infoCol: {
    flex: 1,
    justifyContent: "center",
  },
  counterpartName: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
    marginBottom: 7,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#888",
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
});
