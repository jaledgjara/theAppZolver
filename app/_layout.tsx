import { Slot } from "expo-router";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initializeAuthListener, initializeTokenRefreshListener } from "@/appSRC/auth/Service/AuthService";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useAuthGuard } from "@/appSRC/auth/Hooks/useAuthGuard";
import LoadingScreen from "@/appCOMP/contentStates/LoadingScreen";
import { usePushNotifications } from "@/appSRC/notifications/Hooks/usePushNotifications";

const queryClient = new QueryClient();
const isWeb = Platform.OS === "web";

export default function RootLayout() {
  const isBootLoading = useAuthStore((s) => s.isBootLoading);
  const status = useAuthStore((s) => s.status);

  console.log(
    `🏗️ [RootLayout] RENDER | Platform: ${Platform.OS} | isBootLoading: ${isBootLoading} | status: ${status}`
  );

  useEffect(() => {
    console.log("🏗️ [RootLayout] useEffect: Initializing auth listener...");
    const unsubAuth = initializeAuthListener();
    const unsubRefresh = initializeTokenRefreshListener();
    return () => {
      unsubAuth();
      unsubRefresh();
    };
  }, []);

  useAuthGuard();
  usePushNotifications();

  if (isBootLoading) {
    console.log("🏗️ [RootLayout] Showing LoadingScreen (isBootLoading=true)");
    return <LoadingScreen />;
  }

  console.log("🏗️ [RootLayout] Rendering <Slot /> (isBootLoading=false)");

  // On web, GestureHandlerRootView is not needed — use a plain View
  if (isWeb) {
    return (
      <QueryClientProvider client={queryClient}>
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </QueryClientProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Slot />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
