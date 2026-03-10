import { Slot } from "expo-router";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react-native";
import {
  initializeAuthListener,
  initializeTokenRefreshListener,
} from "@/appSRC/auth/Service/AuthService";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useAuthGuard } from "@/appSRC/auth/Hooks/useAuthGuard";
import LoadingScreen from "@/appCOMP/contentStates/LoadingScreen";
import { ErrorBoundary } from "@/appCOMP/ErrorBoundary";
import { usePushNotifications } from "@/appSRC/notifications/Hooks/usePushNotifications";
import { useNetworkStatus } from "@/appSRC/utils/useNetworkStatus";
import { OfflineBanner } from "@/appCOMP/OfflineBanner";
import { logger } from "@/appSRC/utils/logger";

// Initialize Sentry for crash reporting and error monitoring
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? "",
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
  environment: __DEV__ ? "development" : "production",
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes — avoid aggressive refetching
      gcTime: 10 * 60 * 1000, // 10 minutes — keep unused data in cache
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const isWeb = Platform.OS === "web";

function RootLayoutInner() {
  const isBootLoading = useAuthStore((s) => s.isBootLoading);
  const status = useAuthStore((s) => s.status);
  const { isConnected } = useNetworkStatus();

  logger.log(
    `[RootLayout] RENDER | Platform: ${Platform.OS} | isBootLoading: ${isBootLoading} | status: ${status}`,
  );

  useEffect(() => {
    logger.log("[RootLayout] useEffect: Initializing auth listener...");
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
    logger.log("[RootLayout] Showing LoadingScreen (isBootLoading=true)");
    return <LoadingScreen />;
  }

  logger.log("[RootLayout] Rendering <Slot /> (isBootLoading=false)");

  // On web, GestureHandlerRootView is not needed — use a plain View
  if (isWeb) {
    return (
      <QueryClientProvider client={queryClient}>
        <View style={{ flex: 1 }}>
          {!isConnected && <OfflineBanner />}
          <Slot />
        </View>
      </QueryClientProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        {!isConnected && <OfflineBanner />}
        <Slot />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootLayout() {
  return (
    <ErrorBoundary>
      <RootLayoutInner />
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
