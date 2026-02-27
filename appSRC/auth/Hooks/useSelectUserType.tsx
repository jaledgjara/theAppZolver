import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { saveUserRole } from "../Service/SupabaseAuthService";
import type { AuthStatus } from "../Type/AuthUser";

export function useSelectUserType() {
  const { setStatus, setUser, user } = useAuthStore();

  const selectRole = async (role: "client" | "professional") => {
    try {
      const phone = user?.phoneNumber ?? null;

      const result = await saveUserRole(role, phone);

      setUser({
        ...user!,
        role,
        profileComplete: result.profile_complete,
        identityStatus: result.identityStatus ?? null,
      });

      // Use the same logic as decideAuthStatus for consistency
      let nextStatus: AuthStatus;
      if (role === "client") {
        nextStatus = "authenticated";
      } else {
        if (!result.profile_complete) {
          nextStatus = "preProfessionalForm";
        } else if (result.identityStatus === "approved" || result.identityStatus === "verified") {
          nextStatus = "authenticatedProfessional";
        } else if (result.identityStatus === "rejected") {
          nextStatus = "rejected";
        } else {
          nextStatus = "pendingReview";
        }
      }

      console.log(`🎯 [useSelectUserType] Role: ${role} | profile_complete: ${result.profile_complete} | identityStatus: ${result.identityStatus} → ${nextStatus}`);
      setStatus(nextStatus);
    } catch (err) {
      console.error("❌ Error selecting role:", err);
    }
  };

  return { selectRole };
}
