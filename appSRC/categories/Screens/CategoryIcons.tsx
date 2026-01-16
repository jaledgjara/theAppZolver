import React from "react";
// Asegúrate de tener instalados estos paquetes o cambia FontAwesome6 por FontAwesome5 si da error
import { FontAwesome6, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";

/**
 * Mapea el 'icon_slug' de la base de datos a un Icono Vectorial.
 * * @param slug - El string que viene de la columna 'icon_slug' en Supabase (ej: 'key', 'sparkles')
 * @param size - Tamaño del icono (default: 35)
 * @param color - Color del icono (default: Primary)
 */
// appSRC/utils/getCategoryVectorIcon.tsx

export const getCategoryVectorIcon = (
  slug: string | null,
  size: number = 35,
  color: string = COLORS.primary
): React.ReactNode => {
  const safeSlug = slug?.toLowerCase().trim() ?? "default";

  switch (safeSlug) {
    case "sparkles":
    case "limpieza":
    case "cleaning": // 👈 Agregado fallback técnico
      return <FontAwesome6 name="broom" size={size} color={color} />;

    case "key":
    case "cerrajeria":
    case "locksmith": // 👈 Agregado fallback técnico
      return <FontAwesome6 name="key" size={size} color={color} />;

    case "color-palette":
    case "pintor":
    case "painting":
      return <Ionicons name="color-palette" size={size} color={color} />;

    case "leaf":
    case "jardinero":
    case "gardening":
      return <FontAwesome6 name="plant-wilt" size={size} color={color} />;

    case "flame":
    case "gasista":
    case "gas":
      return <FontAwesome6 name="fire-burner" size={size} color={color} />;

    case "bus":
    case "fletes":
    case "freight":
      return <FontAwesome6 name="truck-fast" size={size} color={color} />;

    case "flash":
    case "electricista":
    case "electrical":
      return <FontAwesome6 name="bolt" size={size} color={color} />;

    case "water":
    case "plomeria":
    case "plumbing":
      return <FontAwesome6 name="faucet-drip" size={size} color={color} />;

    case "construct":
    case "albañil":
    case "masonry":
      return <FontAwesome6 name="trowel" size={size} color={color} />;

    default:
      return <Ionicons name="briefcase" size={size} color={color} />;
  }
};
