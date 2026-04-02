import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { COLORS, FONTS, RADIUS, SIZES } from "@/appASSETS/theme";

export interface ChipItem {
  id: string;
  label: string;
  [key: string]: unknown;
}

interface QuickChipsProps {
  items: ChipItem[];
  selectedIds: string[];
  onToggle: (item: ChipItem) => void;
  /** Si true, renderiza en scroll horizontal (modo filtros) */
  scrollable?: boolean;
}

const QuickChips: React.FC<QuickChipsProps> = ({
  items,
  selectedIds,
  onToggle,
  scrollable = false,
}) => {
  if (!items || items.length === 0) return null;

  const chips = items.map((item) => {
    const isSelected = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => onToggle(item)}
        activeOpacity={0.75}
        style={[styles.chip, isSelected ? styles.chipActive : styles.chipInactive]}
      >
        <Text style={[styles.chipText, isSelected ? styles.textActive : styles.textInactive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chips}
      </ScrollView>
    );
  }

  return <View style={styles.wrap}>{chips}</View>;
};

export default QuickChips;

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 0,
    gap: SIZES.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SIZES.sm,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  chipInactive: {
    backgroundColor: COLORS.bgSecondary,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.brandDeep,
    borderColor: COLORS.brandDeep,
  },
  chipText: {
    ...FONTS.caption,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  textInactive: {
    color: COLORS.textSecondary,
  },
  textActive: {
    color: COLORS.white,
  },
});
