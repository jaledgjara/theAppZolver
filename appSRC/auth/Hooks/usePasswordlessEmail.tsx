// appSRC/auth/Hooks/usePasswordlessEmail.ts
import { useEffect, useState } from "react";
import { sendSignInLinkToEmailFirebase } from "../Service/AuthService";
import { router } from "expo-router";

export function usePasswordlessEmail() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const sendEmailLink = async (email: string) => {
    if (!email.includes("@")) {
      setError("Por favor, ingresa un email válido.");
      return;
    }

    setLoading(true);
    setError(null);
    setSent(false);

    const result = await sendSignInLinkToEmailFirebase(email);
    setLoading(false);

    if (result.ok) {
      setSent(true);
      console.log(`[usePasswordlessEmail] Email sent to ${email}`);
      router.push("/(auth)/ConfirmationEmailScreen");
    } else {
      setError(result.message ?? "Error enviando email");
    }
  };

  const resetState = () => {
    setLoading(false);
    setError(null);
    setSent(false);
  };

  return {
    sendEmailLink,
    loading,
    error,
    sent,
    resetState,
  };
}

import * as Linking from "expo-linking";
import { handleSignInWithEmailLinkFirebase } from "../Service/AuthService";

/**
 * Hook que escucha los deep links al volver del correo
 * y maneja el flujo de sign-in por link mágico.
 * Solo llama a Firebase — el AuthListener maneja status y redirección.
 */
export function useHandleEmailLink() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUrl = async (url?: string | null) => {
      if (!url) return;

      setLoading(true);
      try {
        await handleSignInWithEmailLinkFirebase(url);
        // AuthListener se dispara via onAuthStateChanged y maneja el resto
      } catch (e: unknown) {
        console.error("[useHandleEmailLink] Error:", e);
      } finally {
        setLoading(false);
      }
    };

    // Caso 1: cold start
    Linking.getInitialURL().then(handleUrl);

    // Caso 2: hot link
    const sub = Linking.addEventListener("url", (ev) => handleUrl(ev.url));

    return () => sub.remove();
  }, []);

  return { loading };
}