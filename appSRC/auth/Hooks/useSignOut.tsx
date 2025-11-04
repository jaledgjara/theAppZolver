// appSRC/auth/Hooks/useSignOut.ts
import { useCallback } from "react";
import { signOutFirebase } from "../Service/AuthService";

export function useSignOut() {
  const handleSignOut = useCallback(async () => {
    console.log("[useSignOut] user requested sign out");
    await signOutFirebase();
  }, []);

  return { handleSignOut };
}
