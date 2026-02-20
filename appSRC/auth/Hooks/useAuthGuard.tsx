import { useEffect } from "react";
import { Platform } from "react-native";
import {
  useRouter,
  usePathname,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { AUTH_PATHS } from "@/appSRC/auth/Path/AuthPaths";

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

  const { status, isBootLoading, setTransitionDirection, lastStatus } =
    useAuthStore();

  const isNavReady = navState?.key != null;

  useEffect(() => {
    if (!isNavReady) return;
    if (isBootLoading) return;

    const currentSegment = segments[0];
    const inAuthGroup = currentSegment === "(auth)";
    const inClientGroup = currentSegment === "(client)";
    const inProfessionalGroup = currentSegment === "(professional)";
    const inPublicGroup = isPublicSegment(currentSegment);
    const inAdminGroup = isAdminSegment(currentSegment);

    // ---------------------------------------------------------------
    // RUTAS PÚBLICAS: No requieren autenticación, acceso libre.
    // ---------------------------------------------------------------
    if (inPublicGroup) return;

    // ---------------------------------------------------------------
    // WEB: Ruta raíz ("/") — Dejar que index.tsx maneje el redirect.
    // ---------------------------------------------------------------
    if (Platform.OS === "web" && !currentSegment) return;

    // ---------------------------------------------------------------
    // RUTAS ADMIN: Requieren autenticación + rol admin.
    // ---------------------------------------------------------------
    if (inAdminGroup) {
      if (status === "authenticated" || status === "authenticatedProfessional") {
        return;
      }
      setTransitionDirection("back");
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

          if (currentSimple !== expectedSimple) {
            target = expectedPath;

            if (status === "anonymous") {
              const cameFromWelcome =
                lastStatus === "unknown" || lastStatus === null;
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
        if (inClientGroup) return;
        target = AUTH_PATHS.authenticated;
        direction = "forward";
        break;

      // -----------------------------------------------------------------
      // CASO C: PROFESIONAL AUTENTICADO
      // -----------------------------------------------------------------
      case "authenticatedProfessional":
        if (inProfessionalGroup) return;
        target = AUTH_PATHS.authenticatedProfessional;
        direction = "forward";
        break;
    }

    // EJECUCIÓN DE REDIRECCIÓN (guard atómico)
    if (target) {
      if (normalize(pathname) === normalize(target)) return;

      setTransitionDirection(direction);
      requestAnimationFrame(() => {
        router.replace(target as any);
      });
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
