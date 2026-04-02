import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, RADIUS, SHADOWS, SIZES } from "@/appASSETS/theme";
import { RatingBadge } from "@/appCOMP/badge/RatingBadge";
import UserAvatar from "@/appCOMP/avatar/UserAvatar";

interface ProfessionalCardProps {
  avatar: string | null;
  name: string;
  category: string;
  rating: number;
  reviewsCount?: number;
  description?: string;
  verified?: boolean;
  completedJobs?: number;
  distance?: number | null;
  onPress?: () => void;
  onContactPress?: () => void;
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  avatar,
  name,
  category,
  rating,
  reviewsCount = 0,
  description,
  verified = false,
  completedJobs,
  distance,
  onPress,
  onContactPress,
}) => {
  const formattedDistance = distance
    ? distance > 1000
      ? `${(distance / 1000).toFixed(1)} km`
      : `${Math.round(distance)} m`
    : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      {/* ── Fila superior: Avatar + Info + Rating ── */}
      <View style={styles.topRow}>
        <UserAvatar path={avatar} name={name} size={48} style={styles.avatar} />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.category} numberOfLines={1}>
              {category}
            </Text>
            {formattedDistance && (
              <>
                <Text style={styles.dot}> · </Text>
                <Ionicons name="location-sharp" size={11} color={COLORS.textTertiary} />
                <Text style={styles.distance}>{formattedDistance}</Text>
              </>
            )}
          </View>
        </View>

        <RatingBadge rating={rating} filled />
      </View>

      {/* ── Descripción ── */}
      {description ? (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      ) : null}

      {/* ── Chips + CTA ── */}
      <View style={styles.bottomRow}>
        <View style={styles.chips}>
          {verified && (
            <View style={styles.chipVerified}>
              <Text style={styles.chipVerifiedText}>Verificado</Text>
            </View>
          )}
          {completedJobs != null && completedJobs > 0 && (
            <View style={styles.chipJobs}>
              <Text style={styles.chipJobsText}>+{completedJobs} trabajos</Text>
            </View>
          )}
        </View>

        {onContactPress && (
          <TouchableOpacity
            onPress={onContactPress}
            style={styles.ctaBtn}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text style={styles.ctaText}>Contactar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SIZES.lg,
    marginVertical: SIZES.xs + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SIZES.md,
    ...SHADOWS.card,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SIZES.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: COLORS.brandLight,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  category: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
  },
  dot: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
  },
  distance: {
    ...FONTS.caption,
    color: COLORS.textTertiary,
    marginLeft: 2,
  },
  description: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SIZES.xs,
  },
  chips: {
    flexDirection: "row",
    gap: SIZES.sm,
    flex: 1,
    flexWrap: "wrap",
  },
  chipVerified: {
    backgroundColor: COLORS.brandLight,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipVerifiedText: {
    ...FONTS.micro,
    color: COLORS.brandDeep,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  chipJobs: {
    backgroundColor: COLORS.accentLight,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipJobsText: {
    ...FONTS.micro,
    color: COLORS.textPrimary,
  },
  ctaBtn: {
    backgroundColor: COLORS.brandDeep,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaText: {
    ...FONTS.caption,
    fontFamily: "PlusJakartaSans_700Bold",
    color: COLORS.white,
  },
});
