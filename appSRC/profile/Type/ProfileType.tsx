import { Ionicons } from "@expo/vector-icons";
import { Href } from "expo-router";

export interface MenuItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap; // Valida que el icono exista
  title: string;
  subtitle: string;
  route: Href<string>; // Valida que la ruta exista en expo-router
  isDestructive?: boolean; // Útil para pintar de rojo "Cerrar sesión" si se requiere
}
