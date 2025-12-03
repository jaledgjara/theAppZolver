import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { BaseCard } from "@/appCOMP/cards/BaseCard";
import { COLORS } from "@/appASSETS/theme"; // Asegúrate de importar tus colores

interface ProfessionalCardProps {
  avatar: string;
  name: string;
  category: string;
  rating: number;
  // --- NUEVOS CAMPOS ---
  price?: number;
  distance?: number | null; // Viene en metros desde PostGIS
  onPress?: () => void;
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  avatar,
  name,
  category,
  rating,
  price,
  distance,
  onPress,
}) => {
  // Lógica para mostrar "2.5 km" o "500 m"
  const formattedDistance = distance
    ? distance > 1000
      ? `${(distance / 1000).toFixed(1)} km`
      : `${Math.round(distance)} m`
    : null;

  return (
    <BaseCard
      onPress={onPress}
      left={
        <Image
          source={{ uri: avatar || "https://via.placeholder.com/150" }}
          style={styles.avatar}
        />
      }
      middle={
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.category} numberOfLines={1}>
            {category}
          </Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            {Array.from({ length: 5 }).map((_, index) => (
              <FontAwesome
                key={index}
                name="star"
                size={14}
                color={index < Math.round(rating) ? "#FFD700" : "#D9D9D9"}
                style={{ marginRight: 2 }}
              />
            ))}
          </View>
        </View>
      }
      right={
        // --- AQUÍ MOSTRAMOS PRECIO Y DISTANCIA ---
        <View style={styles.metaContainer}>
          {price && <Text style={styles.price}>${price.toLocaleString()}</Text>}

          {formattedDistance && (
            <View style={styles.distanceBadge}>
              <Ionicons
                name="location-sharp"
                size={10}
                color={COLORS.primary}
              />
              <Text style={styles.distanceText}>{formattedDistance}</Text>
            </View>
          )}
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EEE",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  category: {
    fontSize: 14,
    color: "#777",
    marginVertical: 2,
  },
  ratingRow: {
    flexDirection: "row",
    marginTop: 2,
  },
  // --- Estilos Nuevos ---
  metaContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: "#333",
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 11,
    color: COLORS.primary,
    marginLeft: 2,
    fontWeight: "700",
  },
});
