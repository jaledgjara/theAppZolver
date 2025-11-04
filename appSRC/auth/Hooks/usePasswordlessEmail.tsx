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
import { useAuthStore } from "../Store/AuthStore";

/**
 * Hook que escucha los deep links al volver del correo
 * y maneja el flujo de sign-in por link mágico.
 */
export function useHandleEmailLink() {
  const { setStatus, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("[useHandleEmailLink] mounted ✅");
    console.log("[useHandleEmailLink] waiting for incoming URLs...");

    const handleUrl = async (url?: string | null) => {
      if (!url) {
        console.log("[useHandleEmailLink] ⚠️ No URL received.");
        return;
      }

      console.log(`[useHandleEmailLink] 🔗 URL received: ${url}`);
      setLoading(true);

      try {
        console.log("[useHandleEmailLink] → Calling Firebase handler...");
        const result = await handleSignInWithEmailLinkFirebase(url);
        console.log("[useHandleEmailLink] ← Firebase handler resolved:", result);

        if (result.ok && result.user) {
          console.log(`[useHandleEmailLink] ✅ User authenticated via email link: ${result.user.email}`);
          console.log(`[useHandleEmailLink] profileComplete = ${result.user.profileComplete}`);

          // Actualizar store global
          setUser(result.user);
          const nextStatus = result.user.profileComplete ? "authenticated" : "preAuth";
          setStatus(nextStatus);

          console.log(`[useHandleEmailLink] 🧭 Setting next status: ${nextStatus}`);

          const nextRoute =
            nextStatus === "authenticated"
              ? "/(tabs)/Home"
              : "/(auth)/UserBasicInfoScreen";

          console.log(`[useHandleEmailLink] 🚀 Navigating to ${nextRoute}`);
          router.replace(nextRoute);
        } else {
          console.log("[useHandleEmailLink] ❌ Firebase link invalid or missing user");
          if (result.ok) console.log("[useHandleEmailLink] message:", result.ok);
        }
      } catch (e: any) {
        console.error("[useHandleEmailLink] 💥 Exception:", e);
      } finally {
        setLoading(false);
        console.log("[useHandleEmailLink] ⏹️ Finished handling URL");
      }
    };

    // Caso 1: app abierta desde un link inicial (cold start)
    Linking.getInitialURL().then((url) => {
      console.log("[useHandleEmailLink] (cold start) Initial URL:", url);
      handleUrl(url);
    });

    // Caso 2: app ya abierta y llega un link nuevo (hot link)
    const sub = Linking.addEventListener("url", (ev) => {
      console.log("[useHandleEmailLink] (hot link) Event URL:", ev.url);
      handleUrl(ev.url);
    });

    return () => {
      console.log("[useHandleEmailLink] unmounted 🔚");
      sub.remove();
    };
  }, []);

  return { loading };
}