import { useEffect, useRef } from "react";
import {
  useRouter,
  usePathname,
  useRootNavigationState,
} from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { initializeAuthListener } from "@/appSRC/auth/Service/AuthService";
import { AUTH_PATHS } from "@/appSRC/auth/Path/AuthPaths";
import type { AuthStatus } from "@/appSRC/auth/Store/AuthStore";

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const navState = useRootNavigationState();

  const {
    status,
    user,
    isBootLoading,
    setTransitionDirection,
  } = useAuthStore();

  const isNavReady = navState?.key != null;
  const prevStatus = useRef<AuthStatus | null>(null);

  // 1) Inicializar listener de Firebase una sola vez
  useEffect(() => {
    console.log("[AuthGuard] mount → initializeAuthListener()");
    const unsub = initializeAuthListener();
    console.log("[AuthGuard] Firebase listener initialized");
    return () => {
      console.log("[AuthGuard] unmount → unsubscribe Firebase listener");
      unsub?.();
    };
  }, []);

  // 2) Lógica principal de navegación
  useEffect(() => {
    console.log(
      `[AuthGuard] tick → navReady=${isNavReady} boot=${isBootLoading} ` +
        `status=${status} profileComplete=${user?.profileComplete ?? "n/a"} ` +
        `pathname=${pathname}`
    );

    if (!isNavReady) {
      console.log("[AuthGuard] nav not ready → wait");
      return;
    }

    if (isBootLoading) {
      console.log("[AuthGuard] boot loading → wait");
      return;
    }

    if (status === prevStatus.current) {
      console.log("[AuthGuard] same status as last → no-op");
      return;
    }

    let target: string;
    let direction: "forward" | "back" = "forward";

    switch (status) {
      case "unknown":
        direction = "back";
        target = AUTH_PATHS.unknown;
        break;

      case "anonymous":
        // Si venís “desde la nada” (cold start) → adelante
        // Si venís desde algo más avanzado → atrás
        if (prevStatus.current === "unknown" || prevStatus.current === null) {
          direction = "forward";
        } else {
          direction = "back";
        }
        target = AUTH_PATHS.anonymous;
        break;

      case "preAuth":
        // Entro al funnel de onboarding (formulario básico)
        direction = "forward";
        target = AUTH_PATHS.preAuth;
        break;

      case "phoneVerified":
        // Ya tengo teléfono pero falta rol
        direction = "forward";
        target = AUTH_PATHS.phoneVerified; // mapea a TypeOfUserScreen
        break;

      case "preProfessionalForm":
        // Profesional con form pendiente
        direction = "forward";
        target = AUTH_PATHS.preProfessionalForm;
        break;

      case "authenticated":
        // Home final
        direction = "forward";
        target = AUTH_PATHS.authenticated;
        break;

      default:
        direction = "back";
        target = AUTH_PATHS.unknown;
        break;
    }

    const normalize = (p?: string) =>
      (p ?? "")
        .replace("/(auth)", "")
        .replace("/(tabs)", "")
        .replace(/\?.*$/, "");

    const current = normalize(pathname);
    const next = normalize(target);

    console.log(`[AuthGuard] route check → current=${current} next=${next}`);

    if (current === next) {
      console.log("[AuthGuard] already there → no-op");
      prevStatus.current = status;
      return;
    }

    console.log(
      `[AuthGuard] replace (delayed) → ${target} dir=${direction}`
    );

    // Seteamos la dirección ANTES de navegar
    setTransitionDirection(direction);

    requestAnimationFrame(() => {
      setTimeout(() => {
        if (!isNavReady) return;
        router.replace(target);
        prevStatus.current = status;
      }, 50);
    });
  }, [isNavReady, isBootLoading, status, pathname, user?.profileComplete]);

  return null;
}

export default useAuthGuard;
