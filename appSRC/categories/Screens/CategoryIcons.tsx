import React from "react";
import {
  FontAwesome6,
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { COLORS } from "@/appASSETS/theme";

export const getCategoryVectorIcon = (
  slug: string | null,
  size: number = 35,
  color: string = COLORS.primary
): React.ReactNode => {
  // Normalizamos el slug
  const safeSlug = slug?.toLowerCase().trim() ?? "default";

  switch (safeSlug) {
    // --- Oficios Principales ---
    case "pintor":
    case "paint-roller":
      return <FontAwesome6 name="paint-roller" size={size} color={color} />;

    case "gasista":
    case "fire":
      return <FontAwesome6 name="fire-burner" size={size} color={color} />;

    case "electricista":
    case "bolt":
      return <FontAwesome6 name="bolt" size={size} color={color} />;

    case "plomero":
    case "faucet":
      return <FontAwesome6 name="faucet-drip" size={size} color={color} />;

    case "albañil":
    case "trowel":
      return <FontAwesome6 name="trowel" size={size} color={color} />;

    case "carpintero":
      return <FontAwesome6 name="hammer" size={size} color={color} />;

    case "limpieza":
    case "broom":
      return <FontAwesome6 name="broom" size={size} color={color} />;

    case "jardinero":
    case "plant":
      return <FontAwesome6 name="plant-wilt" size={size} color={color} />;

    case "aire-acondicionado":
      return <FontAwesome6 name="snowflake" size={size} color={color} />;

    case "flete":
    case "truck":
      return <FontAwesome6 name="truck-fast" size={size} color={color} />;

    case "tecnico-pc":
    case "computer":
      return <MaterialIcons name="computer" size={size} color={color} />;

    // --- Fallback por defecto ---
    default:
      // Un maletín genérico si no encontramos el icono específico
      return <Ionicons name="briefcase" size={size} color={color} />;
  }
};
