import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "@/appASSETS/theme";
import { getCategoryVectorIcon } from "@/appSRC/categories/Screens/CategoryIcons";
import { useServiceSelection } from "@/appSRC/categories/Hooks/useServiceCatalog";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";

// 1. IMPORTA TU LÓGICA DE NEGOCIO REAL
// Ajusta esta ruta a donde tengas tu hook 'useServiceSelection'

// ─── UTILITY LAYER (Iconos y Descripciones) ───

// Diccionario auxiliar para descripciones ricas en la web
// (Ya que es posible que tu BD solo tenga el nombre corto)
const WEB_DESCRIPTIONS: Record<string, string> = {
  limpieza:
    "Servicio integral de limpieza para hogares y oficinas. Personal de confianza.",
  electricista:
    "Instalaciones, reparaciones de cortocircuitos y mantenimiento certificado.",
  plomeria: "Solución a fugas, destape de cañerías e instalación de grifería.",
  gasista: "Instalaciones de gas y reparación de estufas por matriculados.",
  pintor: "Renovación de interiores y exteriores con acabados prolijos.",
  cerrajeria: "Apertura de puertas y cambio de cerraduras 24/7.",
  albañil: "Refacciones, construcción en seco y arreglos generales.",
  fletes: "Mudanzas rápidas y transporte seguro de objetos.",
  jardinero: "Paisajismo, poda y mantenimiento de espacios verdes.",
  default: "Profesionales verificados listos para ayudarte en tu hogar.",
};

// ─── UI COMPONENT: Service Card ───
function ServiceCard({ title, slug }: { title: string; slug: string }) {
  // Buscamos la descripción bonita o usamos una por defecto
  const description = WEB_DESCRIPTIONS[slug] || WEB_DESCRIPTIONS["default"];

  return (
    <View style={styles.card}>
      <View style={styles.iconWrapper}>
        {getCategoryVectorIcon(slug, 40, COLORS.primary)}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
    </View>
  );
}

// ─── PAGE COMPONENT ───
export default function ServicesPage() {
  // 2. USAMOS EL HOOK (Igual que en tu App Home)
  const { categories, loadingCategories, fetchCategories, error } =
    useServiceSelection();

  // 3. Efecto para cargar datos al montar la página web
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Catálogo de Servicios</Text>
        <Text style={styles.pageSubtitle}>
          Encuentra al profesional calificado ideal para cada necesidad de tu
          hogar.
        </Text>
      </View>

      {/* 4. ESTADOS DE CARGA Y ERROR */}
      {loadingCategories ? (
        <View style={styles.centerBox}>
          <MiniLoaderScreen />
          <Text style={{ marginTop: 10, color: "#888" }}>
            Cargando servicios...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Ionicons
            name="alert-circle-outline"
            size={50}
            color={COLORS.error || "red"}
          />
          <Text style={{ marginTop: 10, color: COLORS.textSecondary }}>
            No pudimos cargar los servicios.
          </Text>
        </View>
      ) : (
        /* 5. RENDERIZADO DINÁMICO (Mapeamos los datos reales) */
        <View style={styles.gridContainer}>
          {categories.map((item: any) => (
            <ServiceCard
              key={item.id}
              slug={item.icon_slug || item.slug} // Manejo seguro de la propiedad slug
              title={item.name}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── STYLES ───
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 80,
    paddingHorizontal: SIZES.padding,
    alignItems: "center",
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
  },
  centerBox: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 60,
    alignItems: "center",
    maxWidth: 800,
  },
  pageTitle: {
    fontSize: 56,
    fontWeight: "600",
    color: COLORS.textPrimary,
    lineHeight: 64,
    marginBottom: 24,
    textAlign: "center",
  },
  pageSubtitle: {
    fontSize: 20,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 30,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 30,
    width: "100%",
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 32,
    // Lógica Responsive: 3 columnas en escritorio, 1 en móvil
    width:
      Platform.OS === "web" && Dimensions.get("window").width > 768
        ? "30%"
        : "100%",
    minWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    alignItems: "flex-start",
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundLight || "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  cardContent: {
    width: "100%",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 26,
  },
});
