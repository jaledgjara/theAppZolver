import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, FONTS, SIZES } from "@/appASSETS/theme";

// --- 1. TARJETA DE ENCABEZADO (Perfil, Foto, Stats) ---
export const ProfileHeaderCard = ({ profile }: { profile: any }) => (
  <View style={styles.card}>
    <View style={styles.avatarContainer}>
      <Image
        source={{ uri: profile.avatar || "https://via.placeholder.com/150" }}
        style={styles.avatar}
      />
    </View>
    <Text style={styles.name}>{profile.legal_name}</Text>
    <Text style={styles.category}>
      {profile.specialty || "Profesional Zolver"}
    </Text>
    <View style={styles.locationRow}>
      <Ionicons name="location-sharp" size={16} color={COLORS.textSecondary} />
      <Text style={styles.locationText}>Mendoza, Argentina</Text>
    </View>
    <View style={styles.ratingRow}>
      <Ionicons name="star" size={18} color="#4CAF50" />
      <Text style={styles.ratingValue}>{profile.rating.toFixed(1)}</Text>
      <Text style={styles.ratingCount}>
        ({profile.reviews_count || 0} reseñas)
      </Text>
    </View>
    Stats Row
    {/* <View style={styles.statsContainer}>
      <View style={styles.statBox}>
        <Ionicons name="ribbon-outline" size={20} color={COLORS.tertiary} />
        <Text style={styles.statLabel}>Experiencia</Text>
        <Text style={styles.statValue}>5+ Años</Text>
      </View>
      <View style={styles.dividerVertical} />
      <View style={styles.statBox}>
        <Ionicons name="people-outline" size={20} color={COLORS.tertiary} />
        <Text style={styles.statLabel}>Clientes</Text>
        <Text style={styles.statValue}>120+</Text>
      </View>
      <View style={styles.dividerVertical} />
      <View style={styles.statBox}>
        <Ionicons
          name="checkmark-done-circle-outline"
          size={20}
          color={COLORS.tertiary}
        />
        <Text style={styles.statLabel}>Trabajos</Text>
        <Text style={styles.statValue}>300+</Text>
      </View>
    </View> */}
  </View>
);

// --- 2. TARJETA DE TEXTO SIMPLE (Sobre mí) ---
export const AboutCard = ({ text }: { text: string }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>Sobre mí</Text>
    <Text style={styles.bodyText}>{text}</Text>
  </View>
);

// --- 3. TARJETA DE LISTA CON ICONOS (Certificaciones / Logros) ---
export const FeatureListCard = ({
  title,
  items,
}: {
  title: string;
  items: string[];
}) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {items.map((item, index) => (
      <View key={index} style={styles.featureRow}>
        <Ionicons
          name="checkmark-circle-outline"
          size={22}
          color={COLORS.success}
        />
        <Text style={styles.featureText}>{item}</Text>
      </View>
    ))}
  </View>
);

// --- 4. TARJETA DE DISPONIBILIDAD (Estilo Calendario) ---
export const AvailabilityCard = () => (
  <View style={styles.card}>
    <View
      style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}>
      <Text style={[styles.cardTitle, { marginTop: 0, marginLeft: 8 }]}>
        Disponibilidad
      </Text>
    </View>

    <View style={styles.timeSlot}>
      <Ionicons name="calendar-outline" size={18} color="#555" />
      <Text style={styles.timeText}>Lunes a Viernes: 09:00 - 18:00</Text>
    </View>

    <View style={styles.timeSlot}>
      <Ionicons name="calendar-outline" size={18} color="#555" />
      <Text style={styles.timeText}>Sábados: 10:00 - 14:00</Text>
    </View>

    {/* <View style={styles.responseBanner}>
      <Text style={styles.responseText}>
        Tiempo de respuesta promedio:{" "}
        <Text style={{ fontWeight: "bold" }}>1 hora</Text>
      </Text>
    </View> */}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 25,
    marginBottom: 16,
    // Sombra suave estilo iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: 10,
  },
  // Header Styles
  avatarContainer: { alignItems: "center", marginTop: -10, marginBottom: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  category: { fontSize: 16, textAlign: "center", color: "#666", marginTop: 4 },
  locationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  locationText: { color: COLORS.textSecondary, marginLeft: 4, fontSize: 14 },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 6,
  },
  ratingCount: { fontSize: 14, color: "#888", marginLeft: 4 },

  // Stats
  statsContainer: {
    flexDirection: "row",
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  statBox: { flex: 1, alignItems: "center" },
  dividerVertical: { width: 1, height: "80%", backgroundColor: "#E0E0E0" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 4 },
  statValue: { fontSize: 14, fontWeight: "bold", color: "#333", marginTop: 2 },

  // Generic
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  bodyText: { fontSize: 15, color: "#555", lineHeight: 22 },

  // Feature List
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  featureText: { marginLeft: 12, fontSize: 15, color: "#444" },

  // Availability
  timeSlot: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  timeText: { marginLeft: 10, color: "#333", fontWeight: "500" },
  responseBanner: {
    marginTop: 8,
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  responseText: { color: "#2E7D32", fontSize: 14 },
});
