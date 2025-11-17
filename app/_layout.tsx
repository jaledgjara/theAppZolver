// app/_layout.tsx
import { Slot } from "expo-router";
import { useEffect } from "react";
import { initializeAuthListener } from "@/appSRC/auth/Service/AuthService";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useAuthGuard } from "@/appSRC/auth/Hooks/useAuthGuard";

export default function RootLayout() {
  const isBootLoading = useAuthStore((s) => s.isBootLoading);

  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, []);

  useAuthGuard();

  if (isBootLoading) {
    // puedes mostrar tu MiniLoaderScreen aquí
    return null;
  }

  return <Slot />;
}
