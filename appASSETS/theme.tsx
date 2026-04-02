// ─────────────────────────────────────────────────────────────────────────────
// NexoFix Design System — v2.0
// Fuente: Plus Jakarta Sans (instalar @expo-google-fonts/plus-jakarta-sans
//         y cargar en app/_layout.tsx con useFonts)
// ─────────────────────────────────────────────────────────────────────────────

// ─── COLORES ─────────────────────────────────────────────────────────────────
export const COLORS = {
  // Brand (verde como color dominante)
  primary: "#1A5C4A", // brand-deep — CTAs, headers, nav activa
  brandDeep: "#1A5C4A", // alias explícito
  brandMid: "#4A9180", // acciones secundarias, borders activos
  brandLight: "#C8DBD6", // fondos de cards, chips inactivos
  tertiary: "#4A9180", // alias legado → brandMid

  // Acento (amarillo — escaso y poderoso)
  accent: "#F5B800", // ratings, precios, highlights
  accentLight: "#FFF3C4", // fondos de accent chips
  primary_old: "#FFC107", // referencia legada (no usar en código nuevo)

  // Fondos
  backgroundLight: "#F7F9F8", // fondo general de pantallas
  backgroundInput: "#FFFFFF", // fondo de inputs (blanco sobre gris de app)
  bgCard: "#FFFFFF", // cards, modales
  bgSecondary: "#EEF4F2", // fondos secundarios, skeletons
  primaryBackground: "#EEF4F2", // alias legado → bgSecondary
  white: "#FFFFFF",

  // Texto
  textPrimary: "#0F2E25", // texto principal
  textSecondary: "#3D5A52", // texto de apoyo
  textTertiary: "#7A9990", // placeholders, labels, metadata
  textOnPrimary: "#FFFFFF", // texto sobre fondos de color

  // Bordes
  border: "#D9E8E4", // bordes de inputs, divisores
  borderStrong: "#B2CECA", // bordes con mayor énfasis

  // Estado
  success: "#2E7D5E",
  error: "#C0392B",
  warning: "#F5B800", // mismo que accent
};

// ─── SOMBRAS ─────────────────────────────────────────────────────────────────
// Sombras basadas en el color brand (no negro) para coherencia de marca
export const SHADOWS = {
  card: {
    shadowColor: "#1A5C4A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  float: {
    shadowColor: "#1A5C4A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  modal: {
    shadowColor: "#0F2E25",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 48,
    elevation: 16,
  },
};

// ─── BORDER RADIUS ───────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 8, // inputs, chips pequeños
  md: 12, // cards, botones, search bar
  lg: 16, // cards grandes, icon-cards
  xl: 24, // modales, bottom sheets
  pill: 999, // badges, tags de estado
};

// ─── TAMAÑOS ─────────────────────────────────────────────────────────────────
export const SIZES = {
  // Escala de espaciado 4pt
  base: 4,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Legado (para no romper código existente)
  font: 14,
  radius: 12,
  padding: 20,

  // Tamaños de fuente legacy
  h1: 22,
  h2: 18,
  h3: 15,
  h4: 14,
  body1: 28,
  body2: 20,
  body3: 16,
  body4: 14,
};

// ─── TIPOGRAFÍA ──────────────────────────────────────────────────────────────
// Fuente: Plus Jakarta Sans
// Instalar: npx expo install @expo-google-fonts/plus-jakarta-sans expo-font
// Cargar en app/_layout.tsx con useFonts({
//   PlusJakartaSans_400Regular, PlusJakartaSans_500Medium,
//   PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
//   PlusJakartaSans_800ExtraBold,
// })
export const FONTS = {
  // Escala nueva
  display: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 22,
    lineHeight: 28,
  },
  h2: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    lineHeight: 24,
  },
  h3: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 15,
    lineHeight: 20,
  },
  body: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  micro: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 9,
    lineHeight: 12,
  },

  // Aliases legados (mapean a la escala nueva)
  h4: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
  },
  body1: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 28,
    lineHeight: 34,
  },
  body2: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 20,
    lineHeight: 28,
  },
  body3: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 16,
    lineHeight: 22,
  },
  body4: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
};

const appTheme = { COLORS, SIZES, FONTS, SHADOWS, RADIUS };

export default appTheme;
