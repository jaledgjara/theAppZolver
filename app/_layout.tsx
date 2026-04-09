import { Slot } from "expo-router";
import { ReactNode, useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react-native";
import * as SplashScreen from "expo-splash-screen";
import { SplashVideo } from "@/appCOMP/SplashVideo";
import { useFonts } from "expo-font";
import { Ionicons, MaterialCommunityIcons, FontAwesome6, AntDesign } from "@expo/vector-icons";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  initializeAuthListener,
  initializeTokenRefreshListener,
} from "@/appSRC/auth/Service/AuthService";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useAuthGuard } from "@/appSRC/auth/Hooks/useAuthGuard";
import LoadingScreen from "@/appCOMP/contentStates/LoadingScreen";
import { ErrorBoundary } from "@/appCOMP/ErrorBoundary";
import { AppGateScreen } from "@/appCOMP/AppGateScreen";
import { usePushNotifications } from "@/appSRC/notifications/Hooks/usePushNotifications";
import { useNetworkStatus } from "@/appSRC/utils/useNetworkStatus";
import { OfflineBanner } from "@/appCOMP/OfflineBanner";
import { useAppGate } from "@/appSRC/appConfig/Hooks/useAppGate";
import { logger } from "@/appSRC/utils/logger";

// Mantener el splash nativo visible hasta que el video splash tome el control.
// Si falla (ej: web), seguimos sin bloquear.
SplashScreen.preventAutoHideAsync().catch(() => {
  // noop
});

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

/**
 * Gate remoto: bloquea el render del árbol de navegación si Supabase
 * indica modo mantenimiento o si la versión instalada es menor a `min_version`.
 *
 * DEBE renderizarse DENTRO de `QueryClientProvider` porque usa react-query.
 * Si el fetch falla, `useAppGate` cae en fail-open (`kind: "ok"`) y deja pasar.
 */
function GateGuard({ children }: { children: ReactNode }) {
  const { status: gateStatus, isLoading: isGateLoading } = useAppGate();

  if (isGateLoading) {
    return <LoadingScreen />;
  }

  if (gateStatus.kind !== "ok") {
    return <AppGateScreen status={gateStatus} />;
  }

  return <>{children}</>;
}

function RootLayoutInner() {
  const isBootLoading = useAuthStore((s) => s.isBootLoading);
  const status = useAuthStore((s) => s.status);
  const { isConnected } = useNetworkStatus();
  // En web no reproducimos video splash (no hay splash nativo y sería overkill).
  const [isSplashVideoDone, setIsSplashVideoDone] = useState(isWeb);
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
    ...FontAwesome6.font,
    ...AntDesign.font,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

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

  const isAppReady = !isBootLoading && fontsLoaded;

  logger.log(`[RootLayout] isAppReady: ${isAppReady} | splashVideoDone: ${isSplashVideoDone}`);

  // Contenido real de la app (o LoadingScreen si todavía está cargando).
  // Lo renderizamos SIEMPRE — el SplashVideo se monta encima como overlay
  // hasta que termine, garantizando: native splash → video splash → app,
  // sin frames intermedios de loading visibles.
  const appContent = isAppReady ? (
    <>
      {!isConnected && <OfflineBanner />}
      <GateGuard>
        <Slot />
      </GateGuard>
    </>
  ) : (
    <LoadingScreen />
  );

  // On web, GestureHandlerRootView is not needed — use a plain View
  if (isWeb) {
    return (
      <QueryClientProvider client={queryClient}>
        <View style={{ flex: 1 }}>{appContent}</View>
      </QueryClientProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>{appContent}</QueryClientProvider>
      {!isSplashVideoDone && <SplashVideo onFinish={() => setIsSplashVideoDone(true)} />}
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
