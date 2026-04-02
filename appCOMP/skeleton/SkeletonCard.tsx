import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";
import { COLORS, RADIUS, SIZES } from "@/appASSETS/theme";

interface SkeletonCardProps {
  height?: number;
  style?: ViewStyle;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ height = 100, style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View style={[styles.card, { height, opacity }, style]}>
      {/* Avatar placeholder */}
      <View style={styles.avatar} />
      {/* Lines */}
      <View style={styles.linesContainer}>
        <View style={[styles.line, styles.lineShort]} />
        <View style={[styles.line, styles.lineFull]} />
        <View style={[styles.line, styles.lineMedium]} />
      </View>
    </Animated.View>
  );
};

/** Lista de N skeletons para listas en carga */
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} style={{ marginBottom: SIZES.md }} />
    ))}
  </>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SIZES.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.bgSecondary,
    marginRight: SIZES.lg,
  },
  linesContainer: {
    flex: 1,
    gap: SIZES.sm,
  },
  line: {
    height: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgSecondary,
  },
  lineShort: { width: "40%" },
  lineFull: { width: "90%" },
  lineMedium: { width: "65%" },
});
