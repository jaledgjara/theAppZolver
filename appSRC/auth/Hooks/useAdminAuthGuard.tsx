import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { supabase } from "@/appSRC/services/supabaseClient";

interface AdminGuardState {
  isAdmin: boolean;
  isLoading: boolean;
  needsLogin: boolean;
}

/**
 * useAdminAuthGuard — Verifies the current user has admin privileges.
 * Returns `needsLogin: true` when the user is not authenticated,
 * so the admin layout can show its own login screen inline (no redirect).
 * Redirects non-admin authenticated users back to the client home.
 */
export function useAdminAuthGuard(): AdminGuardState {
  const router = useRouter();
  const { status, user, isBootLoading } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    if (isBootLoading) return;

    async function checkAdminRole() {
      // Not authenticated at all — show admin login inline
      if (
        status !== "authenticated" &&
        status !== "authenticatedProfessional" &&
        status !== "authenticatedAdmin"
      ) {
        setIsLoading(false);
        setIsAdmin(false);
        setNeedsLogin(true);
        return;
      }

      if (!user?.uid) {
        setIsLoading(false);
        setIsAdmin(false);
        setNeedsLogin(true);
        return;
      }

      setNeedsLogin(false);

      // Quick local check — the AuthStore may already have the role
      if (user.role === "admin") {
        setIsAdmin(true);
        setIsLoading(false);
        return;
      }

      try {
        // Verify against Supabase as source of truth (with 5s timeout)
        const TIMEOUT_MS = 5000;
        const queryPromise = supabase
          .from("user_accounts")
          .select("role")
          .eq("auth_uid", user.uid)
          .single();

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Admin check timed out")), TIMEOUT_MS)
        );

        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

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
        console.warn("🛡️ [AdminGuard] Error or timeout checking admin role:", err);
        setIsAdmin(false);
        router.replace("/(client)/(tabs)/home" as any);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminRole();
  }, [status, user?.uid, isBootLoading]);

  return { isAdmin, isLoading, needsLogin };
}

export default useAdminAuthGuard;
