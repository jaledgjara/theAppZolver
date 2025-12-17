import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BaseCard } from "@/appCOMP/cards/BaseCard";
import { COLORS } from "@/appASSETS/theme";

export interface ServiceRequestCardProps {
  category: string;
  title: string;
  price: string;
  distance: string;
  location: string;
  timeAgo: string;
  onAccept: () => void;
  onDecline: () => void;
}

export const ServiceRequestCard: React.FC<ServiceRequestCardProps> = ({
  category,
  title,
  price,
  distance,
  location,
  timeAgo,
  onAccept,
  onDecline,
}) => {
  return (
    <BaseCard>
      {/* Top: Categoría y Tiempo */}
      <View style={styles.topRow}>
        <Text style={styles.category}>{category}</Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>

      {/* Main: Título y Precio */}
      <View style={styles.mainInfo}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.price}>{price}</Text>
      </View>

      {/* Location */}
      <View style={styles.locationRow}>
        <Ionicons
          name="navigate-circle-outline"
          size={18}
          color={COLORS.tertiary}
        />
        <View>
          <Text style={styles.address} numberOfLines={1}>
            {location}
          </Text>
          <Text style={styles.distance}>{distance} de tu ubicación</Text>
        </View>
      </View>

      {/* Botones de Acción */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
          <Text style={styles.declineText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
          <Text style={styles.acceptText}>Aceptar Trabajo</Text>
        </TouchableOpacity>
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  category: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    backgroundColor: "#E3F2FD",
    padding: 4,
    borderRadius: 4,
  },
  time: { fontSize: 11, color: "#888" },
  mainInfo: { marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 2 },
  price: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  address: { fontSize: 13, color: "#444", flex: 1 },
  distance: { fontSize: 11, color: "#888" },
  actionRow: { flexDirection: "row", gap: 10 },
  declineButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    alignItems: "center",
  },
  declineText: { color: "#666", fontWeight: "600" },
  acceptButton: {
    flex: 2,
    padding: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  acceptText: { color: "white", fontWeight: "700" },
});
