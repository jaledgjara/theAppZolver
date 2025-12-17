import { ServiceTag } from "@/appSRC/categories/Service/ProfessionalCatalog";

export type ReservationStatusDTO =
  | "draft"
  | "quoting"
  | "pending_approval"
  | "confirmed"
  | "on_route"
  | "in_progress"
  | "completed"
  | "canceled_client"
  | "canceled_pro"
  | "disputed";

export type ServiceModalityDTO = "instant" | "quote";

// 1. DTO (What comes from DB)
export interface ReservationDTO {
  id: string;
  client_id: string;
  professional_id: string;
  service_category: string;
  service_modality: ServiceModalityDTO;

  title: string;
  description: string;
  service_tags: ServiceTag[];

  address_display: string;
  address_coords: { x: number; y: number } | null;

  scheduled_range: string;
  price_estimated: number;
  price_final: number;
  platform_fee: number;
  status: string;
  created_at: string;

  professional?: {
    legal_name: string | null;
    photo_url?: string | null;
  };
}

// 2. DOMAIN ENTITY (UI)
export interface Reservation {
  id: string;
  clientId: string;
  professionalId: string;
  // ... (Keep your existing Domain interface here) ...
}

/**
 * 3. PAYLOAD (What goes to DB)
 * ✅ Corrected to snake_case to match SQL columns
 */
export interface ReservationPayload {
  client_id: string;
  professional_id: string;

  service_category: string;
  service_modality: "instant" | "quote";

  service_tags: any[]; // JSONB array

  title: string;
  description: string;

  address_street: string;
  address_number: string;
  address_coords?: string; // String formatted as "(lng,lat)" or undefined

  scheduled_range: string; // Tstzrange "[start, end)"

  currency: string;
  price_estimated: number;
  price_final: number;
  platform_fee?: number;

  status: string;
}
