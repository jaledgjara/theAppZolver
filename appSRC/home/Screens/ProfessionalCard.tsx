// ProfessionalCard.tsx
// A reusable card for showing a professional with avatar, name, category, and rating.

import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { BaseCard } from "@/appCOMP/cards/BaseCard";

interface ProfessionalCardProps {
  avatar: string;       // professional photo URL
  name: string;         // full name
  category: string;     // e.g., "Pintor"
  rating: number;       // 0–5
  onPress?: () => void; // press handler
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  avatar,
  name,
  category,
  rating,
  onPress,
}) => {
  return (
    <BaseCard
      onPress={onPress}
      left={
        <Image
          source={{ uri: avatar }}
          style={styles.avatar}
        />
      }
      middle={
        <View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.category}>{category}</Text>

          {/* Rating stars */}
          <View style={styles.ratingRow}>
            {Array.from({ length: 5 }).map((_, index) => (
              <FontAwesome
                key={index}
                name="star"
                size={16}
                color={index < rating ? "#FFD700" : "#D9D9D9"}
                style={{ marginRight: 4 }}
              />
            ))}
          </View>
        </View>
      }
      right={
        <FontAwesome name="chevron-right" size={22} color="#888" />
      }
    />
  );
};

const styles = StyleSheet.create({
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 50,
    backgroundColor: "#EEE",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  category: {
    fontSize: 14,
    color: "#777",
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    marginTop: 6,
  },
});
