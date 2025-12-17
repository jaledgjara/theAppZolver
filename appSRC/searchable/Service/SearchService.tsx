import { supabase } from "@/appSRC/services/supabaseClient";
import { ProfessionalResult } from "../Type/LocationType";
import { ProfessionalTypeWork } from "@/appSRC/userProf/Type/ProfessionalTypeWork";

export const SearchService = {
  /**
   * Búsqueda por Texto (Search Bar & Quick Chips)
   */
  async searchProfessionals(
    query: string,
    lat?: number,
    lng?: number,
    mode: ProfessionalTypeWork = "all"
  ) {
    const safeLat = lat ?? null;
    const safeLng = lng ?? null;

    console.log(`📡 [API REQUEST] Search Term: "${query}"`);
    console.log(`📍 [API REQUEST] Coords: ${safeLat}, ${safeLng}`);
    console.log(`⚙️ [API REQUEST] Mode: ${mode}`);

    try {
      // ✅ FIX: Pasamos explícitamente los 5 argumentos para evitar error de firma
      const { data, error } = await supabase.rpc("search_professionals", {
        search_term: query,
        user_lat: safeLat,
        user_lng: safeLng,
        search_mode: mode,
        filter_category_id: null, // ⚠️ CRÍTICO: Debe ser null explícito para búsqueda por texto
      });

      if (error) {
        console.error("❌ [API FATAL ERROR] Postgres respondió:", error);
        console.error(
          "💡 HINT: ¿Ejecutaste 'DROP FUNCTION search_professionals...' antes de crear la nueva?"
        );
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn("⚠️ [API RESPONSE] La búsqueda retornó 0 resultados.");
      } else {
        console.log(`✅ [API RESPONSE] Éxito. Encontrados: ${data.length}`);
        // Log del primer item para verificar tipos
        console.log(
          "🔍 [DEBUG DATA] Primer Item:",
          JSON.stringify(data[0], null, 2)
        );
      }

      const mappedResults: ProfessionalResult[] = (data || []).map(
        (item: any) => ({
          id: item.id,
          user_id: item.user_id,
          category_id: item.main_category_id,
          category_name: item.category_name || "General",
          legal_name: item.legal_name || "Usuario Zolver",
          specialization_title: item.specialization_title || "",
          biography: item.biography || "",
          enrollment_number: item.enrollment_number || null,
          photo_url: item.photo_url || null,
          portfolio_photos: item.portfolio_urls || [],
          price_per_hour: item.instant_service_price || 0,
          rating: item.rating || 0,
          reviews_count: item.reviews_count || 0,
          is_active: item.is_active,
          is_urgent: false,
          type_work: item.type_work as ProfessionalTypeWork,
          base_lat: item.base_lat || 0,
          base_lng: item.base_lng || 0,
          coverage_radius_km: 5,
          dist_meters: item.dist_meters || 0,
        })
      );

      return mappedResults;
    } catch (err) {
      console.error("🚨 [SERVICE EXCEPTION]", err);
      throw err;
    }
  },

  /**
   * Búsqueda por Categoría
   */
  async getProfessionalByCategory(
    categoryId: string,
    mode: ProfessionalTypeWork = "all",
    lat?: number,
    lng?: number
  ) {
    const safeLat = lat ?? null;
    const safeLng = lng ?? null;

    console.log(`📡 [API CAT] Category: ${categoryId}`);

    const { data, error } = await supabase.rpc("search_professionals", {
      search_term: "",
      user_lat: safeLat,
      user_lng: safeLng,
      search_mode: mode,
      filter_category_id: categoryId, // ✅ Filtro estricto por categoría
    });

    if (error) {
      console.error("❌ [API CAT ERROR]", error);
      throw error;
    }

    const mappedResults: ProfessionalResult[] = (data || []).map(
      (item: any) => ({
        id: item.id,
        user_id: item.user_id,
        category_id: item.main_category_id,
        category_name: item.category_name || "General",
        legal_name: item.legal_name || "Usuario Zolver",
        specialization_title: item.specialization_title || "",
        biography: item.biography || "",
        enrollment_number: item.enrollment_number || null,
        photo_url: item.photo_url || null,
        portfolio_photos: item.portfolio_urls || [],
        price_per_hour: item.instant_service_price || 0,
        rating: item.rating || 0,
        reviews_count: item.reviews_count || 0,
        is_active: item.is_active,
        is_urgent: false,
        type_work: item.type_work as ProfessionalTypeWork,
        base_lat: item.base_lat || 0,
        base_lng: item.base_lng || 0,
        coverage_radius_km: 5,
        dist_meters: item.dist_meters || 0,
      })
    );

    return mappedResults;
  },

  /**
   * Obtener detalle de un profesional por ID
   */
  async getProfessionalById(userId: string) {
    console.log(`📡 [API] Fetching Details for: ${userId}`);

    const { data, error } = await supabase
      .from("professional_profiles")
      .select(
        `
        *,
        service_categories ( name )
      `
      )
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("❌ [API Error] getProfessionalById:", error);
      throw error;
    }

    // Mapeo a la entidad ProfessionalResult
    const profile: ProfessionalResult = {
      id: data.id,
      user_id: data.user_id,
      category_id: data.main_category_id,
      category_name: data.service_categories?.name || "General",
      legal_name: data.legal_name,
      specialization_title: data.specialization_title,
      biography: data.biography,
      enrollment_number: data.enrollment_number,
      photo_url: data.photo_url,
      portfolio_photos: data.portfolio_urls || [],
      price_per_hour: data.instant_service_price || 0,
      rating: data.rating || 0,
      reviews_count: data.reviews_count || 0,
      is_active: data.is_active,
      is_urgent: false,
      type_work: data.type_work as ProfessionalTypeWork,
      base_lat: data.base_lat,
      base_lng: data.base_lng,
      coverage_radius_km: data.coverage_radius_km || 5,
      dist_meters: 0, // En detalle no recalculamos distancia relativa
    };

    return profile;
  },
};

/*-- DROP FUNCTION IF EXISTS search_professionals(text, double precision, double precision, text, uuid);

CREATE OR REPLACE FUNCTION search_professionals(
  search_term text,
  user_lat double precision,
  user_lng double precision,
  search_mode text,
  filter_category_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id text,
  legal_name text,
  specialization_title text,
  biography text,
  rating double precision,
  reviews_count integer,
  photo_url text,
  base_lat double precision,
  base_lng double precision,
  dist_meters double precision,
  is_urgent boolean,
  category_name text,
  is_active boolean,
  type_work text,
  -- ✅ CAMPOS FALTANTES AGREGADOS PARA EL FRONTEND
  main_category_id uuid,
  instant_service_price double precision,
  enrollment_number text,
  portfolio_urls text[]
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.legal_name,
    p.specialization_title,
    p.biography,
    p.rating,
    p.reviews_count,
    p.photo_url,
    p.base_lat,
    p.base_lng,
    -- Cálculo de distancia
    CASE
      WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL THEN
        st_distance(
          st_point(p.base_lng, p.base_lat)::geography,
          st_point(user_lng, user_lat)::geography
        )
      ELSE NULL
    END as dist_meters,
    false as is_urgent,
    c.name as category_name,
    p.is_active,
    p.type_work::text,
    -- ✅ RETORNAMOS LOS DATOS FALTANTES
    p.main_category_id,
    p.instant_service_price,
    p.enrollment_number,
    p.portfolio_urls
  FROM
    professional_profiles p
  LEFT JOIN
    service_categories c ON p.main_category_id = c.id
  WHERE
    -- 1. Filtro de Texto (Insensible a mayúsculas y acentos si la collation lo permite)
    (search_term = '' OR p.legal_name ILIKE '%' || search_term || '%' OR p.specialization_title ILIKE '%' || search_term || '%')
    
    -- 2. Filtro de Categoría
    AND (filter_category_id IS NULL OR p.main_category_id = filter_category_id)
    
    -- 3. Lógica de SEARCH_MODE
    AND (
      search_mode = 'all' 
      OR (search_mode = 'instant' AND p.type_work = 'instant')
      OR (search_mode = 'quote' AND p.type_work = 'quote')
    )
    
    -- 4. REGLA DE NEGOCIO ZOLVER (Hard Filter)
    AND (
      p.type_work = 'quote' 
      OR 
      (p.type_work = 'instant' AND p.is_active = true)
    );
END;
$$;
$$; */
