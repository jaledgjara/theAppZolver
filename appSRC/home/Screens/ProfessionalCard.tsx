import React, { useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";
import { BaseCard } from "@/appCOMP/cards/BaseCard";
import { useAvatar } from "@/appSRC/users/Professional/General/Hooks/useAvatar";
import UserAvatar from "@/appCOMP/avatar/UserAvatar";

interface ProfessionalCardProps {
  avatar: string | null;
  name: string;
  category: string;
  rating: number;
  reviewsCount?: number;
  price?: number;
  distance?: number | null;
  onPress?: () => void;
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  avatar,
  name,
  category,
  rating,
  reviewsCount = 0,
  price,
  distance,
  onPress,
}) => {
  const [imageError, setImageError] = useState(false);

  const formattedDistance = distance
    ? distance > 1000
      ? `${(distance / 1000).toFixed(1)} km`
      : `${Math.round(distance)} m`
    : null;
  const { url, showFallback, onError } = useAvatar(avatar, "avatars");

  return (
    <BaseCard onPress={onPress}>
      <View style={styles.row}>
        {/* 1. Avatar */}
        <UserAvatar
          path={avatar}
          name={name}
          size={56}
          style={styles.avatar} // Mantienes tus márgenes de la Card
        />

        {/* 2. Info Central */}
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.category} numberOfLines={1}>
              {category}
            </Text>
          </View>

          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>

          <View style={styles.ratingRow}>
            <FontAwesome name="star" size={14} color="#FFD700" />
            {/* CAMBIO: Color actualizado a gris */}
            <Text style={styles.ratingNumber}>
              {rating > 0 ? rating.toFixed(1) : "Nuevo"}
            </Text>
            {reviewsCount > 0 && (
              <Text style={styles.reviewCount}>({reviewsCount})</Text>
            )}
          </View>
        </View>

        {/* 3. Datos Derecha (Precio y Distancia) */}
        <View style={styles.rightContainer}>
          {/* CAMBIO: Eliminada la condición "else" para "A convenir" */}
          {price && price > 0 ? (
            <View style={styles.priceTag}>
              <Text style={styles.currency}>$</Text>
              <Text style={styles.priceValue}>{price.toLocaleString()}</Text>
            </View>
          ) : null}

          {formattedDistance && (
            <View style={styles.distanceBadge}>
              <Ionicons
                name="location-sharp"
                size={10}
                color={COLORS.textSecondary || "#888"}
              />
              <Text style={styles.distanceText}>{formattedDistance}</Text>
            </View>
          )}
        </View>
      </View>
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0F0F0",
    marginRight: 12,
  },
  infoContainer: { flex: 1, justifyContent: "center", gap: 2 },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  category: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    paddingBottom: 5,
  },
  name: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  ratingNumber: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.textSecondary || "#888", // CAMBIO: Gris (Hardcoded o desde theme)
    marginLeft: 4,
  },
  reviewCount: { fontSize: 12, color: "#888", marginLeft: 2 },
  rightContainer: { alignItems: "flex-end", minWidth: 70 },
  priceTag: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  currency: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "bold",
    marginBottom: 2,
    marginRight: 1,
  },
  priceValue: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  distanceBadge: { flexDirection: "row", alignItems: "center" },
  distanceText: {
    fontSize: 11,
    color: COLORS.textSecondary || "#888",
    marginLeft: 2,
  },
});
