// appSRC/auth/Hooks/useSignOut.tsx
import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../Store/AuthStore";
import { AUTH_PATHS } from "../Path/AuthPaths";
import { signOutFirebase } from "../Service/AuthService";

export function useSignOut() {
  const router = useRouter();
  const { reset, setStatus, setTransitionDirection } = useAuthStore();

  const handleSignOut = useCallback(async () => {
    try {
      console.log("[useSignOut] user requested sign out");

      // 1️⃣ Cerrar sesión Firebase
      await signOutFirebase();

      // 2️⃣ Resetear Zustand y transición
      reset();
      setStatus("anonymous");
      setTransitionDirection("back");

    } catch (err) {
      console.error("[useSignOut] ❌ Error during signOut:", err);
    }
  }, [router, reset, setStatus, setTransitionDirection]);

  return { handleSignOut }; // 🔹 el único export “interno”
}
