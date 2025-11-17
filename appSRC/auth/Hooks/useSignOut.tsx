// appSRC/auth/Hooks/useSignOut.tsx
import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../Store/AuthStore";
import { AUTH_PATHS } from "../Path/AuthPaths";
import { signOutFirebase } from "../Service/AuthService";

export function useSignOut() {
  const { reset, setStatus, setTransitionDirection } = useAuthStore();

  const handleSignOut = useCallback(async () => {
    try {
      console.log("[useSignOut] User requested sign out");

      await signOutFirebase(); // solo cierra Firebase

      // Reset global del store
      reset();

      // Estado final del flujo: anonymous
      setStatus("anonymous");

      // Para animaciones de salida
      setTransitionDirection("back");

      // Navegación NO se maneja aquí. AuthGuard lo hace.

    } catch (err) {
      console.error("[useSignOut] ❌ Error:", err);
    }
  }, [reset, setStatus, setTransitionDirection]);

  return { handleSignOut };
}
