import { auth } from "@/APIconfig/firebaseAPIConfig";
import { AuthStatus, AuthUser } from "../Type/AuthUser";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  OAuthProvider,
  onAuthStateChanged,
  PhoneAuthProvider,
  RecaptchaVerifier,
  sendSignInLinkToEmail,
  signInWithCredential,
  signInWithEmailLink,
  signInWithPhoneNumber,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { SignInResult } from "../Type/SignInResult";
import { useAuthStore } from "../Store/AuthStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Platform } from "react-native";
import { syncUserSession } from "./SessionService";


/**
 * Map a Firebase user + backend metadata to our internal AuthUser type.
 * This allows us to merge Firebase identity with SQL state cleanly.
 */
export function mapFirebaseUserToAuthUser(
  fbUser: import("firebase/auth").User,
  opts?: {
    phone?: string | null;
    role?: "client" | "professional" | null;
    profileComplete?: boolean;
  }
): AuthUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email ?? null,
    displayName: fbUser.displayName ?? null,
    photoURL: fbUser.photoURL ?? null,
    phoneNumber: opts?.phone ?? fbUser.phoneNumber ?? null,
    role: opts?.role ?? null,
    profileComplete: opts?.profileComplete ?? false,
  };
}

/**
 * Initializes the Firebase auth listener and synchronizes
 * the SQL state from Supabase via session-sync.
 */
export function initializeAuthListener() {
  const { setStatus, setUser, setBootLoading } = useAuthStore.getState();

  const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
    // No Firebase user → anonymous
    if (!fbUser) {
      console.log("[AuthListener] No Firebase user → anonymous");
      setUser(null);
      setStatus("anonymous");
      setBootLoading(false);
      return;
    }

    try {
      console.log("[AuthListener] Firebase user detected → syncUserSession()");
      const backend = await syncUserSession();

      // fallback local
      const storedProfile = await AsyncStorage.getItem("profileComplete");
      const localProfileFlag = storedProfile === "true";

      const phone = backend?.phone ?? fbUser.phoneNumber ?? null;
      const role = backend?.role ?? null;
      const profileComplete =
        backend?.profile_complete ?? localProfileFlag ?? false;

      // Construimos el usuario app
      const appUser = mapFirebaseUserToAuthUser(fbUser, {
        phone,
        role,
        profileComplete,
      });

      useAuthStore.getState().setUser(appUser);

      // 🔥 DECISIÓN DE ESTADO GLOBAL
      const nextStatus: AuthStatus = decideAuthStatus({
        hasPhone: !!phone,
        role,
        profileComplete,
      });

      useAuthStore.getState().setStatus(nextStatus);

      console.log(
        `[AuthListener] ✅ Sesión sincronizada → status=${nextStatus}`,
        { hasPhone: !!phone, role, profileComplete }
      );
    } catch (err: any) {
      console.error("[AuthListener] ❌ Error syncing session:", err.message);

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

/**
 * Decide the high-level AuthStatus based on SQL + Firebase state.
 * This is the brain of the onboarding flow.
 */
function decideAuthStatus(params: {
  hasPhone: boolean;
  role: "client" | "professional" | null;
  profileComplete: boolean;
}): AuthStatus {
  const { hasPhone, role, profileComplete } = params;

  // 1) No teléfono verificado → siempre preAuth
  if (!hasPhone) {
    return "preAuth";
  }

  // 2) Teléfono verificado pero sin rol → elegir tipo de usuario
  if (hasPhone && !role) {
    return "phoneVerified";
  }

  // 3) Cliente: teléfono + rol client
  if (role === "client") {
    // cliente va al Home; si profileComplete se desincroniza no importa:
    // el gating fuerte está en hasPhone
    return "authenticated";
  }

  // 4) Profesional: requiere formulario extra
  if (role === "professional") {
    if (!profileComplete) {
      return "preProfessionalForm";
    }
    return "authenticated";
  }

  // Fallback seguro
  return "preAuth";
}


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
      idToken: appleCredential.identityToken
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
export async function signInWithGoogleCredential(idToken: string): Promise<SignInResult> {
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

export async function sendSignInLinkToEmailFirebase(email: string): Promise<SignInResult> {
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
export async function handleSignInWithEmailLinkFirebase(url?: string | null): Promise<SignInResult> {
  try {
    if (!url) {
      console.log("[Passwordless] No URL provided to handleSignInWithEmailLinkFirebase");
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

    const appUser = mapFirebaseUserToAuthUser(fbUser, { profileComplete: true });
    console.log("[Passwordless] Successful sign-in via link", appUser.email);

    return { ok: true, user: appUser };
  } catch (e: any) {
    console.error("[Passwordless] Error completing sign-in:", e);
    return { ok: false, message: e?.message ?? "Error completing sign-in" };
  }
}
