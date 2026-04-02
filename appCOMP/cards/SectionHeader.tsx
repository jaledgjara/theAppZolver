import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";

interface SectionHeaderProps {
  title: string;
  linkLabel?: string;
  onLinkPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  linkLabel = "Ver todos →",
  onLinkPress,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {onLinkPress && (
        <TouchableOpacity onPress={onLinkPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.link}>{linkLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SIZES.md,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
  },
  link: {
    ...FONTS.caption,
    color: COLORS.brandMid,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
});
