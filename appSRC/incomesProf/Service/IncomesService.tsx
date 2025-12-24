import { supabase } from "@/appSRC/services/supabaseClient";
import { IncomePayload } from "../Type/IncomesType";

/**
 * Obtiene las estadísticas financieras del profesional.
 * Utiliza Serverless RPC para cálculo seguro y rápido.
 */
export const getIncomeStats = async (
  professionalId: string
): Promise<IncomePayload | null> => {
  try {
    const { data, error } = await supabase.rpc("get_professional_stats", {
      prof_uid: professionalId,
    });

    if (error) {
      console.error("Error fetching income stats:", error.message);
      return null;
    }

    return data as IncomePayload;
  } catch (err) {
    console.error("Unexpected error in getIncomeStats:", err);
    return null;
  }
};
