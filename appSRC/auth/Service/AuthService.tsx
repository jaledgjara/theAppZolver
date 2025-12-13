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
  User,
} from "firebase/auth";
import { SignInResult } from "../Type/SignInResult";
import { useAuthStore } from "../Store/AuthStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { syncUserSession } from "./SessionService";
import {
  ProfessionalTypeWork,
  useProfessionalOnboardingStore,
} from "../Type/ProfessionalAuthUser";

// =========================================================
// 1. Mappers & Helpers
// =========================================================

export function mapFirebaseUserToAuthUser(
  fbUser: User,
  opts?: {
    phone?: string | null;
    role?: "client" | "professional" | "admin" | null;
    profileComplete?: boolean;
    legalName?: string | null;
    identityStatus?: string | null;
  }
): AuthUser {
  // 🔥 Lógica de Prioridad: Si Supabase tiene nombre, lo usamos.
  // Si no, fallback a Firebase displayName.
  const finalName = opts?.legalName || fbUser.displayName || null;

  return {
    uid: fbUser.uid,
    email: fbUser.email ?? null,
    displayName: finalName,
    legalName: finalName,
    photoURL: fbUser.photoURL ?? null,
    phoneNumber: opts?.phone ?? fbUser.phoneNumber ?? null,
    role: opts?.role ?? null,
    profileComplete: opts?.profileComplete ?? false,
    identityStatus: opts?.identityStatus ?? null,
  };
}

/**
 * Lógica centralizada para determinar el estado de la App
 * basándose en los datos del usuario.
 */
function decideAuthStatus(params: {
  hasPhone: boolean;
  role: "client" | "professional" | "admin" | null;
  profileComplete: boolean;
  identityStatus?: string | null;
}): AuthStatus {
  const { hasPhone, role, profileComplete, identityStatus } = params;

  // 1. Si no hay teléfono, flujo básico incompleto
  if (!hasPhone) return "preAuth";

  // 2. Si hay teléfono pero no rol seleccionado
  if (hasPhone && !role) return "phoneVerified";

  // 3. Cliente: Si tiene rol, pasa directo
  if (role === "client") return "authenticated";

  // 4. Profesional: Lógica de aprobación y formulario
  if (role === "professional") {
    if (!profileComplete) return "preProfessionalForm";

    // Verificar estados de identidad (ajusta los strings según tu DB)
    if (identityStatus === "approved" || identityStatus === "verified") {
      return "authenticatedProfessional";
    }
    if (identityStatus === "rejected") {
      return "rejected";
    }

    // Si completó perfil pero no está aprobado ni rechazado
    return "pendingReview";
  }

  // Fallback por seguridad
  return "preAuth";
}

// =========================================================
// 2. Listener Principal (Auth Guard Logic)
// =========================================================

// ... imports existentes

export function initializeAuthListener() {
  const { setUser, setStatus, setBootLoading } = useAuthStore.getState();

  console.log("👂 [AuthListener] Subscribing to Firebase Auth state...");

  return onAuthStateChanged(auth, async (firebaseUser) => {
    // 1. Caso: Usuario Deslogueado
    if (!firebaseUser) {
      console.log("⚪ [AuthListener] No User -> Welcome Screen (unknown)");
      setUser(null);
      setStatus("unknown");
      setBootLoading(false);
      return;
    }

    // 2. Caso: Usuario Detectado -> Sincronización
    try {
      console.log("🔄 [AuthListener] Syncing with Supabase...");

      const backendSession = await syncUserSession();

      // Validación Zombie (Firebase Ok, pero BD falló o no existe)
      if (!backendSession || !backendSession.ok) {
        console.warn("🧟 [AuthListener] Zombie User detected!");
        await signOut(auth);
        return;
      }

      console.log("✅ [AuthListener] Session Valid synced");

      // Mapeo
      const appUser = mapFirebaseUserToAuthUser(firebaseUser, {
        role: backendSession.role,
        profileComplete: backendSession.profile_complete,
        legalName: backendSession.legal_name,
        phone: backendSession.phone,
        identityStatus: backendSession.identityStatus,
      });

      setUser(appUser);

      // Decisión de Estado
      const nextStatus = decideAuthStatus({
        hasPhone: !!backendSession.phone,
        role: backendSession.role,
        profileComplete: backendSession.profile_complete,
        identityStatus: backendSession.identityStatus,
      });

      // =================================================================
      // 🕵️‍♂️ ZOLVER DEBUGGER: "THE HUGE CONSOLE LOG"
      // =================================================================
      console.log("\n");
      console.log(
        "╔════════════════════════════════════════════════════════════╗"
      );
      console.log(
        "║               🚀 ZOLVER SESSION DEBUGGER                   ║"
      );
      console.log(
        "╠════════════════════════════════════════════════════════════╣"
      );
      console.log(`║ 👤 User Name:    ${appUser.displayName || "Sin Nombre"} `);
      console.log(`║ 📧 Email:        ${appUser.email} `);
      console.log(`║ 🆔 UID:          ${appUser.uid.substring(0, 8)}... `);
      console.log(`║ 🎭 Role:         ${backendSession.role || "N/A"} `);
      console.log(
        "╠────────────────────────────────────────────────────────────╣"
      );

      // --- LÓGICA ESPECÍFICA PARA PROFESIONALES ---
      if (backendSession.role === "professional") {
        // Leemos el dato que viene de SessionService (inyectado desde la Edge Function)
        const profType = (backendSession as any).type_work;

        console.log(
          `║ 🛠  TYPE WORK:    [ ${
            profType ? profType.toUpperCase() : "UNDEFINED"
          } ]  <-- LOOK HERE!`
        );
        console.log(`║ 📡 Identity:     ${backendSession.identityStatus} `);
        console.log(
          `║ ✅ Completed:    ${
            backendSession.profile_complete ? "YES" : "NO"
          } `
        );

        // 🔥🔥🔥 CORRECCIÓN CRÍTICA 🔥🔥🔥
        // Si detectamos un modo de trabajo, lo guardamos en el Store Global
        // para que la UI sepa qué pantalla mostrar.
        if (profType) {
          console.log(`💾 [AuthService] Saving TypeWork to Store: ${profType}`);
          useProfessionalOnboardingStore.getState().setData({
            typeWork: profType as ProfessionalTypeWork,
          });
        }
        // 🔥🔥🔥 FIN CORRECCIÓN 🔥🔥🔥
      } else {
        console.log(`║ 👤 Client Mode:  Active`);
      }

      console.log(`║ 🔀 Next Status:  ${nextStatus}`);
      console.log(
        "╚════════════════════════════════════════════════════════════╝"
      );
      console.log("\n");
      // =================================================================

      setStatus(nextStatus);
    } catch (error) {
      console.error("🔴 [AuthListener] Error syncing:", error);
      setUser(null);
      setStatus("unknown");
    } finally {
      setBootLoading(false);
    }
  });
}
// =========================================================
// 3. User Actions & Updates
// =========================================================

/**
 * Actualiza el nombre completo (legal_name) en el backend y store.
 */
export async function updateUserIdentity(fullName: string): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");

    const token = await user.getIdToken();

    // 1. Backend: Enviamos el nombre a la Edge Function
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL_FUNCTIONS}/update-user-identity`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ legal_name: fullName }),
      }
    );

    if (!res.ok) {
      console.error("Failed to update identity in backend");
      return false;
    }

    // 2. Store: Actualización Optimista
    const store = useAuthStore.getState();
    if (store.user) {
      store.setUser({
        ...store.user,
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
