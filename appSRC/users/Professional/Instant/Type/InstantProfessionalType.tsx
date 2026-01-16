export interface ServiceTemplateDTO {
  id: string;
  category_id: string;
  label: string;
  base_price_suggested: number;
  is_urgent_template: boolean;
  description: string;
  created_at: string;
}

export interface UpdatePricePayload {
  professional_id: string;
  template_id: string;
  custom_price: number;
}

export interface ServiceTemplate {
  id: string;
  label: string;
  basePrice: number;
  isUrgent: boolean;
  description: string;
}
