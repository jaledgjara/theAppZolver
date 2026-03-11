// appSRC/notifications/Hooks/usePushNotifications.ts
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/appSRC/auth/Store/AuthStore";
import {
  registerForPushNotificationsAsync,
  savePushTokenToDatabase,
} from "@/appSRC/notifications/Service/NotificationService";

// ---------------------------------------------------------------------------
// usePushNotifications
// ---------------------------------------------------------------------------
// HOOK GLOBAL: Se monta UNA VEZ en _layout.tsx y vive durante toda la sesión.
//
// RESPONSABILIDADES:
//   1. Esperar a que el usuario esté AUTENTICADO (status = authenticated | authenticatedProfessional).
//   2. Pedir permisos + obtener token (registerForPushNotificationsAsync).
//   3. Guardar el token en user_accounts (savePushTokenToDatabase).
//   4. Escuchar notificaciones en FOREGROUND (cuando la app está abierta).
//   5. Escuchar TAP en notificaciones (cuando el usuario toca el banner).
//
// ¿POR QUÉ NO PEDIMOS PERMISOS ANTES DEL LOGIN?
//   Porque el usuario todavía no tiene compromiso con la app.
//   Estadísticamente, si pedís permisos en la pantalla de Welcome,
//   el ratio de rechazo es mucho más alto. Esperamos a que esté logueado.
//
// ¿POR QUÉ RE-REGISTRAMOS CADA VEZ QUE ABRE LA APP?
//   Porque el token puede cambiar si el usuario:
//   - Reinstala la app
//   - Cambia de dispositivo
//   - Borra caché / datos de la app
//   El UPDATE en Supabase es idempotente (si el token es el mismo, no pasa nada).
// ---------------------------------------------------------------------------
export function usePushNotifications() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  // REF para evitar registros duplicados en la misma sesión.
  // Si el status cambia varias veces (ej: re-render), no queremos
  // llamar a registerForPushNotificationsAsync() 5 veces.
  const hasRegistered = useRef(false);

  // -----------------------------------------------------------------
  // EFECTO 1: Registro de token (solo cuando el usuario está autenticado)
  // -----------------------------------------------------------------
  useEffect(() => {
    const isAuthenticated = status === "authenticated" || status === "authenticatedProfessional";

    // GUARDS: No ejecutar si no está autenticado, no hay user, o ya registramos.
    if (!isAuthenticated) return;
    if (!user?.uid) return;
    if (hasRegistered.current) return;

    const register = async () => {
      try {
        console.log(
          `🔔 [usePushNotifications] Iniciando registro. Status: ${status} | UID: ${user.uid}`,
        );

        const token = await registerForPushNotificationsAsync();

        if (!token) {
          console.warn(
            "⚠️ [usePushNotifications] No se obtuvo token (permisos denegados o simulador).",
          );
          return;
        }

        console.log(`🔔 [usePushNotifications] Token obtenido. Guardando en DB...`);

        // Guardar en DB. Retorna true si el UPDATE realmente afectó la fila.
        const saved = await savePushTokenToDatabase(user.uid, token);

        if (saved) {
          // Solo marcamos como registrado si el save fue exitoso.
          hasRegistered.current = true;
          console.log("✅ [usePushNotifications] Registro completo.");
        } else {
          // Si falló, NO marcamos hasRegistered para que reintente
          // en el próximo cambio de status o re-render.
          console.warn("⚠️ [usePushNotifications] Token no guardado. Se reintentará.");
        }
      } catch (error) {
        console.error("❌ [usePushNotifications] Error en registro:", error);
      }
    };

    register();
  }, [status, user?.uid]);

  // -----------------------------------------------------------------
  // EFECTO 2: Listeners de notificaciones (foreground + tap)
  // -----------------------------------------------------------------
  // Estos listeners se montan SIEMPRE, independiente del estado de auth.
  // ¿Por qué? Porque una notificación puede llegar justo mientras
  // el usuario está en la pantalla de login, y queremos manejarla
  // correctamente cuando complete el auth.
  // -----------------------------------------------------------------
  useEffect(() => {
    // LISTENER A: Notificación recibida en FOREGROUND.
    // Se dispara cuando la app está ABIERTA y llega un push.
    // El banner se muestra gracias al setNotificationHandler del Service.
    // Aquí podés agregar lógica extra (ej: refrescar una lista, mostrar badge).
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log(
        "📬 [usePushNotifications] Notificación recibida en foreground:",
        notification.request.content.title,
      );
      // Supabase Realtime maneja las actualizaciones en tiempo real.
      // No se necesita refetch manual.
    });

    // LISTENER B: El usuario TOCÓ la notificación (desde banner o lock screen).
    // Aquí es donde navegás a la pantalla correspondiente.
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log(
          "👆 [usePushNotifications] Usuario tocó notificación. Data:",
          JSON.stringify(data),
        );

        // NAVEGACIÓN BASADA EN DATA:
        // Cuando envíes push desde el backend, incluí un campo "screen" y "params"
        // en el payload. Ejemplo: { screen: "/reservations/123", type: "reservation" }
        if (data?.screen && typeof data.screen === "string") {
          router.push(data.screen as never);
        }
      },
    );

    // CLEANUP: Remover listeners cuando el componente se desmonta.
    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, [router]);

  // Este hook no retorna nada. Es "fire and forget".
  // Su único trabajo es existir montado en _layout.tsx.
}
