import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";

// Habilitar animaciones en Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FaqProps {
  title: string;
  answer: string;
}

export const FaqAccordion = ({ title, answer }: FaqProps) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity
      style={[styles.card, expanded && styles.cardExpanded]}
      onPress={toggleExpand}
      activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={[styles.title, expanded && styles.titleActive]}>
          {title}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={expanded ? COLORS.primary : COLORS.textSecondary}
        />
      </View>

      {expanded && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: SIZES.radius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardExpanded: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    ...FONTS.h4,
    color: COLORS.textPrimary,
    flex: 1,
    paddingRight: 10,
  },
  titleActive: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  answerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  answerText: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
