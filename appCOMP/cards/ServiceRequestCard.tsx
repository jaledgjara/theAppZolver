import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BaseCard } from "@/appCOMP/cards/BaseCard";
import { UserAvatar } from "@/appCOMP/avatar/UserAvatar";
import { COLORS, FONTS } from "@/appASSETS/theme";

export interface ServiceRequestCardProps {
  clientName: string;
  serviceTitle: string;
  price: string;
  location: string;
  timeAgo: string;
  onPress: () => void;
}

export const ServiceRequestCard: React.FC<ServiceRequestCardProps> = ({
  clientName,
  serviceTitle,
  price,
  location,
  timeAgo,
  onPress,
}) => {
  return (
    <BaseCard onPress={onPress}>
      <View style={styles.cardPadding}>
        {/* Header: Avatar + Client name + Status badge */}
        <View style={styles.header}>
          <View style={styles.clientRow}>
            <UserAvatar name={clientName} size={42} />
            <View>
              <Text style={styles.clientName} numberOfLines={1}>
                {clientName}
              </Text>
              <Text style={styles.clientLabel}>Cliente</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Pendiente</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Body */}
        <Text style={styles.serviceTitle} numberOfLines={2}>
          {serviceTitle}
        </Text>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>{timeAgo}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>
            {location}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{price}</Text>
        </View>
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  cardPadding: {
    padding: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  clientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  clientLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#F59E0B",
    textTransform: "uppercase",
    fontFamily: "Roboto-Bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: 12,
  },
  serviceTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    fontFamily: "Roboto-Regular",
  },
  priceRow: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  price: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    fontWeight: "700",
  },
});
