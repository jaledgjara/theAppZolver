// app/_layout.tsx
import { Stack } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import useAuthGuard from "@/appSRC/auth/Hooks/useAuthGuard";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";

export default function RootLayout() {
  const { isBootLoading } = useAuthStore();
  useAuthGuard();

  if (isBootLoading) {
    return <MiniLoaderScreen />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
