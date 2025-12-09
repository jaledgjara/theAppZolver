export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "on_route"
  | "in_progress"
  | "completed"
  | "canceled";

export type ServiceModality = "instant" | "quote";

// Interfaz que refleja la tabla en DB
export interface Reservation {
  id: string;
  created_at: string;
  updated_at: string;

  // Relaciones (Strings porque son IDs de Firebase)
  client_id: string;
  professional_id: string;

  // Detalles
  service_category: string;
  service_modality: ServiceModality;
  description?: string;
  photos?: string[];

  // Agenda y Ubicación
  scheduled_at: string;
  address_street: string;
  address_number: string;
  location_coords?: { x: number; y: number };

  // Estado
  status: ReservationStatus;

  // Datos Económicos
  price_total?: number;
  platform_fee?: number;
  pro_payout_amount?: number;

  // Campos opcionales para Joins (cuando traes datos del perfil)
  professional?: {
    display_name: string | null;
    photo_url: string | null;
  };
  client?: {
    display_name: string | null;
    photo_url: string | null;
  };
}

// DTO para la creación (INSERT)
export interface CreateReservationDTO {
  client_id: string;
  professional_id: string;
  service_category: string;
  service_modality: ServiceModality;
  description?: string;

  scheduled_at: string; // ISO String
  address_street: string;
  address_number: string;

  status: ReservationStatus;

  // Opcionales según modalidad
  price_total?: number;
  platform_fee?: number;
  pro_payout_amount?: number;
}
