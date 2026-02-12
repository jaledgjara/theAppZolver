import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from "react-native";
import { Link } from "expo-router";
import { COLORS, SIZES } from "@/appASSETS/theme";

/**
 * LandingPage — The public-facing home page for the web.
 * Shows hero section, features, and a CTA to download/sign up.
 */
export default function LandingPage() {
  console.log("🏠 [LandingPage] RENDER — Landing page is mounting!");

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {/* ─── Hero Section ─── */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            Encuentra al profesional perfecto para tu hogar
          </Text>
          <Text style={styles.heroSubtitle}>
            Zolver conecta clientes con profesionales verificados de confianza.
            Solicita presupuestos, agenda servicios y paga de forma segura.
          </Text>
          <View style={styles.heroCta}>
            <Link href="/(auth)/SignInScreen" asChild>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Comenzar ahora</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>

      {/* ─── Features Section ─── */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>¿Cómo funciona?</Text>

        <View style={styles.featuresGrid}>
          <FeatureCard
            step="1"
            title="Publica tu solicitud"
            description="Describe el servicio que necesitas y recibe presupuestos de profesionales cercanos."
          />
          <FeatureCard
            step="2"
            title="Compara y elige"
            description="Revisa perfiles, valoraciones y presupuestos para elegir al mejor profesional."
          />
          <FeatureCard
            step="3"
            title="Paga seguro"
            description="Realiza el pago de forma segura a través de la plataforma. Sin sorpresas."
          />
        </View>
      </View>

      {/* ─── CTA Section ─── */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaSectionTitle}>
          ¿Eres profesional? Únete a Zolver
        </Text>
        <Text style={styles.ctaSectionSubtitle}>
          Amplía tu cartera de clientes y gestiona tus trabajos desde una sola
          aplicación.
        </Text>
        <Link href="/(auth)/SignInScreen" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Registrarme como profesional</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

/** Reusable feature card */
function FeatureCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureStep}>
        <Text style={styles.featureStepText}>{step}</Text>
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // ─── Hero ───
  hero: {
    backgroundColor: COLORS.backgroundLight,
    paddingVertical: 80,
    paddingHorizontal: SIZES.padding,
    alignItems: "center",
  },
  heroContent: {
    maxWidth: 720,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: Platform.OS === "web" ? 48 : SIZES.h1,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: SIZES.body3,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 32,
  },
  heroCta: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
  },
  primaryButtonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: SIZES.body3,
  },
  // ─── Features ───
  featuresSection: {
    paddingVertical: 64,
    paddingHorizontal: SIZES.padding,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: SIZES.h2,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 40,
    textAlign: "center",
  },
  featuresGrid: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    gap: 24,
    maxWidth: 1000,
    width: "100%",
    justifyContent: "center",
  },
  featureCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: SIZES.radius,
    padding: 24,
    alignItems: "center",
    minWidth: 240,
  },
  featureStep: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  featureStepText: {
    fontSize: SIZES.h3,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  featureTitle: {
    fontSize: SIZES.h3,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  featureDescription: {
    fontSize: SIZES.body4,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  // ─── CTA Section ───
  ctaSection: {
    backgroundColor: COLORS.tertiary,
    paddingVertical: 64,
    paddingHorizontal: SIZES.padding,
    alignItems: "center",
  },
  ctaSectionTitle: {
    fontSize: SIZES.h2,
    fontWeight: "700",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 12,
  },
  ctaSectionSubtitle: {
    fontSize: SIZES.body3,
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.9,
    maxWidth: 560,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
  },
  secondaryButtonText: {
    color: COLORS.tertiary,
    fontWeight: "700",
    fontSize: SIZES.body3,
  },
});
