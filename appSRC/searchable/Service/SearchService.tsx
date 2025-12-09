import { supabase } from "@/appSRC/services/supabaseClient";
import { ProfessionalResult } from "../Type/LocationType";
import { ProfessionalTypeWork } from "@/appSRC/userProf/Type/ProfessionalTypeWork";

export const SearchService = {
  /**
   * Búsqueda por Texto (Search Bar)
   */
  async searchProfessionals(
    query: string,
    lat?: number,
    lng?: number,
    mode: ProfessionalTypeWork = "all"
  ) {
    // 🔥 EL FIX MÁGICO: Usar '??' permite que el 0 pase como número y no como null
    const safeLat = lat ?? null;
    const safeLng = lng ?? null;

    console.log(
      `📡 [API] Search: "${query}" | Loc: ${safeLat},${safeLng} | Mode: ${mode}`
    );

    const { data, error } = await supabase.rpc("search_professionals", {
      search_term: query,
      user_lat: safeLat, // Antes: lat || null (Error si lat es 0)
      user_lng: safeLng, // Antes: lng || null
      search_mode: mode,
    });

    if (error) throw error;
    return data as ProfessionalResult[];
  },

  /**
   * Búsqueda por Categoría (Home Icons)
   */
  async getProfessionalByCategory(
    categoryId: string,
    mode: ProfessionalTypeWork = "all",
    lat?: number,
    lng?: number
  ) {
    // 🔥 EL FIX MÁGICO AQUÍ TAMBIÉN
    const safeLat = lat ?? null;
    const safeLng = lng ?? null;

    console.log(
      `📡 [API] Category: ${categoryId} | Loc: ${safeLat},${safeLng} | Mode: ${mode}`
    );

    const { data, error } = await supabase.rpc("search_professionals", {
      search_term: "",
      user_lat: safeLat,
      user_lng: safeLng,
      search_mode: mode,
      filter_category_id: categoryId,
    });

    if (error) {
      console.error("❌ [API] Error fetching category:", error);
      return [];
    }

    // LOG PARA VERIFICAR SI FUNCIONÓ EL FILTRO DE RADIO
    if (data && data.length > 0) {
      console.log(
        `✅ [API] Found ${data.length} pros. Top 1 Dist: ${data[0].dist_meters}m`
      );
    } else {
      console.log(`GJ [API] No pros found (Coverage Radius working!)`);
    }

    return data as ProfessionalResult[];
  },

  /**
   * Detalles (Sin cambios por ahora)
   */
  async getProfessionalById(id: string) {
    const { data, error } = await supabase
      .from("professional_profiles")
      .select("*")
      .eq("user_id", id)
      .single();

    if (error) throw error;
    return data;
  },
};
