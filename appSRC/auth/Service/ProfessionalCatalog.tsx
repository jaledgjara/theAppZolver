import { supabase } from "@/appSRC/services/supabaseClient";

// 1. Actualizamos la interfaz para incluir los flags de lógica de negocio
export interface ServiceCategory {
  id: string;
  name: string;
  icon_slug: string | null;
  requires_license: boolean; // ✅ Para mostrar input de matrícula
  is_usually_urgent: boolean; // ✅ Para habilitar/deshabilitar Zolver Ya
}

export interface ServiceTag {
  id: string;
  category_id: string;
  label: string;
}

export const MasterDataService = {
  async getCategories(): Promise<ServiceCategory[]> {
    const { data, error } = await supabase
      .from("service_categories")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  },

  async getTagsByCategory(categoryId: string): Promise<ServiceTag[]> {
    const { data, error } = await supabase
      .from("service_tags")
      .select("*")
      .eq("category_id", categoryId)
      .order("label");

    if (error) throw error;
    return data || [];
  },
};
