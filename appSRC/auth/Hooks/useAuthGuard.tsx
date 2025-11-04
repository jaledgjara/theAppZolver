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

  const { status, user, isBootLoading, setTransitionDirection } = useAuthStore();
  const isNavReady = navState?.key != null;

  const prevStatus = useRef<AuthStatus | null>(null);

  useEffect(() => {
    console.log("[AuthGuard] mount → initializeAuthListener()");
    const unsub = initializeAuthListener();
    console.log("[AuthGuard] Firebase listener initialized");
    return () => {
      console.log("[AuthGuard] unmount → unsubscribe Firebase listener");
      unsub?.();
    };
  }, []);

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

    if (status === "unknown") {
      console.log("[AuthGuard] status=unknown → go Welcome");
      setTransitionDirection("back");
      router.replace(AUTH_PATHS.unknown);
      prevStatus.current = "unknown";
      return;
    }

    if (status === prevStatus.current) {
      console.log("[AuthGuard] same status as last route → no-op");
      return;
    }

    let target: string;
    switch (status) {
      case "anonymous":
        // Si venís desde "unknown" → avanzás; si venís desde otro estado → retrocedés
        if (prevStatus.current === "unknown" || prevStatus.current === null) {
          setTransitionDirection("forward");
        } else {
          setTransitionDirection("back");
        }
        target = AUTH_PATHS.anonymous;
        break;

      case "preAuth":
        setTransitionDirection("forward"); // usuario avanza
        target = AUTH_PATHS.preAuth;
        break;

      case "authenticated":
        setTransitionDirection("forward"); // hacia home
        target = user?.profileComplete ? AUTH_PATHS.authenticated : AUTH_PATHS.preAuth;
        break;

      case "incompleteProfile":
        setTransitionDirection("forward");
        target = AUTH_PATHS.preAuth;
        break;

      default:
        setTransitionDirection("back");
        target = AUTH_PATHS.unknown;
        break;
    }


    const normalize = (p?: string) => (p ?? "").replace("/(auth)", "").replace("/(tabs)", "");
    const current = normalize(pathname);
    const next = normalize(target);

    console.log(`[AuthGuard] route check → current=${current} next=${next}`);

    if (current !== next) {
      console.log(`[AuthGuard] replace (delayed) → ${target}`);
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (isNavReady) {
            router.replace(target);
            prevStatus.current = status;
          }
        }, 50);
      });
    } else {
      console.log("[AuthGuard] already there → no-op");
      prevStatus.current = status;
    }
  }, [isNavReady, isBootLoading, status, user?.profileComplete, pathname, router]);
}

export default useAuthGuard;
