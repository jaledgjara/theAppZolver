import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import {
  useRouter,
  usePathname,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { AUTH_PATHS } from "@/appSRC/auth/Path/AuthPaths";
import type { AuthStatus } from "@/appSRC/auth/Store/AuthStore";

/** Segments that do NOT require authentication */
const PUBLIC_SEGMENTS = ["(public)"] as const;

/** Segments that require admin role */
const ADMIN_SEGMENTS = ["(admin)"] as const;

function isPublicSegment(segment: string | undefined): boolean {
  return PUBLIC_SEGMENTS.includes(segment as (typeof PUBLIC_SEGMENTS)[number]);
}

function isAdminSegment(segment: string | undefined): boolean {
  return ADMIN_SEGMENTS.includes(segment as (typeof ADMIN_SEGMENTS)[number]);
}

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const navState = useRootNavigationState();

  const { status, user, isBootLoading, setTransitionDirection } =
    useAuthStore();

  const isNavReady = navState?.key != null;

  // 1. Usamos useRef para recordar el estado anterior y saber si venimos de Welcome
  const prevStatus = useRef<AuthStatus | null>(null);

  useEffect(() => {
    if (!isNavReady) return;
    if (isBootLoading) return;

    const currentSegment = segments[0];
    const inAuthGroup = currentSegment === "(auth)";
    const inClientGroup = currentSegment === "(client)";
    const inProfessionalGroup = currentSegment === "(professional)";
    const inPublicGroup = isPublicSegment(currentSegment);
    const inAdminGroup = isAdminSegment(currentSegment);

    console.log(
      `\n👮‍♂️ [AuthGuard] Check: ${status.toUpperCase()} | Segment: ${
        currentSegment || "root"
      } | Path: ${pathname}`
    );

    // ---------------------------------------------------------------
    // RUTAS PÚBLICAS: No requieren autenticación, acceso libre.
    // ---------------------------------------------------------------
    if (inPublicGroup) {
      prevStatus.current = status;
      return;
    }

    // ---------------------------------------------------------------
    // WEB: Ruta raíz ("/") — Dejar que index.tsx maneje el redirect.
    // En web, si no hay segmento (ruta raíz), no interceptar.
    // index.tsx se encargará de redirigir a (public) o al home.
    // ---------------------------------------------------------------
    if (Platform.OS === "web" && !currentSegment) {
      prevStatus.current = status;
      return;
    }

    // ---------------------------------------------------------------
    // RUTAS ADMIN: Requieren autenticación + rol admin.
    // El AdminLayout maneja su propio guard de rol internamente.
    // Aquí solo verificamos que el usuario esté autenticado.
    // ---------------------------------------------------------------
    if (inAdminGroup) {
      if (status === "authenticated" || status === "authenticatedProfessional") {
        prevStatus.current = status;
        return;
      }
      // Si no está autenticado, redirigir a auth
      setTransitionDirection("back");
      prevStatus.current = status;
      requestAnimationFrame(() => {
        router.replace("/(auth)/SignInScreen" as any);
      });
      return;
    }

    let target: string | null = null;
    let direction: "forward" | "back" = "forward";

    switch (status) {
      // -----------------------------------------------------------------
      // CASO A: USUARIO DESCONECTADO O EN PROCESO
      // -----------------------------------------------------------------
      case "unknown":
      case "anonymous":
      case "preAuth":
      case "phoneVerified":
      case "preProfessionalForm":
      case "pendingReview":
      case "rejected":
        if (!inAuthGroup) {
          target = getTargetForAuthStatus(status);
          direction = "back";
        } else {
          const expectedPath = getTargetForAuthStatus(status);
          const currentSimple = normalize(pathname);
          const expectedSimple = normalize(expectedPath);

          // Excepciones (Verificación Teléfono / Email)
          if (
            status === "preAuth" &&
            currentSimple === "/PhoneVerificationScreen"
          )
            return;
          if (status === "anonymous" && currentSimple === "/SignInEmailScreen")
            return;

          // REDIRECT LOGIC
          if (currentSimple !== expectedSimple) {
            target = expectedPath;

            if (status === "anonymous") {
              const cameFromWelcome =
                prevStatus.current === "unknown" || prevStatus.current === null;
              direction = cameFromWelcome ? "forward" : "back";
            } else if (status === "unknown") {
              direction = "back";
            } else {
              direction = "forward";
            }
          }
        }
        break;

      // -----------------------------------------------------------------
      // CASO B: CLIENTE AUTENTICADO
      // -----------------------------------------------------------------
      case "authenticated":
        if (inClientGroup) {
          prevStatus.current = status;
          return;
        }
        target = AUTH_PATHS.authenticated;
        direction = "forward";
        break;

      // -----------------------------------------------------------------
      // CASO C: PROFESIONAL AUTENTICADO
      // -----------------------------------------------------------------
      case "authenticatedProfessional":
        if (inProfessionalGroup) {
          prevStatus.current = status;
          return;
        }
        target = AUTH_PATHS.authenticatedProfessional;
        direction = "forward";
        break;
    }

    // 3. EJECUCIÓN DE REDIRECCIÓN
    if (target) {
      console.log(`🚀 [AuthGuard] REDIRECT -> ${target} (${direction})`);
      setTransitionDirection(direction);

      prevStatus.current = status;

      requestAnimationFrame(() => {
        router.replace(target as any);
      });
    } else {
      prevStatus.current = status;
    }
  }, [isNavReady, isBootLoading, status, pathname, segments]);
}

// Helpers locales
function normalize(p: string) {
  return p
    .replace("/(auth)", "")
    .replace("/(tabs)", "")
    .replace("/(client)", "")
    .replace("/(professional)", "")
    .replace("/(public)", "")
    .replace("/(admin)", "")
    .replace(/\?.*$/, "");
}

function getTargetForAuthStatus(status: string): string {
  return AUTH_PATHS[status] ?? AUTH_PATHS.unknown;
}

export default useAuthGuard;
