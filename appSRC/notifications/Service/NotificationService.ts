// appSRC/notifications/Service/NotificationService.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "@/appSRC/services/supabaseClient";

// ---------------------------------------------------------------------------
// CONFIGURACIÓN GLOBAL DEL HANDLER
// ---------------------------------------------------------------------------
// Esto le dice a Expo QUÉ HACER cuando llega una notificación y la app está
// en FOREGROUND (abierta). Sin esto, la notificación llega pero no se muestra.
//
// - shouldShowAlert: true  → Muestra el banner/pop-up aunque la app esté abierta.
// - shouldPlaySound: true  → Reproduce el sonido del sistema.
// - shouldSetBadge: false  → No incrementa el número del ícono (lo manejamos manual).
// ---------------------------------------------------------------------------
Notifications.setNotificationHandler({
  handleNotification: async (_notification: Notifications.Notification) => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ---------------------------------------------------------------------------
// 1. registerForPushNotificationsAsync
// ---------------------------------------------------------------------------
// FUNCIÓN PURA: No toca la base de datos. Solo habla con el OS y con Expo.
//
// FLUJO INTERNO:
//   1. Verifica que sea un dispositivo FÍSICO (no simulador).
//   2. Pide PERMISOS al usuario (el pop-up nativo de iOS / Android).
//   3. Si el usuario acepta, le pide a Expo un "push token" único.
//   4. En Android, configura el canal de notificación (obligatorio desde Android 8+).
//   5. Retorna el token como string o null si algo falló.
//
// ¿QUÉ ES EL TOKEN?
//   Es un string único por dispositivo + app. Ejemplo:
//   "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
//   Expo lo usa como "dirección de envío" para saber a qué teléfono mandar el push.
// ---------------------------------------------------------------------------
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // GUARD: Solo dispositivos físicos pueden recibir push.
  // Expo no emite tokens reales en simuladores — retornamos null directamente.
  if (!Device.isDevice) {
    console.warn(
      "⚠️ [NotificationService] Simulador detectado. Push notifications no disponibles.",
    );
    return null;
  }

  // PASO 1: Verificar / pedir permisos al usuario.
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Si no tenemos permisos todavía, mostramos el diálogo nativo.
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Si el usuario rechazó, no podemos hacer nada.
  if (finalStatus !== "granted") {
    console.warn("⚠️ [NotificationService] El usuario rechazó los permisos de notificación.");
    return null;
  }

  // PASO 2: Obtener el token de Expo.
  // projectId viene de app.json → extra.eas.projectId.
  // Es el identificador de tu proyecto en los servidores de Expo.
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId) {
    console.error("❌ [NotificationService] Falta projectId en app.json → extra.eas.projectId");
    return null;
  }

  const pushTokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  const token = pushTokenData.data;
  console.log("🔔 [NotificationService] Token obtenido:", token);

  // PASO 3: Canal de Android (obligatorio Android 8+).
  // Sin esto, las notificaciones llegan pero no suenan ni vibran.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

// ---------------------------------------------------------------------------
// 2. savePushTokenToDatabase
// ---------------------------------------------------------------------------
// Guarda el token en la ÚNICA tabla centralizada: user_accounts.
// Como TODOS los usuarios (client, professional, admin) viven en user_accounts,
// no necesitamos duplicar esta columna en professional_profiles.
//
// FLUJO:
//   1. Recibe el auth_uid del usuario logueado y el token.
//   2. Hace un UPDATE en user_accounts donde auth_uid = userId.
//   3. Si falla, loguea el error pero NO crashea la app (fail-safe).
//
// ¿CUÁNDO SE LLAMA?
//   Cada vez que la app se abre (o vuelve a foreground) y el usuario está logueado.
//   Esto garantiza que si el usuario cambió de teléfono o reinstalió la app,
//   el token se actualiza automáticamente.
// ---------------------------------------------------------------------------
export async function savePushTokenToDatabase(userId: string, token: string): Promise<boolean> {
  console.log(`📡 [NotificationService] Guardando token para usuario: ${userId}`);
  console.log(`📡 [NotificationService] Token: ${token}`);

  // Usamos .select() para verificar que el UPDATE realmente afectó filas.
  // Sin .select(), Supabase retorna success aunque RLS bloquee el update.
  const { data, error } = await supabase
    .from("user_accounts")
    .update({ expo_push_token: token })
    .eq("auth_uid", userId)
    .select("auth_uid, expo_push_token")
    .maybeSingle();

  if (error) {
    console.error("❌ [NotificationService] Error al guardar token en DB:", error.message);
    return false;
  }

  if (!data) {
    console.error(
      "❌ [NotificationService] UPDATE retornó 0 filas. Posibles causas:\n",
      "   1. RLS en user_accounts bloquea el UPDATE para este usuario.\n",
      "   2. No existe fila con auth_uid =",
      userId,
    );
    return false;
  }

  console.log("✅ [NotificationService] Token guardado:", data.expo_push_token);
  return true;
}
