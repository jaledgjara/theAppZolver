import { usePortfolio } from "@/appSRC/users/Professional/General/Hooks/usePortfolio";
import React from "react";
import { View, Image, ScrollView, StyleSheet, Dimensions } from "react-native";

interface PortfolioCardProps {
  images: string[];
}

const { width } = Dimensions.get("window");

export const PortfolioCard: React.FC<PortfolioCardProps> = ({ images }) => {
  // ✅ Resolvemos los paths a URLs de Supabase usando el Hook dedicado
  const { urls, hasImages } = usePortfolio(images);

  if (!hasImages) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast">
        {urls.map((url, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image
              source={{ uri: url }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Eliminamos el background blanco y padding para que herede del padre (sectionCard)
    marginTop: 4,
  },
  imageWrapper: {
    // Sombra sutil para cada foto del portafolio
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 12,
    backgroundColor: "#EEE",
    borderRadius: 12,
  },
  image: {
    width: width * 0.6, // 60% del ancho de pantalla para mostrar que hay más
    height: 160,
    borderRadius: 12,
  },
});

export default PortfolioCard;
