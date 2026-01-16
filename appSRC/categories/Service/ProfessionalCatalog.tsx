// @/appSRC/services/ProfessionalCatalog.ts
import { supabase } from "@/appSRC/services/supabaseClient";

// 1. Interfaces mapeadas a la DB
export interface ServiceCategory {
  id: string;
  name: string;
  icon_slug: string | null;
  requires_license: boolean;
  is_usually_urgent: boolean;
}

export interface ServiceTag {
  id: string;
  category_id: string;
  label: string;
  is_urgent_tag: boolean;
  estimated_minutes: number;
}

export interface ProfessionalTemplate {
  id: string;
  label: string;
  price: number;
  estimatedMinutes: number;
  isUrgent: boolean;
}

export const MasterDataService = {
  // ✅ 1. NUEVA FUNCIÓN AGREGADA (La que faltaba)
  async getCategories(): Promise<ServiceCategory[]> {
    const { data, error } = await supabase
      .from("service_categories")
      .select("*")
      .order("name"); // O order('id') según prefieras

    if (error) throw error;
    return data || [];
  },

  // 2. Obtener categoría por nombre (Para Deep Linking o Params)
  async getCategoryByName(name: string): Promise<ServiceCategory | null> {
    const { data, error } = await supabase
      .from("service_categories")
      .select("*")
      .ilike("name", `%${name}%`)
      .limit(1)
      .single();

    if (error) return null;
    return data;
  },

  // 3. Obtener Tags por Categoría (Para el Formulario)
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
