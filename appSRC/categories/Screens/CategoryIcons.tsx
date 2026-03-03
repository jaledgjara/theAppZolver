import React from "react";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";

/**
 * Mapea el 'icon_slug' de la base de datos a un Icono Vectorial.
 * @param slug - El string que viene de la columna 'icon_slug' en Supabase
 * @param size - Tamaño del icono (default: 35)
 * @param color - Color del icono (default: Primary)
 */
export const getCategoryVectorIcon = (
  slug: string | null,
  size: number = 35,
  color: string = COLORS.primary
): React.ReactNode => {
  const safeSlug = slug?.toLowerCase().trim() ?? "default";

  switch (safeSlug) {
    // Plomería
    case "wrench":
    case "water":
    case "plomeria":
      return <FontAwesome6 name="faucet-drip" size={size} color={color} />;

    // Electricidad
    case "zap":
    case "flash":
    case "electricista":
      return <FontAwesome6 name="bolt" size={size} color={color} />;

    // Gasista
    case "flame":
    case "gasista":
      return <FontAwesome6 name="fire-burner" size={size} color={color} />;

    // Cerrajería
    case "key":
    case "cerrajeria":
      return <FontAwesome6 name="key" size={size} color={color} />;

    // Limpieza
    case "broom":
    case "sparkles":
    case "limpieza":
      return <FontAwesome6 name="broom" size={size} color={color} />;

    // Construcción / Albañilería
    case "hammer":
    case "construct":
    case "albañil":
      return <FontAwesome6 name="hammer" size={size} color={color} />;

    // Climatización
    case "snowflake":
      return <FontAwesome6 name="snowflake" size={size} color={color} />;

    // Fletes y Mudanzas
    case "truck":
    case "bus":
    case "fletes":
      return <FontAwesome6 name="truck-fast" size={size} color={color} />;

    // Vidrios en Altura
    case "window":
      return <FontAwesome6 name="window-maximize" size={size} color={color} />;

    // Paneles Solares
    case "sun":
      return <FontAwesome6 name="solar-panel" size={size} color={color} />;

    // Organización de Espacios
    case "package":
      return <FontAwesome6 name="boxes-stacked" size={size} color={color} />;

    // Pintor
    case "color-palette":
    case "pintor":
      return <Ionicons name="color-palette" size={size} color={color} />;

    // Jardinero
    case "leaf":
    case "jardinero":
      return <FontAwesome6 name="plant-wilt" size={size} color={color} />;

    default:
      return <Ionicons name="briefcase" size={size} color={color} />;
  }
};
