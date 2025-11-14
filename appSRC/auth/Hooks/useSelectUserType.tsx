// src/modules/auth/hooks/useSelectUserType.ts

import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import { useRouter } from "expo-router";
import { saveUserRole } from "../Service/SupabaseAuthService";

export function useSelectUserType() {
  const router = useRouter();
  const { setStatus, setUser, user } = useAuthStore();

  const selectRole = async (role: "client" | "professional") => {
    try {
      const result = await saveUserRole(role);

      const updatedUser = {
        ...user!,
        profileComplete: result.profile_complete, // boolean
      };

      setUser(updatedUser);

      // Status logic
      if (role === "client") {
        setStatus("authenticated");
        router.replace("/(tabs)/home");
      } else {
        if (result.profile_complete) {
          setStatus("authenticated");
          router.replace("/(tabs)/home");
        } else {
          setStatus("incompleteProfile");
          router.replace("/(auth)/ProfessionalOneFormScreen");
        }
      }
    } catch (err) {
      console.error("❌ Error selecting role:", err);
    }
  };

  return { selectRole };
}
