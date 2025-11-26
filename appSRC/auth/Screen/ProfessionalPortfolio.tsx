// appCOMP/professional/ProfessionalPortfolio.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";

interface Props {
  images: string[];
  onAddImage: () => void;
  onRemoveImage: (index: number) => void;
  maxImages?: number;
  isLoading?: boolean;
}

export const ProfessionalPortfolio: React.FC<Props> = ({
  images,
  onAddImage,
  onRemoveImage,
  maxImages = 5,
  isLoading = false,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Subir trabajos ({images.length}/{maxImages})
      </Text>
      <Text style={styles.helperText}>
        Agrega fotos de trabajos terminados para destacar.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}>
        {/* Botón Agregar */}
        <TouchableOpacity
          style={styles.addImageButton}
          onPress={onAddImage}
          disabled={images.length >= maxImages || isLoading}>
          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="camera-plus-outline"
                size={32}
                color={
                  images.length >= maxImages
                    ? COLORS.textSecondary
                    : COLORS.primary
                }
              />
              <Text
                style={[
                  styles.addImageText,
                  images.length >= maxImages && { color: COLORS.textSecondary },
                ]}>
                Subir
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Lista de Imágenes */}
        {images.map((uri, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveImage(index)}>
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    ...FONTS.h3,
    fontSize: SIZES.h3,
    color: COLORS.textPrimary,
    marginBottom: 7,
    fontWeight: "600",
  },
  helperText: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontSize: SIZES.body3,
  },
  scroll: {
    flexDirection: "row",
  },
  addImageButton: {
    width: 100,
    height: 100,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addImageText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: "600",
  },
  imageContainer: {
    position: "relative",
    marginRight: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
  },
});
