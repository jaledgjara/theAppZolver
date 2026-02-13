import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { Link } from "expo-router";
import { COLORS, SIZES } from "@/appASSETS/theme";
import InfoCard from "@/appCOMP/website/InfoCard";

// Definición de constantes para layout web
const WEB_MAX_WIDTH = 1200;
const isWeb = Platform.OS === "web";

/**
 * LandingPage Professional Design
 * Nota: Navbar y Footer son manejados por app/(public)/_layout.tsx
 */
export default function LandingPage() {
  return (
    <View style={styles.container}>
      {/* ─── 1. HERO SECTION (CENTERED) ─── */}
      <View style={styles.heroSection}>
        <View style={styles.heroContainer}>
          <View style={styles.heroTextColumn}>
            <Text style={styles.heroTitle}>
              Soluciones expertas para tu hogar, al instante.
            </Text>
            <Text style={styles.heroSubtitle}>
              Conectamos tu necesidad con profesionales verificados. Garantía,
              seguridad y rapidez en una sola plataforma.
            </Text>

            <View style={styles.heroButtons}>
              <Link href="/(auth)/SignInScreen" asChild>
                <Pressable style={styles.ctaPrimary}>
                  <Text style={styles.ctaPrimaryText}>Solicitar Servicio</Text>
                </Pressable>
              </Link>
              <Link href="/(auth)/SignInScreen" asChild>
                <Pressable style={styles.ctaSecondary}>
                  <Text style={styles.ctaSecondaryText}>Soy Profesional</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </View>

      {/* ─── 2. VALUE PROPOSITION ─── */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionHeader}>¿Por qué elegir Zolver?</Text>

        <View style={styles.gridContainer}>
          <InfoCard
            iconName="shield-checkmark-outline"
            title="Profesionales Verificados"
            description="Cada Zolver pasa por un riguroso proceso de validación de identidad y antecedentes."
          />
          <InfoCard
            iconName="card-outline"
            title="Pagos Seguros"
            description="Tu dinero está protegido hasta que el servicio se complete satisfactoriamente."
          />
          <InfoCard
            iconName="flash-outline"
            title="Respuesta Inmediata"
            description="Nuestro algoritmo encuentra al profesional disponible más cercano en segundos."
          />
        </View>
      </View>
    </View>
  );
}

// ─── STYLES ───

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    // Sin ScrollView, sin Padding superior (lo maneja el layout)
  },

  // ─── HERO SECTION ───
  heroSection: {
    backgroundColor: COLORS.backgroundLight || "#f8f9fa",
    width: "100%",
    alignItems: "center",
    paddingVertical: 100, // Espaciado vertical generoso
    paddingHorizontal: SIZES.padding,
  },
  heroContainer: {
    flexDirection: "column", // Siempre columna para centrado
    maxWidth: 800, // Ancho reducido para lectura centrada
    width: "100%",
    alignItems: "center", // Centrado horizontal
  },
  heroTextColumn: {
    alignItems: "center", // Centra el contenido interno (Badge, Textos, Botones)
    width: "100%",
  },
  badgeContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: isWeb ? 56 : 36,
    fontWeight: "600",
    color: COLORS.textPrimary,
    lineHeight: isWeb ? 64 : 42,
    marginBottom: 24,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 40,
    lineHeight: 28,
    maxWidth: 600,
    textAlign: "center", // Texto centrado
  },
  heroButtons: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
    justifyContent: "center", // Botones centrados
  },
  ctaPrimary: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: SIZES.radius,
    elevation: 2,
  },
  ctaPrimaryText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  ctaSecondary: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: SIZES.radius,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  ctaSecondaryText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 16,
  },

  // ─── FEATURES GRID ───
  featuresSection: {
    paddingVertical: 80,
    paddingHorizontal: SIZES.padding,
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  sectionHeader: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 40,
    textAlign: "center",
  },
  gridContainer: {
    flexDirection: isWeb ? "row" : "column",
    maxWidth: WEB_MAX_WIDTH,
    width: "100%",
    gap: 30,
    justifyContent: "space-between",
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    alignItems: "center", // Centra contenido de tarjeta
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    minWidth: 280,
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 20,
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
