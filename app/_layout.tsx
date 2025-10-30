// app/_layout.tsx
import { Slot, Stack } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import useAuthGuard from "@/appSRC/auth/Hooks/useAuthGuard";
import MiniLoaderScreen from "@/appCOMP/contentStates/MiniLoaderScreen";

// English comments, very explicit logs
export default function RootLayout() {
  const { isBootLoading } = useAuthStore();

  console.log(
    `[Layout] mount → isBootLoading=${isBootLoading}`
  );

  useAuthGuard(); // will log its own mount

  if (isBootLoading) {
    console.log("[Layout] showing MiniLoaderScreen");
    return <MiniLoaderScreen />;
  }

  console.log("[Layout] rendering <Slot /> (navigation is ready to render screens)");
  return <Slot />;
}
