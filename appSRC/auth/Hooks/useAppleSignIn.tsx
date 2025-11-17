import { auth } from "@/APIconfig/firebaseAPIConfig";
import { signInWithAppleFirebase } from "../Service/AuthService";
import { useAuthStore } from "../Store/AuthStore";
import { AuthUser } from "../Type/AuthUser";


export function useAppleSignIn() {
  const { setStatus, setUser, setTransitionDirection } = useAuthStore();

  const handleAppleSignIn = async () => {
    console.log("[useAppleSignIn] Starting Apple Sign-In...");
    
    // (1) Apple SIEMPRE se considera avance → UI puede animar hacia adelante
    setTransitionDirection("forward");

    const result = await signInWithAppleFirebase();

    if (result.ok) {
      const user = result.user;
      setUser(user);

      console.log("[useAppleSignIn] Apple sign-in ok:", user);

      // (2) Esto activa el AuthListener → sincroniza SQL y decide status
      setStatus("preAuth");

      // (3) token refrescado
      const token = await auth.currentUser?.getIdToken(true);
      console.log("[useAppleSignIn] Nuevo token:", token);

    } else {
      console.error("[useAppleSignIn] Apple Sign-In failed:", result.message);

      // Apple cancelado o error → vuelves a anonymous
      setStatus("anonymous");
    }
  };

  return { handleAppleSignIn };
}
