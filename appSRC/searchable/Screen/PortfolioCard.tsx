// appSRC/profile/Screens/PortfolioCard.tsx
import React from "react";
import { View, Text, Image, ScrollView, StyleSheet } from "react-native";
import { COLORS, SIZES } from "@/appASSETS/theme";

interface PortfolioCardProps {
  images: string[];
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ images }) => {
  if (!images || images.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portafolio</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {images.map((img, index) => (
          <Image key={index} source={{ uri: img }} style={styles.image} />
        ))}
      </ScrollView>
    </View>
  );
};

export default PortfolioCard;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: SIZES.h3,
    fontWeight: "bold",
    marginBottom: 10,
    color: COLORS.textPrimary,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#EEE",
  },
});
