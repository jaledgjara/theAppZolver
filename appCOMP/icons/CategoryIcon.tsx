import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const CATEGORY_ICON_MAP: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  "Plomería": "pipe-wrench",
  "Electricidad": "flash",
  "Gasista Matriculado": "fire",
  "Cerrajería": "key-variant",
  "Limpieza": "broom",
  "Construcción / Albañilería": "hammer",
  "Climatización": "snowflake",
  "Fletes y Mudanzas": "truck-outline",
  "Vidrios en Altura": "window-open-variant",
  "Paneles Solares": "solar-panel",
  "Organización de Espacios": "package-variant-closed",
};

const FALLBACK_ICON: keyof typeof MaterialCommunityIcons.glyphMap = "tools";

interface CategoryIconProps {
  categoryName: string;
  size?: number;
  color?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoryName,
  size = 22,
  color = "#555",
}) => {
  const iconName = CATEGORY_ICON_MAP[categoryName] ?? FALLBACK_ICON;

  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
};

export { CategoryIcon, CATEGORY_ICON_MAP, FALLBACK_ICON };
export default CategoryIcon;
