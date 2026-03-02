import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { saveUserRole } from "../Service/SupabaseAuthService";
import { decideAuthStatus } from "../Service/AuthService";

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

      const nextStatus = decideAuthStatus({
        hasPhone: !!phone,
        role,
        profileComplete: result.profile_complete,
        identityStatus: result.identityStatus ?? null,
      });

      console.log(`🎯 [useSelectUserType] Role: ${role} | profile_complete: ${result.profile_complete} | identityStatus: ${result.identityStatus} → ${nextStatus}`);
      setStatus(nextStatus);
    } catch (err) {
      console.error("❌ Error selecting role:", err);
    }
  };

  return { selectRole };
}
