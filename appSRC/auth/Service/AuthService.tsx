import { auth } from "@/APIconfig/firebaseAPIConfig";
import { AuthStatus, AuthUser } from "../Type/AuthUser";
import * as AppleAuthentication from "expo-apple-authentication";
import {
  OAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  type User as FirebaseUser,
} from "firebase/auth";
import { SignInResult } from "../Type/SignInResult";
import { useAuthStore } from "../Store/AuthStore";
import AsyncStorage from "@react-native-async-storage/async-storage";


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

/**
 * Escucha el estado global de autenticación de Firebase y sincroniza el Zustand store.
 * Se invoca una sola vez desde useAuthGuard().
 */
export function initializeAuthListener() {
  const { setStatus, setUser } = useAuthStore.getState();

  const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    console.log("[AuthListener] Firebase user changed:", fbUser?.uid ?? "none");

    if (!fbUser) {
      // 🔸 Sin usuario logueado → estado anónimo
      setUser(null);
      setStatus("anonymous");
      return;
    }

    // 🔸 Usuario logueado → verificamos si su perfil está completo
    const storedProfileFlag = await AsyncStorage.getItem("profileComplete");
    const profileComplete = storedProfileFlag === "true";

    // 🔸 Mapeamos el usuario al formato AuthUser
    const appUser = mapFirebaseUserToAuthUser(fbUser, { profileComplete });
    setUser(appUser);

    // 🔸 Determinamos el estado
    let nextStatus: AuthStatus;
    if (profileComplete) nextStatus = "authenticated";
    else nextStatus = "preAuth";

    setStatus(nextStatus);
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