// appSRC/auth/Hooks/useAuthGuard.ts
import { useEffect, useRef } from "react";
import { useRouter, usePathname, useSegments, useRootNavigationState } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { AUTH_PATHS } from "../Path/AuthPaths";
import { AuthStatus } from "../Type/AuthUser";
import { initializeAuthListener } from "../Service/AuthService";


export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const navState = useRootNavigationState();

  const { status, user, isBootLoading } = useAuthStore();
  const isNavReady = navState?.key != null;

  // Track last routed status to avoid duplicate replace()
  const prevStatus = useRef<AuthStatus | null>(null);

  // 1) Mount listener once
  useEffect(() => {
    console.log("[AuthGuard] mount → initializeAuthListener()");
    const unsub = initializeAuthListener();
    console.log("[AuthGuard] Firebase listener initialized");
    return () => {
      console.log("[AuthGuard] unmount → unsubscribe Firebase listener");
      unsub?.();
    };
  }, []);

  // 2) React to status changes and navigate
  useEffect(() => {
    console.log(
      `[AuthGuard] tick → isNavReady=${isNavReady} isBootLoading=${isBootLoading} status=${status} ` +
      `profileComplete=${user?.profileComplete ?? "n/a"} pathname=${pathname}`
    );

    if (!isNavReady) {
      console.log("[AuthGuard] nav not ready yet → wait");
      return;
    }
    if (isBootLoading) {
      console.log("[AuthGuard] boot loading → wait");
      return;
    }

    // Special case: unknown must always go to Welcome
    if (status === "unknown") {
      console.log("[AuthGuard] status=unknown → go Welcome");
      router.replace(AUTH_PATHS.unknown);
      prevStatus.current = "unknown";
      return;
    }

    // Avoid duplicate routing for same status
    if (status === prevStatus.current) {
      console.log("[AuthGuard] same status as last route → no-op");
      return;
    }

    // Compute target route for status
    let target: string;
    switch (status) {
      case "anonymous":
        target = AUTH_PATHS.anonymous;
        break;
      case "preAuth":
        target = AUTH_PATHS.preAuth;
        break;
      case "authenticated":
        target = user?.profileComplete ? AUTH_PATHS.authenticated : AUTH_PATHS.preAuth;
        break;
      case "incompleteProfile":
        // Optional: if you decide to use it distinctly
        target = AUTH_PATHS.preAuth;
        break;
      default:
        target = AUTH_PATHS.unknown;
        break;
    }

    // Normalize to avoid group prefixes creating false differences
    const normalize = (p?: string) => (p ?? "").replace("/(auth)", "").replace("/(tabs)", "");
    const current = normalize(pathname);
    const next = normalize(target);

    console.log(`[AuthGuard] route check → current=${current} next=${next}`);

    if (current !== next) {
      console.log(`[AuthGuard] replace → ${target}`);
      router.replace(target);
      prevStatus.current = status;
    } else {
      console.log("[AuthGuard] already there → no-op");
      prevStatus.current = status;
    }
  }, [isNavReady, isBootLoading, status, user?.profileComplete, pathname, router]);
}

export default useAuthGuard;
