import { supabase } from "@/appSRC/services/supabaseClient";

export const ProfessionalDataService = {
  /**
   * Obtiene la info financiera desde el objeto JSONB
   */
  fetchPayoutConfig: async (userId: string) => {
    const { data, error } = await supabase
      .from("professional_profiles")
      .select("financial_info, updated_at")
      .eq("user_id", userId)
      .single();

    if (error) {
      // Si no hay fila, devolvemos valores por defecto sin lanzar error
      if (error.code === "PGRST116") {
        return {
          alias: "",
          bankName: "",
          cuit: "",
          lastUpdated: null,
          isNewProfile: true, // Flag útil para la lógica
        };
      }
      throw error;
    }

    return {
      alias: data.financial_info?.cbu_alias || "",
      bankName: data.financial_info?.bank_name || "",
      cuit: data.financial_info?.cuit || "",
      lastUpdated: data.updated_at,
      isNewProfile: false,
    };
  },

  /**
   * Actualiza el JSONB con validación de tiempo
   */
  updatePayoutConfig: async (
    userId: string,
    alias: string,
    bankName: string
  ) => {
    // 1. Fetch previo para validación de cooldown (24hs)
    const { data: profile } = await supabase
      .from("professional_profiles")
      .select("updated_at")
      .eq("user_id", userId)
      .single();

    if (profile?.updated_at) {
      const hoursPassed =
        (new Date().getTime() - new Date(profile.updated_at).getTime()) /
        (1000 * 60 * 60);
      if (hoursPassed < 24) {
        throw new Error(
          `Seguridad: Podrás editar tus datos en ${Math.ceil(
            24 - hoursPassed
          )} horas.`
        );
      }
    }

    // 2. Update usando el operador de Supabase para no borrar otros campos del JSONB
    const { error } = await supabase
      .from("professional_profiles")
      .update({
        financial_info: {
          cbu_alias: alias,
          bank_name: bankName,
          // Mantenemos cuit si existiera o lo dejamos abierto para el futuro
        },
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw error;
  },
  fetchPublicProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from("professional_profiles")
      .select("specialization_title, biography, photo_url, portfolio_urls")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  /**
   * Actualiza los datos públicos del perfil
   */
  updatePublicProfile: async (userId: string, data: any) => {
    const { error } = await supabase
      .from("professional_profiles")
      .update({
        specialization_title: data.specialty,
        biography: data.bio,
        photo_url: data.photoUrl,
        portfolio_urls: data.portfolioUrls,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) throw error;
    return { success: true };
  },

  /**
   * 1. Sincronización Inicial (Fetch):
   * Recupera la ubicación guardada para hidratar el mapa.
   */
  fetchLocationConfig: async (userId: string) => {
    console.log("📡 [SERVICE] fetchLocationConfig iniciado para UID:", userId);
    const { data, error } = await supabase
      .from("professional_profiles")
      .select("base_lat, base_lng, coverage_radius_km")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.warn(
          "⚠️ [SERVICE] No se encontró perfil para este usuario (PGRST116)"
        );
        return null;
      }
      console.error("🔥 [SERVICE] Error en fetch:", error);
      throw error;
    }

    console.log("✅ [SERVICE] Datos recuperados:", data);
    return data;
  },

  updateLocationConfig: async (userId: string, coords: any, radius: number) => {
    console.log("📡 [SERVICE] Intentando UPDATE para:", userId);

    const { data, error } = await supabase
      .from("professional_profiles")
      .update({
        base_lat: coords.latitude,
        base_lng: coords.longitude,
        coverage_radius_km: radius,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select(); // 👈 CRÍTICO: Esto nos permite verificar si realmente se cambió algo

    if (error) throw error;

    if (!data || data.length === 0) {
      console.error(
        "🔥 [SERVICE] ¡ALERTA! La base de datos no actualizó ninguna fila. Revisa el RLS."
      );
      throw new Error("No tienes permisos para actualizar este perfil.");
    }

    console.log("✅ [SERVICE] Actualización REAL confirmada:", data[0]);
  },
};
