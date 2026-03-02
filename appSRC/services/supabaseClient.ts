// appSRC/services/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

/**
 * Inyecta el JWT custom (emitido por session-sync) directamente en los
 * headers del cliente PostgREST y Realtime.
 *
 * NO usamos supabase.auth.setSession() porque valida contra GoTrue,
 * y nuestro JWT es custom (firmado con JWT_SECRET, no emitido por GoTrue).
 * GoTrue rechaza el token si el shadow user no existe en auth.users,
 * causando que el JWT nunca se aplique y todas las queries RLS fallen.
 *
 * Con inyección directa de headers, PostgREST recibe el JWT con el claim
 * `firebase_uid`, y _uid() lo lee correctamente para RLS.
 */
export const setSupabaseAuthToken = (token: string | null) => {
  const authHeader = token
    ? `Bearer ${token}`
    : `Bearer ${supabaseAnonKey}`;

  // Inyectar en el cliente REST (PostgREST) para todas las queries .from()
  // IMPORTANTE: Usar .set() porque rest.headers es un objeto Headers (Web API).
  // Bracket notation (headers["key"] = val) setea una propiedad JS, NO un header HTTP,
  // y se pierde cuando .from() copia con new Headers(this.headers).
  (supabase as any).rest.headers.set("Authorization", authHeader);

  // Inyectar en Realtime para subscripciones en tiempo real
  supabase.realtime.setAuth(token ?? supabaseAnonKey);
};
