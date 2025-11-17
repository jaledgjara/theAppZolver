// src/modules/auth/hooks/useSelectUserType.ts

// src/modules/auth/hooks/useSelectUserType.ts

import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { saveUserRole } from "../Service/SupabaseAuthService";

export function useSelectUserType() {
  const { setStatus, setUser, user } = useAuthStore();

  const selectRole = async (role: "client" | "professional") => {
    try {
      const phone = user?.phoneNumber ?? null;

      const result = await saveUserRole(role, phone);

      const updatedUser = {
        ...user!,
        profileComplete: result.profile_complete, // boolean from backend
      };

      setUser(updatedUser);

      if (role === "client") {
        setStatus("authenticated");
      } else {
        if (result.profile_complete) {
          setStatus("authenticated");
        } else {
          setStatus("preProfessionalForm");
        }
      }
    } catch (err) {
      console.error("❌ Error selecting role:", err);
    }
  };

  return { selectRole };
}
