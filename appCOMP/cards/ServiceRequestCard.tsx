import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme"; // Asumiendo imports del theme
import { LargeButton } from "@/appCOMP/button/LargeButton";

interface ServiceRequestCardProps {
  category: string;
  price: string;
  distance: string;
  location: string;
  timeEstimate?: string;
  onAccept: () => void;
  onDecline?: () => void;
}

const ServiceRequestCard = ({
  category,
  price,
  distance,
  location,
  timeEstimate = "Lo antes posible",
  onAccept,
  onDecline,
}: ServiceRequestCardProps) => {
  return (
    <View style={styles.cardContainer}>
      {/* HEADER DE LA TARJETA */}
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
        <Text style={styles.priceText}>{price}</Text>
      </View>

      {/* DETALLES */}
      <View style={styles.detailsContainer}>
        <View style={styles.row}>
          <Ionicons name="navigate-circle" size={20} color={COLORS.primary} />
          <Text style={styles.detailText}>A {distance}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons
            name="location-sharp"
            size={20}
            color={COLORS.textSecondary}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
        </View>

        <View style={styles.row}>
          <Ionicons
            name="time-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          <Text style={styles.detailText}>{timeEstimate}</Text>
        </View>
      </View>

      {/* ACCIONES */}
      <View style={styles.actionContainer}>
        {/* Usamos tu LargeButton para la acción principal */}
        <LargeButton
          title="Aceptar Solicitud"
          onPress={onAccept}
          backgroundColor={COLORS.tertiary}
        />

        {/* Opción secundaria discreta */}
        {onDecline && (
          <TouchableOpacity onPress={onDecline} style={styles.declineButton}>
            <Text style={styles.declineText}>Rechazar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ServiceRequestCard;

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    // Sombras sutiles para elevación
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    paddingBottom: 12,
  },
  categoryBadge: {
    backgroundColor: COLORS.textSecondary
      ? COLORS.textSecondary + "20"
      : "#E3F2FD", // Fallback light blue
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    ...FONTS.h3,
    color: COLORS.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 12,
  },
  priceText: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    fontWeight: "bold",
    fontSize: 18,
  },
  detailsContainer: {
    marginBottom: 16,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    ...FONTS.body3,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  locationText: {
    ...FONTS.body4,
    color: COLORS.textSecondary || "#666",
    flex: 1,
  },
  actionContainer: {
    marginTop: 8,
    gap: 12,
  },
  declineButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  declineText: {
    color: COLORS.textSecondary || "#999",
    fontWeight: "600",
  },
});
