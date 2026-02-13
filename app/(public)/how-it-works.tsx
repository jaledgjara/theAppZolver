import React from "react";
import { View, Text, StyleSheet, Platform, Dimensions } from "react-native";
import {
  Ionicons,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { COLORS, SIZES } from "@/appASSETS/theme";

// ─── 1. DATA LAYER (Contenido Estático) ───

const STEPS_DATA = [
  {
    id: "1",
    title: "Crea tu cuenta gratis",
    description:
      "Descarga la App o regístrate en la web en segundos. Solo necesitas tu email y teléfono.",
    icon: "person-add-outline" as const,
  },
  {
    id: "2",
    title: "Elige tu modalidad",
    description:
      "Define si necesitas alguien ¡YA! o si prefieres comparar precios para un proyecto grande.",
    icon: "options-outline" as const,
  },
  {
    id: "3",
    title: "Paga Seguro",
    description:
      "Tu dinero se retiene en nuestra garantía y solo se libera cuando el trabajo está terminado.",
    icon: "shield-checkmark-outline" as const,
  },
];

const MODELS_DATA = [
  {
    id: "zolver-ya",
    title: "Zolver Ya",
    subtitle: "Inmediato • Precio por Hora • Estandarizado",
    icon: "flash",
    iconLib: "Ionicons",
    color: COLORS.primary,
    features: [
      "Ideal para urgencias o limpieza.",
      "Precio pre-establecido por hora.",
      "Asignación automática del profesional más cercano.",
      "Sin negociaciones, contratación directa.",
    ],
    idealFor: "Limpieza, reparaciones simples, urgencias.",
  },
  {
    id: "presupuesto",
    title: "Presupuesto",
    subtitle: "A Medida • Comparativa • Proyectos",
    icon: "file-document-edit-outline",
    iconLib: "MaterialCommunityIcons",
    color: `${COLORS.tertiary}`,
    features: [
      "Ideal para reformas, pintura o arreglos complejos.",
      "Tú describes el problema (fotos/mensaje).",
      "Recibes múltiples ofertas de distintos profesionales.",
      "Chatea, compara perfiles y elige el precio.",
    ],
    idealFor: "Reformas, pintura, instalaciones complejas.",
  },
];

// ─── 2. UI COMPONENTS (Atomos y Moléculas) ───

/**
 * StepItem: Tarjeta minimalista para los pasos de registro
 */
function StepItem({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: any;
}) {
  return (
    <View style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={24} color={COLORS.primary} />
        </View>
        <Text style={styles.stepNumber}>0{number}</Text>
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDesc}>{description}</Text>
    </View>
  );
}

/**
 * ModelCard: Tarjeta robusta para comparar los modelos de negocio
 */
function ModelCard({ data }: { data: (typeof MODELS_DATA)[0] }) {
  const isMobile =
    Platform.OS !== "web" || Dimensions.get("window").width < 768;

  return (
    <View style={[styles.modelCard, { borderTopColor: data.color }]}>
      {/* Header del Modelo */}
      <View style={styles.modelHeader}>
        <View style={[styles.modelIconBox, { backgroundColor: data.color }]}>
          {data.iconLib === "Ionicons" ? (
            <Ionicons name={data.icon as any} size={32} color="#fff" />
          ) : (
            <MaterialCommunityIcons
              name={data.icon as any}
              size={32}
              color="#fff"
            />
          )}
        </View>
        <View>
          <Text style={styles.modelTitle}>{data.title}</Text>
          <Text style={[styles.modelSubtitle, { color: data.color }]}>
            {data.subtitle}
          </Text>
        </View>
      </View>

      {/* Lista de Características */}
      <View style={styles.featureList}>
        {data.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={data.color} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Footer "Ideal Para" */}
      <View style={[styles.idealBox, { backgroundColor: `${data.color}10` }]}>
        <Text style={[styles.idealLabel, { color: data.color }]}>
          MEJOR PARA:
        </Text>
        <Text style={styles.idealText}>{data.idealFor}</Text>
      </View>
    </View>
  );
}

// ─── 3. PAGE COMPONENT (Layout Principal) ───

export default function HowItWorksPage() {
  return (
    <View style={styles.container}>
      {/* SECTION 1: THE SOLUTION (Intro) */}
      <View style={styles.heroSection}>
        <Text style={styles.tagline}>UNA PLATAFORMA, TODAS LAS SOLUCIONES</Text>
        <Text style={styles.heroTitle}>Tú tienes el control.</Text>
        <Text style={styles.heroDescription}>
          Zolver elimina la fricción de contratar servicios. Ya sea que
          necesites una solución inmediata o planificar un proyecto grande,
          nuestra tecnología se adapta a ti.
        </Text>
      </View>

      {/* SECTION 2: REGISTRATION STEPS */}
      <View style={styles.stepsSection}>
        <Text style={styles.sectionHeader}>Comenzar es simple</Text>
        <View style={styles.stepsGrid}>
          {STEPS_DATA.map((step, index) => (
            <StepItem
              key={step.id}
              number={(index + 1).toString()}
              title={step.title}
              description={step.description}
              icon={step.icon}
            />
          ))}
        </View>
      </View>

      {/* SECTION 3: THE BATTLE (Zolver Ya vs Presupuesto) */}
      <View style={styles.modelsSection}>
        <Text style={styles.sectionHeader}>Elige cómo contratar</Text>
        <Text style={styles.sectionSubHeader}>
          Dos modalidades diseñadas para diferentes necesidades.
        </Text>

        <View style={styles.modelsGrid}>
          {MODELS_DATA.map((model) => (
            <ModelCard key={model.id} data={model} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── STYLES ───

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 100,
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
  },

  // ─── HERO SECTION ───
  heroSection: {
    paddingVertical: 80,
    paddingHorizontal: SIZES.padding,
    alignItems: "center",
    textAlign: "center",
  },
  tagline: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 16,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 56,
    fontWeight: "600",
    color: COLORS.textPrimary,
    lineHeight: 64,
    marginBottom: 24,
    textAlign: "center",
  },
  heroDescription: {
    fontSize: 20,
    color: COLORS.textSecondary,
    maxWidth: 700,
    textAlign: "center",
    lineHeight: 32,
  },

  // ─── SECTION HEADERS ───
  sectionHeader: {
    fontSize: 32,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  sectionSubHeader: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 48,
    textAlign: "center",
  },

  // ─── STEPS SECTION ───
  stepsSection: {
    paddingVertical: 60,
    paddingHorizontal: SIZES.padding,
    alignItems: "center",
  },
  stepsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 30,
    width: "100%",
  },
  stepCard: {
    width:
      Platform.OS === "web" && Dimensions.get("window").width > 768
        ? "30%"
        : "100%",
    minWidth: 280,
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${COLORS.primary}15`, // Opacidad baja
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumber: {
    fontSize: 40,
    fontWeight: "900",
    color: "#eee", // Número de fondo sutil
    position: "absolute",
    right: 0,
    top: -10,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  stepDesc: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },

  // ─── MODELS SECTION ───
  modelsSection: {
    paddingVertical: 80,
    paddingHorizontal: SIZES.padding,
    backgroundColor: "#FAFAFA", // Fondo sutil para diferenciar sección
    borderRadius: 30,
    marginTop: 40,
  },
  modelsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 40,
    width: "100%",
  },
  modelCard: {
    width:
      Platform.OS === "web" && Dimensions.get("window").width > 768
        ? "45%"
        : "100%",
    minWidth: 320,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    borderTopWidth: 6, // Línea de color superior
  },
  modelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    gap: 20,
  },
  modelIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  modelTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  modelSubtitle: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 4,
  },
  featureList: {
    marginBottom: 32,
    gap: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: "#555",
    flex: 1,
    lineHeight: 24,
  },
  idealBox: {
    padding: 16,
    borderRadius: 12,
  },
  idealLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  idealText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
});
