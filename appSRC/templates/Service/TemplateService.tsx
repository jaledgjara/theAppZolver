import { supabase } from "@/appSRC/services/supabaseClient";
import { ProfessionalTemplate } from "../Type/TemplateType";

export const TemplateService = {
  /**
   * Obtiene los servicios y precios específicos configurados por un profesional.
   * Une la tabla 'professional_service_prices' con 'service_templates'.
   */
  async getProfessionalServices(
    professionalId: string
  ): Promise<ProfessionalTemplate[]> {
    console.log(
      "📡 [TemplateService] Consultando Supabase para ID:",
      professionalId,
      "| type:", typeof professionalId,
      "| length:", professionalId?.length
    );

    // Diagnostic: count total rows (ignoring is_active) to distinguish "no data" from "all inactive"
    const { count: totalRows, error: countError } = await supabase
      .from("professional_service_prices")
      .select("*", { count: "exact", head: true })
      .eq("professional_id", professionalId);

    console.log(
      "🔢 [TemplateService] Total rows (any is_active):",
      totalRows,
      countError ? `| countError: ${countError.message}` : ""
    );

    const { data, error } = await supabase
      .from("professional_service_prices")
      .select(
        `
        custom_price,
        service_templates (
          id,
          label,
          estimated_minutes,
          is_urgent_template
        )
      `
      )
      .eq("professional_id", professionalId)
      .eq("is_active", true);

    if (error) {
      console.error("❌ [TemplateService] Error en Query:", error.message);
      throw error;
    }

    console.log(
      "🔌 [TemplateService] Datos crudos de Supabase:",
      JSON.stringify(data, null, 2)
    );

    if (!data || data.length === 0) {
      console.warn(
        "🔍 [TemplateService] La consulta no devolvió filas. ¿El profesional tiene precios activos?"
      );
      return [];
    }

    const mapped = data.map((item: any) => ({
      id: item.service_templates.id,
      label: item.service_templates.label,
      price: parseFloat(item.custom_price),
      estimatedMinutes: item.service_templates.estimated_minutes,
      isUrgent: item.service_templates.is_urgent_template,
    }));

    console.log("✨ [TemplateService] Mapeo final exitoso:", mapped);
    return mapped;
  },

  /**
   * Fallback para cuando el profesional no tiene precios pero necesitamos ver qué templates hay
   */
  async getTemplatesByCategory(
    categoryId: string
  ): Promise<ProfessionalTemplate[]> {
    const { data, error } = await supabase
      .from("service_templates")
      .select("*")
      .eq("category_id", categoryId);

    if (error) throw error;

    return (data || []).map((dto: any) => ({
      id: dto.id,
      label: dto.label,
      price: parseFloat(dto.base_price_suggested),
      estimatedMinutes: dto.estimated_minutes,
      isUrgent: dto.is_urgent_template,
    }));
  },
};
