// appSRC/auth/Hooks/useAuthGuard.ts
import { useEffect, useRef } from "react";
import { useRouter, usePathname, useSegments, useRootNavigationState } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { AUTH_PATHS } from "../Path/AuthPaths";
import { AuthStatus } from "../Type/AuthUser";
import { initializeAuthListener } from "../Service/AuthService";

const DEBUG = true;
const READY_DELAY_MS = 50;

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const { status, user, setBootLoading } = useAuthStore();
  const readyGate = useRef(false);
  const prevStatus = useRef<AuthStatus | null>(null);

  const isNavigationReady = navigationState?.key != null;

  // Listener global (Firebase)
  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    DEBUG && console.log("[AuthGuard] Firebase listener initialized");
    return () => unsubscribe?.();
  }, []);

  // Ready gate: espera router + listener
  useEffect(() => {
    const timer = setTimeout(() => {
      readyGate.current = true;
      setBootLoading(false); // 🔹 apaga el splash solo una vez
    }, READY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [setBootLoading]);

  // Lógica principal
  useEffect(() => {
    if (!isNavigationReady || !readyGate.current) return;
    if (status === "unknown") return;

    if (status === prevStatus.current) return;
    prevStatus.current = status;

    let target: string | null = null;

    switch (status) {
      case "anonymous":
        target = AUTH_PATHS.anonymous;
        break;
      case "preAuth":
        target = AUTH_PATHS.preAuth;
        break;
      case "authenticated":
        target = user?.profileComplete
          ? AUTH_PATHS.unknown
          : AUTH_PATHS.unknown;
        break;
      default:
        target = AUTH_PATHS.unknown;
        break;
    }

    const current = pathname.replace("/(auth)", "").replace("/(tabs)", "");
    const next = target.replace("/(auth)", "").replace("/(tabs)", "");

    if (current !== next) {
      DEBUG && console.log(`[AuthGuard] Navigating → ${target}`);
      router.replace(target);
    } else {
      DEBUG && console.log("[AuthGuard] No navigation needed.");
    }
  }, [isNavigationReady, status, user, pathname, router]);
}

export default useAuthGuard;
