import { signInWithAppleFirebase } from "../Service/AuthService";
import { useAuthStore } from "../Store/AuthStore";

export function useAppleSignIn() {
  const { setTransitionDirection } = useAuthStore();

  const handleAppleSignIn = async () => {
    setTransitionDirection("forward");

    // Solo dispara Firebase — el AuthListener maneja user, status y redirección
    const result = await signInWithAppleFirebase();

    if (!result.ok) {
      console.error("[useAppleSignIn] Apple Sign-In failed:", result.message);
    }
  };

  return { handleAppleSignIn };
}
