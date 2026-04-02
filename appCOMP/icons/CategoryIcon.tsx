import React from "react";
import { Image } from "react-native";

export const CATEGORY_IMAGE_MAP: Record<string, any> = {
  Plomería: require("@/appASSETS/category-icons/nexofix_plomeria_64px.png"),
  Electricidad: require("@/appASSETS/category-icons/nexofix_electricidad_64px.png"),
  "Gasista Matriculado": require("@/appASSETS/category-icons/nexofix_gasista_64px.png"),
  Cerrajería: require("@/appASSETS/category-icons/nexofix_cerrajeria_64px.png"),
  Limpieza: require("@/appASSETS/category-icons/nexofix_limpieza_64px.png"),
  "Construcción / Albañilería": require("@/appASSETS/category-icons/nexofix_albanileria_64px.png"),
  Climatización: require("@/appASSETS/category-icons/nexofix_climatizacion_64px.png"),
  "Fletes y Mudanzas": require("@/appASSETS/category-icons/nexofix_fletes_64px.png"),
  "Vidrios en Altura": require("@/appASSETS/category-icons/nexofix_vidriero_64px.png"),
  "Paneles Solares": require("@/appASSETS/category-icons/nexofix_electricidad_64px.png"),
  "Organización de Espacios": require("@/appASSETS/category-icons/nexofix_fletes_64px.png"), // Fallback to fletes since no box icon
  Pintura: require("@/appASSETS/category-icons/nexofix_pintura_64px.png"),
  Jardinería: require("@/appASSETS/category-icons/nexofix_jardineria_64px.png"),
};

const FALLBACK_IMAGE = require("@/appASSETS/category-icons/nexofix_albanileria_64px.png");

interface CategoryIconProps {
  categoryName: string;
  size?: number;
  color?: string; // Kept for backwards compatibility but ignored
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ categoryName, size = 22 }) => {
  const imageSource = CATEGORY_IMAGE_MAP[categoryName] || FALLBACK_IMAGE;

  return (
    <Image source={imageSource} style={{ width: size, height: size, resizeMode: "contain" }} />
  );
};

export { CategoryIcon, FALLBACK_IMAGE };
export default CategoryIcon;
