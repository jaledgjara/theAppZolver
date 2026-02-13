import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Librería estándar de iconos
import { COLORS, SIZES } from "@/appASSETS/theme";

interface InfoCardProps {
  title: string;
  description: string;
  /** Nombre del icono de la librería Ionicons */
  iconName: keyof typeof Ionicons.glyphMap;
}

export default function InfoCard({
  title,
  description,
  iconName,
}: InfoCardProps) {
  return (
    <View style={styles.card}>
      {/* Icono Vectorial */}
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={42} color={COLORS.primary} />
      </View>

      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    alignItems: "center",
    // Sombras suaves
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    minWidth: 280,
  },
  iconContainer: {
    marginBottom: 20,
    // Opcional: Fondo circular suave para el icono
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: COLORS.backgroundLight || "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  cardDesc: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
    textAlign: "center",
  },
});
