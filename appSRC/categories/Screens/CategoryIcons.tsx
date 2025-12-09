import { FontAwesome6, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";
import React from "react";

export const getCategoryVectorIcon = (
  slug: string | null,
  size: number = 35,
  color: string = COLORS.primary
): React.ReactNode => {
  // 1. Normalización: Convertir a minúsculas y quitar espacios para evitar errores humanos
  const safeSlug = slug?.toLowerCase().trim() ?? "default";

  // 2. Mapeo: El 'case' debe coincidir con la columna 'icon_slug' de Supabase
  switch (safeSlug) {
    // --- LIMPIEZA ---
    // DB Slug: "sparkles"
    case "sparkles":
    case "limpieza":
      return <FontAwesome6 name="broom" size={size} color={color} />;

    // --- CERRAJERÍA ---
    // DB Slug: "key"
    case "key":
      return <FontAwesome6 name="key" size={size} color={color} />;

    // --- PINTOR ---
    // DB Slug: "color-palette"
    case "color-palette":
    case "pintor":
      return <Ionicons name="color-palette" size={size} color={color} />;

    // --- JARDINERO ---
    // DB Slug: "leaf"
    case "leaf":
    case "jardinero":
      return <FontAwesome6 name="plant-wilt" size={size} color={color} />;

    // --- GASISTA ---
    // DB Slug: "flame"
    case "flame":
    case "gasista":
      return <FontAwesome6 name="fire-burner" size={size} color={color} />;

    // --- FLETES ---
    // DB Slug: "bus" (Aunque en DB dice bus, renderizamos un camión para mejor UX)
    case "bus":
    case "fletes":
      return <FontAwesome6 name="truck-fast" size={size} color={color} />;

    // --- ELECTRICISTA ---
    // DB Slug: "flash"
    case "flash":
    case "electricista":
      return <FontAwesome6 name="bolt" size={size} color={color} />;

    // --- PLOMERIA ---
    // DB Slug: "water"
    case "water":
    case "plomeria":
      return <FontAwesome6 name="faucet-drip" size={size} color={color} />;

    // --- ALBAÑIL ---
    // DB Slug: "construct"
    case "construct":
    case "albañil":
      return <FontAwesome6 name="trowel" size={size} color={color} />;

    // --- REFRIGERACIÓN ---
    // DB Slug: "snow"
    case "snow":
    case "refrigeración":
      return <FontAwesome6 name="snowflake" size={size} color={color} />;

    // --- TECNICO PC (Ejemplo futuro) ---
    case "computer":
      return <MaterialIcons name="computer" size={size} color={color} />;

    // --- DEFAULT (Fallback) ---
    default:
      console.warn(
        `⚠️ Icono no encontrado para slug: "${safeSlug}". Usando default.`
      );
      return <Ionicons name="briefcase" size={size} color={color} />;
  }
};
