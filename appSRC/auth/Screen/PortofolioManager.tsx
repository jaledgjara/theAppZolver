import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";

interface Props {
  images: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export const PortfolioManager: React.FC<Props> = ({
  images,
  onAdd,
  onRemove,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Mis Trabajos</Text>
        <Text style={styles.counter}>{images.length} fotos</Text>
      </View>

      <View style={styles.grid}>
        {/* Botón Agregar */}
        <TouchableOpacity style={styles.addButton} onPress={onAdd}>
          <View style={styles.iconCircle}>
            <Ionicons name="add" size={30} color={COLORS.primary} />
          </View>
          <Text style={styles.addText}>Subir Foto</Text>
        </TouchableOpacity>

        {/* Lista de Imágenes */}
        {images.map((uri, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemove(index)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  counter: { fontSize: 13, color: COLORS.textSecondary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#EEE",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  removeButton: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  addText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
});
