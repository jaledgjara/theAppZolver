import { Slot } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initializeAuthListener } from "@/appSRC/auth/Service/AuthService";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useAuthGuard } from "@/appSRC/auth/Hooks/useAuthGuard";
import LoadingScreen from "@/appCOMP/contentStates/LoadingScreen";

const queryClient = new QueryClient();

export default function RootLayout() {
  const isBootLoading = useAuthStore((s) => s.isBootLoading);

  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, []);

  useAuthGuard();

  if (isBootLoading) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Slot />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
