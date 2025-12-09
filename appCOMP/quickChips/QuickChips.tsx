// QuickChips.tsx
// A lightweight horizontal chips component for quick suggestions.

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

interface QuickChipsProps {
  items: string[];
  onPress?: (item: string) => void;
}

const QuickChips: React.FC<QuickChipsProps> = ({ items, onPress }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.chip}
          onPress={() => onPress?.(item)}>
          <Text style={styles.chipText}>{item}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default QuickChips;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  chip: {
    backgroundColor: "#F1F1F3",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
});
