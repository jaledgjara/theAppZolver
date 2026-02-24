import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BaseCard } from "@/appCOMP/cards/BaseCard";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { Review } from "../Type/ReviewType";

interface ReviewSummaryCardProps {
  review: Review;
}

/**
 * Shows an existing review inline (inside reservation detail).
 */
export const ReviewSummaryCard: React.FC<ReviewSummaryCardProps> = ({
  review,
}) => {
  return (
    <BaseCard>
      <Text style={styles.label}>Tu calificación</Text>
      <View style={styles.starsRow}>
        {Array.from({ length: 5 }, (_, i) => (
          <Ionicons
            key={i}
            name={i < review.score ? "star" : "star-outline"}
            size={22}
            color={i < review.score ? COLORS.primary : "#D1D5DB"}
            style={styles.starIcon}
          />
        ))}
        <Text style={styles.scoreText}>{review.score}/5</Text>
      </View>
      {review.comment ? (
        <Text style={styles.comment}>{review.comment}</Text>
      ) : null}
    </BaseCard>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  starIcon: {
    marginRight: 2,
  },
  scoreText: {
    fontSize: SIZES.body4,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  comment: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
});
