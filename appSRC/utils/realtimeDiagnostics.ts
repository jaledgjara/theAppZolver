/**
 * Realtime diagnostics helper
 *
 * El callback `.subscribe((status, err) => ...)` de Supabase Realtime
 * suele devolver `err` como un objeto vacío `{}` o `undefined` cuando
 * tira CHANNEL_ERROR, lo que impide diagnosticar el problema.
 *
 * Este módulo extrae la mayor cantidad de contexto posible del error
 * (incluyendo propiedades no enumerables) + estado del canal + presencia
 * del JWT en Realtime, y lo loguea a consola en dev + Sentry en prod.
 */

import * as Sentry from "@sentry/react-native";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/appSRC/services/supabaseClient";
import { logger } from "./logger";

/**
 * Serializa un error capturando props enumerables y no enumerables.
 * Supabase a veces devuelve objetos Error "pelados" donde JSON.stringify
 * pierde la info (message, stack, code, etc.).
 */
function serializeError(err: unknown): Record<string, unknown> {
  if (err == null) return { value: err };
  if (typeof err !== "object") return { value: String(err), type: typeof err };

  const out: Record<string, unknown> = {};
  for (const key of Object.getOwnPropertyNames(err)) {
    try {
      out[key] = (err as Record<string, unknown>)[key];
    } catch {
      out[key] = "<unreadable>";
    }
  }
  // Meta útil para entender qué tipo de objeto vino
  out.__constructor = (err as { constructor?: { name?: string } })?.constructor?.name ?? "unknown";
  return out;
}

/**
 * Extrae estado interno del cliente Realtime que ayuda a diagnosticar.
 * Usa acceso `any` porque varias props internas no están en los types.
 */
function getRealtimeSnapshot(channel: RealtimeChannel | null) {
  const rt = supabase.realtime as unknown as {
    accessToken?: string | null;
    isConnected?: () => boolean;
    connectionState?: () => string;
  };

  const token = rt.accessToken ?? null;
  let jwtExpMinutesLeft: number | null = null;
  if (token) {
    try {
      const payload = JSON.parse(
        // atob is available in Hermes & web

        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      ) as { exp?: number };
      if (payload.exp) {
        jwtExpMinutesLeft = Math.round((payload.exp - Date.now() / 1000) / 60);
      }
    } catch {
      jwtExpMinutesLeft = null;
    }
  }

  return {
    topic: channel?.topic ?? null,
    channelState: (channel as unknown as { state?: string })?.state ?? null,
    socketConnected: typeof rt.isConnected === "function" ? rt.isConnected() : null,
    socketState: typeof rt.connectionState === "function" ? rt.connectionState() : null,
    hasAccessToken: token != null,
    jwtExpMinutesLeft,
    totalChannels: supabase.getChannels().length,
  };
}

/**
 * Reporta un CHANNEL_ERROR / TIMED_OUT con todo el contexto disponible.
 *
 * @param context  Etiqueta del suscriptor (ej. "ProIncomingRequests")
 * @param status   El status que vino del callback de subscribe
 * @param err      El error que vino del callback de subscribe
 * @param channel  El canal que tiró el error (para capturar su estado)
 */
export function reportRealtimeError(
  context: string,
  status: string,
  err: unknown,
  channel: RealtimeChannel | null,
) {
  const errorInfo = serializeError(err);
  const snapshot = getRealtimeSnapshot(channel);

  // Dev console: legible, con todos los detalles
  logger.error(
    `[Realtime][${context}] ${status}`,
    "\n  error:",
    errorInfo,
    "\n  snapshot:",
    snapshot,
  );

  // Prod: mandar a Sentry con tags + context estructurado
  try {
    Sentry.captureMessage(`Realtime ${status} in ${context}`, {
      level: "error",
      tags: {
        realtime_context: context,
        realtime_status: status,
      },
      contexts: {
        realtime: {
          ...snapshot,
          error: errorInfo,
        },
      },
    });
  } catch {
    // Nunca dejar que el logger rompa el flujo
  }
}
