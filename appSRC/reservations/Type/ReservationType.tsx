// appSRC/reservations/Type/ReservationDTO.ts

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
/**
 * ReservationDTO
 * Representa la fila cruda tal cual existe en la tabla 'reservations' de Supabase.
 * Se mantiene el snake_case y los tipos de datos serializables (string, number).
 */
export interface ReservationDTO {
  id: string; // uuid
  client_id: string; // uuid
  professional_id: string; // uuid

  service_category: string;
  service_modality: ServiceModalityDTO;

  title?: string;
  description?: string;
  photos?: string[]; // array de urls

  // Datos de Ubicación
  address_street: string;
  address_number?: string;
  address_coords?: { x: number; y: number }; // Postgres Point se suele mapear a un objeto JSON o string según config

  // CRÍTICO: Postgres devuelve tstzrange como string.
  // Ej: "[\"2023-10-25 14:00+00\",\"2023-10-25 15:00+00\")"
  scheduled_range: string;

  currency: string;
  price_estimated?: number;
  price_final?: number;

  platform_fee?: number;
  pro_payout?: number;

  status: ReservationStatusDTO;
  created_at: string; // ISO String
  updated_at?: string; // ISO String
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
}

export interface ReservationPayload {
  clientId: string;
  professionalId: string;
  category: string;

  title: string;
  description: string;
  photos: string[];
  address: string; // Dirección simple (String)

  // Datos de Tiempo Simples (Para compatibilidad básica)
  startTime: Date;
  durationHours?: number;

  // ✅ NUEVOS CAMPOS ESTRUCTURADOS (Necesarios para tu UI y Servicio actual)

  // Ubicación detallada (Coordenadas)
  location?: {
    street: string;
    coordinates: { latitude: number; longitude: number };
  };

  // Cronograma detallado
  schedule?: {
    startDate: Date;
    endDate: Date;
  };

  // Datos Económicos (CRÍTICO: El servicio RPC lo necesita)
  financials: {
    currency: string;
    priceEstimated: number;
    platformFee: number;
    priceFinal?: number;
  };
}
