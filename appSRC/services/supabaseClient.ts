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
 * Inyecta el JWT de Firebase (emitido por session-sync) en el cliente de Supabase.
 * Al ser stateless (persistSession: false), cada sesión vive solo en memoria
 * y se renueva automáticamente cuando el AuthListener de Firebase detecta cambios.
 */
export const setSupabaseAuthToken = async (token: string | null) => {
  if (token) {
    const { error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: token,
    });

    if (error) {
      console.warn(
        "[SupabaseClient] Advertencia al setear sesión:",
        error.message
      );
    }
  } else {
    await supabase.auth.signOut();
  }
};
