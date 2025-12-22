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
  const segments = useSegments(); // 👈 CLAVE: Nos dice en qué grupo estamos ('(professional)', '(auth)', etc.)
  const navState = useRootNavigationState();

  const { status, user, isBootLoading, setTransitionDirection } =
    useAuthStore();

  const isNavReady = navState?.key != null;
  const prevStatus = useRef<AuthStatus | null>(null);

  useEffect(() => {
    // 1. ANÁLISIS PRELIMINAR
    if (!isNavReady) return;

    // Si está cargando, silencio total (Loading First)
    if (isBootLoading) return;

    // 2. LOGICA DE ZONA SEGURA (Safe Zone Logic)
    // En lugar de comparar rutas exactas, verificamos si estamos en el "Barrio" correcto.
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
      case "preAuth": // 👈 AQUÍ ESTÁ EL CAMBIO
      case "phoneVerified":
      case "preProfessionalForm":
      case "pendingReview":
      case "rejected":
        if (!inAuthGroup) {
          // Si te saliste del stack (auth), vuelve.
          target = getTargetForAuthStatus(status);
          direction = "back";
        } else {
          // Estás en (auth), pero verifiquemos si es la pantalla correcta.
          const expectedPath = getTargetForAuthStatus(status);
          const currentSimple = normalize(pathname);
          const expectedSimple = normalize(expectedPath);

          // 🔥 EXCEPCIÓN CRÍTICA: PERMITIR PANTALLA DE VERIFICACIÓN
          // Si estoy en 'preAuth' Y en 'PhoneVerificationScreen', ES VÁLIDO.
          if (
            status === "preAuth" &&
            currentSimple === "/PhoneVerificationScreen"
          ) {
            console.log(
              "   ✅ [AuthGuard] 'preAuth' en verificación de teléfono. Permitido."
            );
            return;
          }

          // 🔥 EXCEPCIÓN 2: PERMITIR PANTALLA DE EMAIL LINK (Si aplica)
          if (
            status === "anonymous" &&
            currentSimple === "/SignInEmailScreen"
          ) {
            return;
          }

          // Si no es ninguna excepción y no es el path esperado -> REDIRECT
          if (currentSimple !== expectedSimple) {
            target = expectedPath;
            direction =
              status === "anonymous" || status === "unknown"
                ? "back"
                : "forward";
          }
        }
        break;

      // -----------------------------------------------------------------
      // CASO B: CLIENTE AUTENTICADO
      // -----------------------------------------------------------------
      case "authenticated":
        // Si YA estamos en territorio Cliente, ¡déjalo navegar en paz!
        if (inClientGroup) {
          // ✅ SAFE ZONE: No hacemos nada, el usuario es libre.
          return;
        }
        // Si NO estamos en cliente (ej: está en Login), mándalo a Home.
        target = AUTH_PATHS.authenticated;
        direction = "forward";
        break;

      // -----------------------------------------------------------------
      // CASO C: PROFESIONAL AUTENTICADO
      // -----------------------------------------------------------------
      case "authenticatedProfessional":
        // Si YA estamos en territorio Profesional, ¡libertad!
        if (inProfessionalGroup) {
          // ✅ SAFE ZONE: No hacemos nada.
          console.log("   ✅ [AuthGuard] Professional in Safe Zone. Allowed.");
          return;
        }
        // Si está perdido, mándalo a su Home.
        target = AUTH_PATHS.authenticatedProfessional;
        direction = "forward";
        break;
    }

    // 3. EJECUCIÓN DE REDIRECCIÓN (Si target != null)
    if (target) {
      console.log(`🚀 [AuthGuard] REDIRECT -> ${target} (${direction})`);
      setTransitionDirection(direction);

      // Pequeño delay para estabilidad
      requestAnimationFrame(() => {
        router.replace(target as any);
      });
    }
  }, [isNavReady, isBootLoading, status, pathname, segments]); // Agregamos segments a dep
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
  // Usamos tu mapa AUTH_PATHS existente, pero manejamos la lógica aquí para claridad
  // Nota: Asegúrate de que AUTH_PATHS tenga todas las claves o usa un switch/map aquí.
  // Usaremos AUTH_PATHS directo como en tu código original:
  return AUTH_PATHS[status] ?? AUTH_PATHS.unknown;
}

export default useAuthGuard;
