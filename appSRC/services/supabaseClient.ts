// appSRC/services/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: false, // Importante: Nosotros controlamos el ciclo
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Inyecta el JWT en el cliente oficial de Supabase.
 * Al usar setSession, Supabase automáticamente pone el header Authorization
 * en todas las llamadas a la base de datos, Storage y Realtime.
 */
export const setSupabaseAuthToken = async (token: string | null) => {
  if (token) {
    console.log("🎟️ [SupabaseClient] Estableciendo Sesión Oficial...");

    // Usamos setSession. El 'refresh_token' es dummy porque no lo usaremos
    // (autoRefreshToken está en false), pero la función lo requiere.
    const { error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: token,
    });

    if (error) {
      console.warn(
        "⚠️ [SupabaseClient] Advertencia al setear sesión:",
        error.message
      );
      // Aun con error, a veces el access_token queda en memoria.
      // Si falla mucho, revisaremos el formato del JWT, pero usualmente pasa.
    } else {
      console.log("✅ [SupabaseClient] Sesión Supabase Activa.");
    }
  } else {
    // Limpieza oficial
    await supabase.auth.signOut();
    console.log("🧹 [SupabaseClient] Sesión cerrada.");
  }
};
