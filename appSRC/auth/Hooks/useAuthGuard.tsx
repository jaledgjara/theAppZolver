import { useEffect, useRef } from "react";
import {
  useRouter,
  usePathname,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { AUTH_PATHS } from "@/appSRC/auth/Path/AuthPaths";
import type { AuthStatus } from "@/appSRC/auth/Store/AuthStore";

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

    const inAuthGroup = segments[0] === "(auth)";
    const inClientGroup = segments[0] === "(client)";
    const inProfessionalGroup = segments[0] === "(professional)";

    console.log(
      `\n👮‍♂️ [AuthGuard] Check: ${status.toUpperCase()} | Segment: ${
        segments[0] || "root"
      } | Path: ${pathname}`
    );

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

            // 👇👇👇 AQUÍ ESTÁ EL CAMBIO CLAVE 👇👇👇
            if (status === "anonymous") {
              // Si vengo de "unknown" (Welcome) o es el inicio (null) -> ADELANTE
              // Si vengo de "preAuth" (me arrepentí y volví) -> ATRÁS
              const cameFromWelcome =
                prevStatus.current === "unknown" || prevStatus.current === null;
              direction = cameFromWelcome ? "forward" : "back";
            } else if (status === "unknown") {
              direction = "back"; // Volver a Welcome siempre es back
            } else {
              direction = "forward"; // Ir a preAuth, phone, etc. siempre es forward
            }
            // 👆👆👆 FIN DEL CAMBIO CLAVE 👆👆👆
          }
        }
        break;

      // -----------------------------------------------------------------
      // CASO B: CLIENTE AUTENTICADO
      // -----------------------------------------------------------------
      case "authenticated":
        if (inClientGroup) {
          prevStatus.current = status; // Actualizamos historial si estamos en zona segura
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
          prevStatus.current = status; // Actualizamos historial si estamos en zona segura
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

      // Guardamos el status actual como "previo" antes de saltar
      prevStatus.current = status;

      requestAnimationFrame(() => {
        router.replace(target as any);
      });
    } else {
      // Si no hubo redirección, también actualizamos el historial para la próxima vez
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
    .replace(/\?.*$/, "");
}

function getTargetForAuthStatus(status: string): string {
  return AUTH_PATHS[status] ?? AUTH_PATHS.unknown;
}

export default useAuthGuard;
