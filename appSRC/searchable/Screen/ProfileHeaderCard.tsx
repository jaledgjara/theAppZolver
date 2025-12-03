import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES, FONTS } from "@/appASSETS/theme";

// --- 1. Header Card (Avatar + Info Principal) ---
export const ProfileHeaderCard = ({ profile }: { profile: any }) => {
  if (!profile) return null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image
          source={{
            uri: profile.doc_front_url || "https://via.placeholder.com/150",
          }}
          style={styles.avatar}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{profile.legal_name}</Text>
          <Text style={styles.specialty}>{profile.specialization_title}</Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={COLORS.primary} />
            <Text style={styles.rating}>{profile.rating}</Text>
            <Text style={styles.reviews}>
              ({profile.reviews_count} reseñas)
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// --- 2. Availability Card (Disponibilidad) ---
export const AvailabilityCard = () => (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>Disponibilidad</Text>
    <View style={styles.badge}>
      <Ionicons name="time-outline" size={18} color="#2E7D32" />
      <Text style={styles.badgeText}>Disponible hoy</Text>
    </View>
  </View>
);

// --- 3. About Card (Biografía) ---
export const AboutCard = ({ text }: { text: string | null }) => (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>Sobre mí</Text>
    <Text style={styles.bodyText}>{text || "Sin descripción disponible."}</Text>
  </View>
);

// --- 4. Feature List (Matrículas / Logros) ---
export const FeatureListCard = ({ items }: { items?: string[] }) => {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Credenciales</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.tertiary} />
          <Text style={styles.featureText}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    // Sombra suave
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#eee" },
  info: { marginLeft: 16, flex: 1 },
  name: { ...FONTS.h2, fontWeight: "bold", color: COLORS.textPrimary },
  specialty: { ...FONTS.body3, color: COLORS.textSecondary, marginBottom: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  rating: { fontWeight: "bold", marginLeft: 4, marginRight: 4 },
  reviews: { color: "#888", fontSize: 12 },
  sectionTitle: {
    ...FONTS.h3,
    fontWeight: "700",
    marginBottom: 8,
    color: "#333",
  },
  bodyText: { ...FONTS.body3, color: "#555", lineHeight: 22 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  badgeText: { color: "#2E7D32", fontWeight: "600", marginLeft: 6 },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  featureText: { marginLeft: 8, fontSize: 14, color: "#444" },
});
