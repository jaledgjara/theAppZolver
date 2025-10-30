import { signInWithAppleFirebase } from "../Service/AuthService";
import { useAuthStore } from "../Store/AuthStore";
import { AuthUser } from "../Type/AuthUser";


export function useAppleSignIn() {
  const { setStatus, setUser, setActionLoading, setError } = useAuthStore();

  const handleAppleSignIn = async () => {
    setActionLoading(true);
    console.log("Starting Apple Sign-In...");
    const result = await signInWithAppleFirebase();

    if (result.ok) {
      const user: AuthUser = result.user;
      setUser(user);
      console.log("Apple Sign-In successful for user:", user);
      setStatus("preAuth");
    } else {
      setError(result.message ?? "Unknown error");
      setStatus("anonymous");
      console.error("Apple Sign-In failed:", result.message);
    }

    setActionLoading(false);
  };

  return { handleAppleSignIn };
}
