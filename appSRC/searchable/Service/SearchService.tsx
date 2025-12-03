import { supabase } from "@/appSRC/services/supabaseClient";
import { ProfessionalResult } from "../Type/LocationType";
import { ProfessionalTypeWork } from "@/appSRC/userProf/Type/ProfessionalTypeWork";

export const SearchService = {
  /**
   * Llama a la RPC 'search_professionals' configurada en PostgreSQL
   */
  async searchProfessionals(
    query: string,
    lat?: number,
    lng?: number,
    mode: ProfessionalTypeWork = "all" // ✅ Tipado fuerte
  ) {
    console.log(`📡 [API] Buscando: "${query}" | Modo: ${mode}`);

    const { data, error } = await supabase.rpc("search_professionals", {
      search_term: query,
      user_lat: lat || null,
      user_lng: lng || null,
      search_mode: mode, // TypeScript valida que esto coincida con lo que espera la DB
    });

    if (error) throw error;
    return data as ProfessionalResult[];
  },

  /**
   * Obtiene el perfil completo por ID (para la pantalla de detalles)
   */
  async getProfessionalById(id: string) {
    const { data, error } = await supabase
      .from("professional_profiles")
      .select("*")
      .eq("user_id", id) // Ojo: usamos user_id o id según tu navegación
      .single();

    if (error) throw error;
    return data;
  },
};
