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
};
