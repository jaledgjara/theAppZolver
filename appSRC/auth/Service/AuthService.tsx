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
import {
  setSupabaseAuthToken,
  supabase,
} from "@/appSRC/services/supabaseClient";

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

function decideAuthStatus(params: {
  hasPhone: boolean;
  role: "client" | "professional" | "admin" | null;
  profileComplete: boolean;
  identityStatus?: string | null;
}): AuthStatus {
  const { hasPhone, role, profileComplete, identityStatus } = params;

  if (!hasPhone) return "preAuth";
  if (hasPhone && !role) return "phoneVerified";
  if (role === "client") return "authenticated";
  if (role === "professional") {
    if (!profileComplete) return "preProfessionalForm";
    if (identityStatus === "approved" || identityStatus === "verified") {
      return "authenticatedProfessional";
    }
    if (identityStatus === "rejected") return "rejected";
    return "pendingReview";
  }
  return "preAuth";
}

// =========================================================
// 2. Listener Principal (Auth Guard Logic)
// =========================================================

export function initializeAuthListener() {
  const { setUser, setStatus, setBootLoading } = useAuthStore.getState();
  console.log("🎧 [AuthSystem] Inicializando Listener de Seguridad...");

  return onAuthStateChanged(auth, async (firebaseUser) => {
    // ----------------------------------------------------
    // ESCENARIO 1: USUARIO DESCONECTADO (O CERRÓ SESIÓN)
    // ----------------------------------------------------
    if (!firebaseUser) {
      // 🕵️‍♂️ INTELLIGENT ROUTING
      // Antes de borrar nada, miramos si el store tenía un usuario.
      // - Si tenía usuario (wasLoggedIn), significa que el usuario pulsó "Salir" -> Vamos a SignIn.
      // - Si NO tenía usuario (null), significa que es un Cold Boot -> Vamos a Welcome.
      const wasLoggedIn = !!useAuthStore.getState().user;

      const targetStatus: AuthStatus = wasLoggedIn ? "anonymous" : "unknown";

      console.log("\n🔻 [AuthListener] Detectado: NO HAY USUARIO (Null)");
      console.log(
        `   ↳ Contexto: ${wasLoggedIn ? "Cierre de Sesión" : "Inicio en Frío"}`
      );
      console.log(`   ↳ Acción: Redirigiendo a '${targetStatus}'`);

      setUser(null);
      setStatus(targetStatus); // 👈 AQUÍ ESTÁ LA MAGIA

      setBootLoading(false);
      return;
    }

    // ----------------------------------------------------
    // ESCENARIO 2: USUARIO DETECTADO -> SINCRONIZACIÓN
    // ----------------------------------------------------
    try {
      console.log("\n🔄 [AuthListener] Detectado: USUARIO FIREBASE ACTIVO");
      console.log(`   ↳ UID: ${firebaseUser.uid.slice(0, 10)}...`);
      console.log("   ↳ Paso 1: Sincronizando sesión con Supabase DB...");

      const backendSession = await syncUserSession();

      // Validación Zombie
      if (!backendSession || !backendSession.ok) {
        console.warn(
          "   ⚠️ [AuthListener] ALERTA: Usuario Zombie (Firebase OK, DB Falló)"
        );
        console.log("   ↳ Acción: Forzando cierre de sesión para limpiar.");
        await signOut(auth);
        return;
      }

      console.log(
        "   ✅ [AuthListener] Paso 2: Sesión Sincronizada Correctamente"
      );
      // 👇👇👇 AQUÍ ESTÁ LA SOLUCIÓN 👇👇👇
      // Inyectamos el token que nos dio la Edge Function en el cliente de Supabase
      if (backendSession.token) {
        setSupabaseAuthToken(backendSession.token);
      } else {
        console.warn(
          "   ⚠️ [AuthListener] El backend no devolvió un token JWT."
        );
      }
      // 👆👆👆 FIN DEL CAMBIO 👆👆👆
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

      // ---------------- LOG DIDÁCTICO ZOLVER ----------------
      console.log("\n");
      console.log("╔════════════════════════════════════════════════════╗");
      console.log("║ 🧠 ZOLVER BRAIN: DECISIÓN DE ESTADO                ║");
      console.log("╠════════════════════════════════════════════════════╣");
      console.log(`║ 👤 Usuario:      ${appUser.displayName || "Sin Nombre"}`);
      console.log(
        `║ 📱 Teléfono:     ${
          backendSession.phone ? "✅ Verificado" : "❌ Faltante"
        }`
      );
      console.log(`║ 🎭 Rol:          ${backendSession.role || "❌ Sin Rol"}`);

      if (backendSession.role === "professional") {
        const profType = (backendSession as any).type_work;
        console.log(
          `║ 🛠  Modo Trabajo: ${profType ? profType.toUpperCase() : "N/A"}`
        );
        console.log(`║ 📡 Estado ID:    ${backendSession.identityStatus}`);

        // Guardado en Store del Profesional
        if (profType) {
          useProfessionalOnboardingStore.getState().setData({
            typeWork: profType as ProfessionalTypeWork,
          });
        }
      }

      console.log("╠────────────────────────────────────────────────────╣");
      console.log(`║ 🏁 ESTADO FINAL: [ ${nextStatus.toUpperCase()} ]`);
      console.log("╚════════════════════════════════════════════════════╝");
      console.log("\n");
      // -------------------------------------------------------

      setStatus(nextStatus);
    } catch (error) {
      console.error(
        "🔴 [AuthListener] Error crítico durante la sincronización:",
        error
      );
      setUser(null);
      setStatus("unknown");
    } finally {
      // 🔓 DESBLOQUEO FINAL:
      // Sea cual sea el resultado, dejamos de mostrar el "Cargando..."
      console.log("🔓 [AuthListener] Proceso terminado. Desbloqueando UI.\n");
      setBootLoading(false);
    }
  });
}

// =========================================================
// 3. User Actions & Updates (CON LOADING LOGIC)
// =========================================================

export async function updateUserIdentity(fullName: string): Promise<boolean> {
  // Nota: Aquí NO bloqueamos toda la pantalla (bootLoading) porque suele ser
  // una acción dentro de un formulario, preferible usar un 'isLoading' local.
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");

    const token = await user.getIdToken();

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

    const store = useAuthStore.getState();
    if (store.user) {
      store.setUser({
        ...store.user,
        legalName: fullName,
        displayName: fullName,
      });
    }

    return true;
  } catch (error) {
    console.error("Error updating identity:", error);
    return false;
  }
}

// -----------------
// SIGN IN FUNC´S (LOADING FIRST)
// -----------------

export async function signInWithAppleFirebase(): Promise<SignInResult> {
  const { setBootLoading } = useAuthStore.getState();

  try {
    // 1. Apple UI no se puede tapar con loader, así que esperamos al token.
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!appleCredential.identityToken) {
      return { ok: false, message: "Missing identity token from Apple" };
    }

    // 🔒 BLOQUEO AHORA: Ya tenemos el OK del usuario, empieza el proceso interno
    console.log("🔒 [AuthService] Apple Login iniciado. Bloqueando UI...");
    setBootLoading(true);

    const provider = new OAuthProvider("apple.com");
    const credential = provider.credential({
      idToken: appleCredential.identityToken,
    });

    await signInWithCredential(auth, credential);

    // NOTA: No hacemos setBootLoading(false) aquí.
    // El AuthListener se disparará, hará la sync y ÉL desbloqueará.

    return { ok: true, user: mapFirebaseUserToAuthUser(auth.currentUser!) };
  } catch (e: any) {
    // Si falló o canceló, debemos desbloquear
    setBootLoading(false);

    if (e?.code === "ERR_CANCELED") {
      return { ok: false, message: "Canceled by user" };
    }
    return { ok: false, code: e?.code, message: e?.message ?? String(e) };
  }
}

WebBrowser.maybeCompleteAuthSession();
export async function signInWithGoogleCredential(
  idToken: string
): Promise<SignInResult> {
  const { setBootLoading } = useAuthStore.getState();

  try {
    // 🔒 BLOQUEO: El usuario ya volvió de Google, empieza el handshake con Firebase
    console.log(
      "🔒 [AuthService] Google Credential recibida. Bloqueando UI..."
    );
    setBootLoading(true);

    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);

    console.log(
      "✅ [AuthService] Google Sign-In exitoso. Esperando AuthListener..."
    );
    // Dejamos que el Listener desbloquee la UI

    return { ok: true, user: mapFirebaseUserToAuthUser(auth.currentUser!) };
  } catch (e: any) {
    console.error("❌ [AuthService] Error Google Sign-In:", e);
    // Error -> Desbloqueamos
    setBootLoading(false);
    return { ok: false, code: e?.code, message: e?.message ?? String(e) };
  }
}

export async function signOutFirebase(): Promise<void> {
  const { setBootLoading } = useAuthStore.getState();

  try {
    // 🔒 BLOQUEO: Feedback inmediato al pulsar "Salir"
    console.log("🔒 [AuthService] Cerrando sesión... Bloqueando UI.");
    setBootLoading(true);

    await signOut(auth);

    // El Listener detectará 'null', pondrá status 'anonymous' y desbloqueará.
  } catch (e: any) {
    console.warn("[AuthService] signOut error:", e);
    setBootLoading(false);
  }
}
// ... imports anteriores

export async function deleteUserAccount(): Promise<{
  ok: boolean;
  message?: string;
}> {
  const { setBootLoading, reset } = useAuthStore.getState();

  try {
    console.log(
      "🔒 [AuthService] Iniciando protocolo de eliminación segura..."
    );
    setBootLoading(true);

    const user = auth.currentUser;
    if (!user) {
      throw new Error("No hay sesión activa para eliminar.");
    }

    // 1. Llamada a RPC de Supabase (Lógica de Negocio)
    const { error: dbError } = await supabase.rpc("delete_user_account_safe");

    if (dbError) {
      console.error("❌ [AuthService] Rechazo de DB:", dbError.message);

      // Manejo del error de bloqueo definido en SQL
      if (dbError.message.includes("BLOCK_ACTIVE_RESERVATIONS")) {
        return {
          ok: false,
          message:
            "No puedes eliminar tu cuenta mientras tengas servicios activos o pendientes. Finalízalos o cancélalos primero.",
        };
      }

      throw new Error(
        "Error técnico al procesar la solicitud. Contacte a soporte."
      );
    }

    // 2. Eliminación en Firebase Auth (Identidad)
    // Si llegamos aquí, Supabase ya validó y limpió los datos.
    await user.delete();

    // 3. Limpieza Local
    await AsyncStorage.removeItem("user_session");
    reset();

    return { ok: true };
  } catch (e: any) {
    console.error("❌ [AuthService] Excepción en Delete Account:", e);
    setBootLoading(false);

    // Manejo de Re-autenticación obligatoria de Firebase
    if (e.code === "auth/requires-recent-login") {
      return {
        ok: false,
        message:
          "Por seguridad, esta acción requiere que inicies sesión nuevamente. Sal de la app y vuelve a entrar.",
      };
    }

    return {
      ok: false,
      message: e.message || "No se pudo eliminar la cuenta.",
    };
  }
}
