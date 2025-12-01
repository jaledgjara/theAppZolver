import { auth } from "@/APIconfig/firebaseAPIConfig";
import { AuthStatus, AuthUser } from "../Type/AuthUser";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  OAuthProvider,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithCredential,
  signInWithEmailLink,
  signOut,
} from "firebase/auth";
import { SignInResult } from "../Type/SignInResult";
import { useAuthStore } from "../Store/AuthStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { syncUserSession } from "./SessionService";

// Helper to construct the AuthUser object
export function mapFirebaseUserToAuthUser(
  fbUser: import("firebase/auth").User,
  opts?: {
    phone?: string | null;
    role?: "client" | "professional" | null;
    profileComplete?: boolean;
    legalName?: string | null;
    identityStatus?: string | null; // 👈 Param opcional
  }
): AuthUser {
  // 🔥 Lógica de Prioridad: Si Supabase tiene nombre, lo usamos.
  // Si no, fallback a Firebase displayName.
  const finalName = opts?.legalName || fbUser.displayName || null;

  return {
    uid: fbUser.uid,
    email: fbUser.email ?? null,
    displayName: finalName, // Usamos el mismo valor para ambos
    legalName: finalName,
    photoURL: fbUser.photoURL ?? null,
    phoneNumber: opts?.phone ?? fbUser.phoneNumber ?? null,
    role: opts?.role ?? null,
    profileComplete: opts?.profileComplete ?? false,
    identityStatus: opts?.identityStatus ?? null, // Guardamos status
  };
}

export function initializeAuthListener() {
  const { setStatus, setUser, setBootLoading } = useAuthStore.getState();

  const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      console.log("[AuthListener] No Firebase user → anonymous");
      setUser(null);
      setStatus("anonymous");
      setBootLoading(false);
      return;
    }

    try {
      console.log("[AuthListener] Firebase user detected → syncUserSession()");
      const backend = await syncUserSession(); // 🔥 Fetch de Supabase

      const storedProfile = await AsyncStorage.getItem("profileComplete");
      const localProfileFlag = storedProfile === "true";

      const phone = backend?.phone ?? fbUser.phoneNumber ?? null;
      const role = backend?.role ?? null;
      const profileComplete =
        backend?.profile_complete ?? localProfileFlag ?? false;
      const identityStatus = backend?.identityStatus ?? "pending";

      // 🔥 Mapeo completo
      const appUser = mapFirebaseUserToAuthUser(fbUser, {
        phone,
        role,
        profileComplete,
        legalName: backend?.legal_name,
        identityStatus,
      });

      useAuthStore.getState().setUser(appUser);

      // 🔥 Decisión de estado
      const nextStatus: AuthStatus = decideAuthStatus({
        hasPhone: !!phone,
        role,
        profileComplete,
        identityStatus,
      });

      useAuthStore.getState().setStatus(nextStatus);

      console.log(
        `[AuthListener] ✅ Sesión sincronizada → status=${nextStatus}`,
        {
          role,
          profileComplete,
          identityStatus,
          legalName: backend?.legal_name,
        }
      );
    } catch (err: any) {
      console.error("[AuthListener] ❌ Error syncing session:", err.message);
      // Fallback seguro
      const fallbackUser = mapFirebaseUserToAuthUser(fbUser, {
        profileComplete: false,
      });
      useAuthStore.getState().setUser(fallbackUser);
      useAuthStore.getState().setStatus("preAuth");
    } finally {
      setBootLoading(false);
    }
  });

  return unsubscribe;
}

function decideAuthStatus(params: {
  hasPhone: boolean;
  role: "client" | "professional" | null;
  profileComplete: boolean;
  identityStatus?: string;
}): AuthStatus {
  const { hasPhone, role, profileComplete, identityStatus } = params;

  if (!hasPhone) return "preAuth";

  if (hasPhone && !role) return "phoneVerified";

  if (role === "client") return "authenticated";

  // Lógica profesional con identityStatus
  if (role === "professional") {
    if (!profileComplete) return "preProfessionalForm";

    // Verifica los strings exactos que uses en tu base de datos
    if (identityStatus === "approved" || identityStatus === "verified") {
      return "authenticatedProfessional";
    }
    if (identityStatus === "rejected") {
      return "rejected";
    }

    return "pendingReview"; // Si es 'pending' u otro
  }

  return "preAuth";
}

// appSRC/auth/Service/AuthService.tsx

/**
 * Actualiza el nombre completo (legal_name) en el backend y store.
 */
export async function updateUserIdentity(fullName: string): Promise<boolean> {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("No token");

    // 1. Backend: Enviamos el string completo "Juan Carlos de la Vega"
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL_FUNCTIONS}/update-user-identity`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ legal_name: fullName }), // <--- Enviamos solo una clave
      }
    );

    // 2. Store: Actualización Optimista
    const { user, setUser } = useAuthStore.getState();

    if (user) {
      setUser({
        ...user,
        legalName: fullName, // Guardamos el dato
        displayName: fullName, // Actualizamos lo que ve la UI
      });
    }

    return true;
  } catch (error) {
    console.error("Error updating identity:", error);
    return false;
  }
}

// -----------------
// SIGN IN FUNC´S
// -----------------

export async function signInWithAppleFirebase(): Promise<SignInResult> {
  try {
    // 1) Abrimos la hoja nativa de Apple (UI del sistema)
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // 2) Validamos que Apple nos devolvió un identityToken (JWT)
    if (!appleCredential.identityToken) {
      return { ok: false, message: "Missing identity token from Apple" };
    }

    // 3) Creamos proveedor 'apple.com' y su credencial para Firebase
    const provider = new OAuthProvider("apple.com");
    const credential = provider.credential({
      idToken: appleCredential.identityToken,
    });

    // 4) Autenticamos en Firebase con esa credencial
    await signInWithCredential(auth, credential);

    // 5) Le pedimos a Firebase el usuario ya autenticado (sanity check)
    const current = auth.currentUser;
    if (!current) {
      return { ok: false, message: "No current user after Apple sign-in" };
    }

    // 6) Devolvemos tu AuthUser tipado y compacto
    return { ok: true, user: mapFirebaseUserToAuthUser(current) };
  } catch (e: any) {
    // Cancelación del usuario desde la hoja nativa de Apple
    if (e?.code === "ERR_CANCELED") {
      return { ok: false, message: "Canceled by user" };
    }
    // Otros errores (red, configuración, etc.)
    return { ok: false, code: e?.code, message: e?.message ?? String(e) };
  }
}

WebBrowser.maybeCompleteAuthSession(); // limpia sesiones previas
export async function signInWithGoogleCredential(
  idToken: string
): Promise<SignInResult> {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);

    const current = auth.currentUser;
    if (!current) {
      return { ok: false, message: "No user after Google sign-in" };
    }

    return { ok: true, user: mapFirebaseUserToAuthUser(current) };
    console.log("RESPUESTA CORRECTA DE GOOGLE:");
  } catch (e: any) {
    return { ok: false, code: e?.code, message: e?.message ?? String(e) };
  }
}

/**
 * Cierra sesión en Firebase y limpia el store global.
 * Lleva al usuario al estado "anonymous" (SignInScreen).
 */
export async function signOutFirebase(): Promise<void> {
  const { reset, setStatus } = useAuthStore.getState();

  try {
    console.log("[AuthService] signOut → closing Firebase session");
    await signOut(auth);

    console.log("[AuthService] store reset to ANONYMOUS");
  } catch (e: any) {
    console.warn("[AuthService] signOut error:", e);
  }
}

export async function sendSignInLinkToEmailFirebase(
  email: string
): Promise<SignInResult> {
  try {
    const actionCodeSettings = {
      url: "https://thezolverapp.web.app/auth/complete",
      handleCodeInApp: true,
      iOS: { bundleId: "com.the.zolver.app" },
      android: { packageName: "com.the.zolver.app", installApp: true },
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    await AsyncStorage.setItem("lastEmail", email);

    console.log(`[Passwordless] Link sent to ${email}`);
    return { ok: true, user: null as any };
  } catch (e: any) {
    console.error("[Passwordless] Error sending link:", e);
    return { ok: false, message: e?.message ?? "Error sending link" };
  }
}

/**
 * Maneja el link cuando el usuario vuelve desde el correo.
 */
export async function handleSignInWithEmailLinkFirebase(
  url?: string | null
): Promise<SignInResult> {
  try {
    if (!url) {
      console.log(
        "[Passwordless] No URL provided to handleSignInWithEmailLinkFirebase"
      );
      return { ok: false, message: "No URL provided" };
    }

    if (!isSignInWithEmailLink(auth, url)) {
      console.log("[Passwordless] Not a valid Firebase email link");
      return { ok: false, message: "Invalid sign-in link" };
    }

    const savedEmail = await AsyncStorage.getItem("lastEmail");
    if (!savedEmail) {
      return { ok: false, message: "Missing saved email" };
    }

    const cred = await signInWithEmailLink(auth, savedEmail, url);
    const fbUser = cred.user;

    const appUser = mapFirebaseUserToAuthUser(fbUser, {
      profileComplete: true,
    });
    console.log("[Passwordless] Successful sign-in via link", appUser.email);

    return { ok: true, user: appUser };
  } catch (e: any) {
    console.error("[Passwordless] Error completing sign-in:", e);
    return { ok: false, message: e?.message ?? "Error completing sign-in" };
  }
}
