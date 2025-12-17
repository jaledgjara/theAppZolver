// appSRC/reservations/Type/ReservationDTO.ts

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

export interface ReservationDTO {
  id: string;
  client_id: string;
  professional_id: string;
  service_category: string;
  service_modality: "instant" | "quote";

  // Nuevos campos estructurados
  title: string;
  description: string;
  service_tags: ServiceTag[]; // ✅ JSONB mapeado

  address_display: string; // ✅ Texto humano
  address_coords: { x: number; y: number } | null; // ✅ Point

  scheduled_range: string;
  price_estimated?: number;
  price_final?: number;
  platform_fee?: number;
  status: string;
  created_at: string;

  professional?: {
    legal_name: string | null;
    photo_url: string | null;
  };
}

/**
 * Reservation (Domain Entity)
 * La versión limpia y tipada para usar dentro de la UI y Hooks.
 */
export interface Reservation {
  id: string;
  clientId: string;
  professionalId: string;

  serviceCategory: string;
  serviceModality: ServiceModalityDTO;

  title: string;
  description: string;
  photos: string[];

  location: {
    street: string;
    number?: string;
    coordinates?: { latitude: number; longitude: number }; // Más amigable para Mapas
  };

  // Transformamos el 'scheduled_range' string a objetos Date reales
  schedule: {
    startDate: Date;
    endDate: Date;
  };

  financials: {
    currency: string;
    priceEstimated?: number;
    priceFinal?: number;
    platformFee?: number;
    proPayout?: number;
  };

  status: ReservationStatusDTO;
  createdAt: Date;

  professional: {
    name: string;
    avatar: string | null;
  };
}

export interface ReservationPayload {
  clientId: string;
  professionalId: string;
  category: string;

  // Datos Estructurados
  tags: ServiceTag[]; // ✅ Array de tags
  title: string; // Generado (Tag A + Tag B)
  description: string; // Input opcional

  // Ubicación Rica
  location: {
    addressText: string; // "Av. Siempre Viva 123"
    coords: {
      // { lat: -32.9, lng: -68.8 }
      lat: number;
      lng: number;
    };
  };

  startTime: Date;
  durationHours: number;

  // Datos Económicos
  priceEstimated: number;
  pricePerHour: number; // Para referencia

  professional: {
    name: string;
    avatar: string | null;
  };
}
