import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ToolBarTitle } from "@/appCOMP/toolbar/Toolbar";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useProfessionalReviews } from "@/appSRC/reviews/Hooks/useProfessionalReviews";
import { ReviewListCard } from "@/appSRC/reviews/Screen/ReviewListCard";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import { COLORS, SIZES } from "@/appASSETS/theme";

const MyReviewsScreen = () => {
  const user = useAuthStore((s) => s.user);
  const { data: reviews, isLoading, refetch } = useProfessionalReviews(
    user?.uid ?? ""
  );

  // Calculate average
  const averageRating =
    reviews && reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(
          1
        )
      : "0.0";

  if (isLoading) return <MiniLoaderScreen />;

  return (
    <View style={styles.container}>
      <ToolBarTitle titleText="Mis Reseñas" showBackButton />

      {/* Rating Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.ratingCircle}>
          <Text style={styles.ratingNumber}>{averageRating}</Text>
          <Ionicons name="star" size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.reviewCount}>
          {reviews?.length ?? 0}{" "}
          {reviews?.length === 1 ? "reseña" : "reseñas"}
        </Text>
      </View>

      {/* Review List */}
      {!reviews || reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={48}
            color="#D1D5DB"
          />
          <Text style={styles.emptyText}>
            Aún no tenés reseñas. Aparecerán acá cuando tus clientes te
            califiquen.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReviewListCard review={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
    </View>
  );
};

export default MyReviewsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  summaryContainer: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  ratingCircle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  reviewCount: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
});
