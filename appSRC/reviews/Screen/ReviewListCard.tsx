import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BaseCard } from "@/appCOMP/cards/BaseCard";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { Review } from "../Type/ReviewType";

interface ReviewListCardProps {
  review: Review;
}

/**
 * Single review card used in the professional's review list.
 */
export const ReviewListCard: React.FC<ReviewListCardProps> = ({ review }) => {
  const formattedDate = review.createdAt.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <BaseCard>
      <View style={styles.headerRow}>
        <Text style={styles.clientName} numberOfLines={1}>
          {review.clientName}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      <View style={styles.starsRow}>
        {Array.from({ length: 5 }, (_, i) => (
          <Ionicons
            key={i}
            name={i < review.score ? "star" : "star-outline"}
            size={18}
            color={i < review.score ? COLORS.primary : "#D1D5DB"}
            style={styles.starIcon}
          />
        ))}
      </View>

      {review.comment ? (
        <Text style={styles.comment}>{review.comment}</Text>
      ) : null}
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  clientName: {
    fontSize: SIZES.body3,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  starsRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  starIcon: {
    marginRight: 2,
  },
  comment: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 2,
  },
});
