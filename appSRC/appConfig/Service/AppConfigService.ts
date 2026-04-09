import { supabase } from "@/appSRC/services/supabaseClient";
import { AppConfig, AppConfigDTO } from "../Type/AppConfigType";
import { mapAppConfigFromDTO } from "../Mapper/AppConfigMapper";

/**
 * Lee la fila singleton de `app_config` (id=1).
 *
 * La lectura es pública (RLS permite SELECT a anon) porque el cliente
 * necesita consultarla ANTES del login — es el primer gate de la app.
 *
 * Si la fila no existe o la query falla, devuelve `null` y el gate
 * asume "ok" (fail-open). Nunca bloqueamos al usuario por un fallo de red
 * en la config remota.
 */
export const fetchAppConfigService = async (): Promise<AppConfig | null> => {
  const { data, error } = await supabase.from("app_config").select("*").eq("id", 1).maybeSingle();

  if (error) {
    // Log pero no lanza — fail-open: nunca bloqueamos al usuario por un fallo
    // al leer la config remota.
    console.warn("[AppConfigService] fetch failed:", error.message);
    return null;
  }

  if (!data) return null;

  return mapAppConfigFromDTO(data as AppConfigDTO);
};
