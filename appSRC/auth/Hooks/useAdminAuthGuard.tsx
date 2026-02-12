import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { supabase } from "@/appSRC/services/supabaseClient";

interface AdminGuardState {
  isAdmin: boolean;
  isLoading: boolean;
}

/**
 * useAdminAuthGuard — Verifies the current user has admin privileges.
 * First checks the local AuthStore role, then validates against Supabase.
 * Redirects away if the user is not an admin.
 */
export function useAdminAuthGuard(): AdminGuardState {
  const router = useRouter();
  const { status, user } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdminRole() {
      // Not authenticated at all — redirect to sign in
      if (
        status !== "authenticated" &&
        status !== "authenticatedProfessional"
      ) {
        setIsLoading(false);
        setIsAdmin(false);
        router.replace("/(auth)/SignInScreen" as any);
        return;
      }

      if (!user?.uid) {
        setIsLoading(false);
        setIsAdmin(false);
        router.replace("/(auth)/SignInScreen" as any);
        return;
      }

      // Quick local check — the AuthStore may already have the role
      if (user.role === "admin") {
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }

      try {
        // Verify against Supabase as source of truth
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("firebase_uid", user.uid)
          .single();

        if (error || data?.role !== "admin") {
          console.warn(
            "🛡️ [AdminGuard] Access denied — user is not an admin."
          );
          setIsAdmin(false);
          setIsLoading(false);
          router.replace("/(client)/(tabs)/home" as any);
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        console.error("🛡️ [AdminGuard] Error checking admin role:", err);
        setIsAdmin(false);
        router.replace("/(client)/(tabs)/home" as any);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminRole();
  }, [status, user?.uid]);

  return { isAdmin, isLoading };
}

export default useAdminAuthGuard;
