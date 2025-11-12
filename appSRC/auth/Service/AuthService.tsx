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


export const mapFirebaseUserToAuthUser = (fb: FirebaseUser, extra?: Partial<AuthUser>): AuthUser => {
  return {
    uid: fb.uid,
    email: fb.email ?? null,
    phoneNumber: fb.phoneNumber ?? null,
    displayName: fb.displayName ?? null,
    photoURL: fb.photoURL ?? null,
    profileComplete: extra?.profileComplete ?? false,
  };
};

export function initializeAuthListener() {
  // Read setters once, from Zustand's getState (no re-renders)
  const { setStatus, setUser, setBootLoading } = useAuthStore.getState();

  console.log("[AuthListener] init → subscribing to Firebase onAuthStateChanged");

  const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
    console.log(
      `[AuthListener] onAuthStateChanged fired → fbUser=${fbUser ? fbUser.uid : "none"}`
    );

    // CASE A: No Firebase session
    if (!fbUser) {
      console.log(
        "[AuthListener] no Firebase user → keep status=unknown; stop boot loader"
      );
      setUser(null);
      setBootLoading(false);
      return;
    }

    // CASE B: There is a Firebase user
    console.log("[AuthListener] Firebase user present → check profileComplete flag");

    // (MVP) read a local cached flag; later this can come from your backend
    const storedProfileFlag = await AsyncStorage.getItem("profileComplete");
    const profileComplete = storedProfileFlag === "true";
    console.log(`[AuthListener] profileComplete(local)=${profileComplete}`);

    const appUser = mapFirebaseUserToAuthUser(fbUser, { profileComplete });
    setUser(appUser);

    const nextStatus: AuthStatus = profileComplete ? "authenticated" : "preAuth";
    console.log(`[AuthListener] setStatus(${nextStatus})`);
    setStatus(nextStatus);

    // When user exists we implicitly finished boot as well
    console.log("[AuthListener] stop boot loader");
    setBootLoading(false);
  });

  return unsubscribe;
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

    console.log("Pre auth, FOR NOW...");
    reset();
    // setStatus("anonymous");

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
