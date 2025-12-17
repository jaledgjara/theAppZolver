import { supabase } from "@/appSRC/services/supabaseClient";
import { ProfessionalResult } from "../Type/LocationType";
import { ProfessionalTypeWork } from "@/appSRC/userProf/Type/ProfessionalTypeWork";

// Helper para aplicar la Regla de Negocio Zolver
export const filterActiveProfessionals = (
  professionals: ProfessionalResult[]
) => {
  return professionals.filter((p) => {
    // REGLA DE ARQUITECTURA:
    if (p.type_work === "quote") return true;

    if (p.type_work === "instant") {
      return p.is_active === true;
    }

    return true;
  });
};
