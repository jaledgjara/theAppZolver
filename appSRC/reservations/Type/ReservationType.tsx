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

// 1. DTO (Lo que viene de Supabase/DB)
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

  // Datos del Profesional (Join para el Cliente)
  client?: {
    legal_name: string;
    avatar_url?: string;
  };
  professional?: {
    legal_name: string;
    avatar_url?: string;
  };
}

// 2. DOMAIN ENTITY (Lo que usa la UI)
export interface Reservation {
  id: string;
  clientId: string;
  professionalId: string;

  status: ReservationStatusDTO;
  title: string;
  description: string;
  serviceCategory: string;
  serviceModality: "instant" | "quote";

  location: {
    street: string;
    number: string;
    coordinates?: { latitude: number; longitude: number };
  };

  schedule: {
    startDate: Date | null; // <--- CAMBIO: Permitimos null
    endDate: Date | null; // <--- CAMBIO: Permitimos null
  };

  financials: {
    currency: string;
    priceEstimated: number;
    priceFinal: number;
    platformFee: number;
  };

  client?: {
    id: string;
    name: string;
    avatar?: string;
  };
  professional?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// 3. PAYLOAD (Lo que se envía a la DB)
export interface ReservationPayload {
  client_id: string;
  professional_id: string;
  service_category: string;
  service_modality: "instant" | "quote";
  service_tags: any[];
  title: string;
  description: string;
  address_street: string;
  address_number: string;
  address_coords?: string;
  scheduled_range: string;
  currency: string;
  price_estimated: number;
  price_final: number;
  platform_fee?: number;
  status: string;
}
