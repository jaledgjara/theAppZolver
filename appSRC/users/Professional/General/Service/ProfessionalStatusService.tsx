import { supabase } from "@/appSRC/services/supabaseClient";

export const ProfessionalStatusService = {
  /**
   * Obtiene el estado actual de disponibilidad del profesional.
   */
  fetchActiveStatus: async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("professional_profiles")
      .select("is_active")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code !== "PGRST116") {
        console.error("❌ [Service] Error fetching status:", error.message);
      }
      return false;
    }
    return data?.is_active ?? false;
  },

  /**
   * Actualiza el estado activo/inactivo.
   */
  updateActiveStatus: async (
    userId: string,
    isActive: boolean
  ): Promise<void> => {
    const { error } = await supabase
      .from("professional_profiles")
      .update({ is_active: isActive })
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }
  },
};
