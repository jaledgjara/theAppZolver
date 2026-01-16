// appSRC/instant_mode/Service/InstantModeService.ts
import { supabase } from "@/appSRC/services/supabaseClient";
import {
  ServiceTemplate,
  ServiceTemplateDTO,
} from "../Type/InstantProfessionalType";
import { ServiceTemplateMapper } from "../Mapper/InstantProfessionalMapper";

export const InstantModeService = {
  async getProfessionalProfileByUid(uid: string) {
    console.log(`[Service] Buscando perfil para UID: ${uid}`);
    const { data, error } = await supabase
      .from("professional_profiles")
      .select("id, user_id, main_category_id, type_work")
      .eq("user_id", uid)
      .single();

    if (error) {
      console.error("[Service] Error obteniendo perfil:", error.message);
      return null;
    }
    return data;
  },

  async getTemplatesByCategory(categoryId: string): Promise<ServiceTemplate[]> {
    console.log(`[Service] Cargando templates para categoría: ${categoryId}`);
    const { data, error } = await supabase
      .from("service_templates")
      .select("*")
      .eq("category_id", categoryId);

    if (error) throw error;
    return ((data as ServiceTemplateDTO[]) || []).map(
      ServiceTemplateMapper.toDomain
    );
  },

  // AHORA USA UID DIRECTAMENTE
  async getProfessionalPrices(uid: string) {
    console.log(`[Service] Consultando precios para UID: ${uid}`);
    const { data, error } = await supabase
      .from("professional_service_prices")
      .select("template_id, custom_price")
      .eq("professional_id", uid); // professional_id ahora es TEXT (UID)

    if (error) throw error;
    return data || [];
  },

  // UPSERT USANDO UID
  async updateProfessionalPrice(
    uid: string,
    templateId: string,
    price: number
  ) {
    console.log(
      `[Service] Upsert precio: UID ${uid} | Template ${templateId} | $${price}`
    );
    const { error } = await supabase.from("professional_service_prices").upsert(
      {
        professional_id: uid,
        template_id: templateId,
        custom_price: price,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "professional_id,template_id" }
    );

    if (error) throw error;
  },

  // ACTUALIZACIÓN POR UID
  async updateWorkProfile(uid: string, typeWork: string) {
    console.log(
      `[Service] Actualizando modo de trabajo a "${typeWork}" para UID: ${uid}`
    );
    const { error } = await supabase
      .from("professional_profiles")
      .update({
        type_work: typeWork,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", uid);

    if (error) throw error;
  },
};
