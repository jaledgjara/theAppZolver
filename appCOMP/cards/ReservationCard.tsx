import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BaseCard } from "@/appCOMP/cards/BaseCard";
import { ReservationStatusUI } from "@/appSRC/reservations/Type/ReservationType";
import UserAvatar from "../avatar/UserAvatar";
import { COLORS, SIZES, FONTS } from "@/appASSETS/theme"; // Importamos FONTS y SIZES

export interface ReservationCardProps {
  id: string;
  counterpartName: string;
  serviceName: string;
  date: string;
  time: string;
  status: ReservationStatusUI;
  price: string;
  avatar: any;
  viewRole: "client" | "professional";
  onPress?: () => void;
}

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
  viewRole,
  onPress,
}) => {
  const config = getStatusConfig(status);
  const avatarSize = 55; // Tamaño unificado para ambos estados

  return (
    <BaseCard onPress={onPress}>
      <View style={styles.cardInternalPadding}>
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

        {/* Body: Avatar (Dinámico) + Info */}
        <View style={styles.bodyRow}>
          <View style={styles.avatarWrapper}>
            {viewRole === "professional" ? (
              <UserAvatar name={counterpartName} size={avatarSize} />
            ) : (
              <Image
                source={typeof avatar === "string" ? { uri: avatar } : avatar}
                style={[
                  styles.avatarImage,
                  {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                  },
                ]}
              />
            )}
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.counterpartName} numberOfLines={1}>
              {counterpartName}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.metaText}>
                {date} • {time}
              </Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>{price}</Text>
          </View>
        </View>
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  cardInternalPadding: {
    padding: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10, // Un poco más ajustado
  },
  serviceName: {
    ...FONTS.h3, // Usamos la tipografía del sistema
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Roboto-Bold",
    textTransform: "uppercase",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: 12,
  },
  bodyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarImage: {
    backgroundColor: COLORS.backgroundInput,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginRight: 14,
  },
  infoCol: {
    flex: 1,
    justifyContent: "center",
  },
  counterpartName: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: "Roboto-Regular",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
});
