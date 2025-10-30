import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";
import { View } from "react-native";

// app/index.tsx
export default function Index() {
  // Pantalla “vacía” para el root (‘/’) mientras el guard decide.
  // Sin spinner para no confundir con el splash real.
  return <View />;
}