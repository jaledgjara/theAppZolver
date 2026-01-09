import { ServiceTag } from "@/appSRC/categories/Service/ProfessionalCatalog";

// --- STATUS DEFINITIONS ---
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

// ✅ AGREGADO: Definición centralizada del estado UI
export type ReservationStatusUI =
  | "pending"
  | "confirmed"
  | "on_route"
  | "in_progress"
  | "finalized"
  | "canceled";

// --- 1. DTO ---
export interface ReservationDTO {
  id: string;
  client_id: string;
  professional_id: string;
  service_category: string;
  service_modality: "instant" | "quote";
  title: string;
  description: string;
  service_tags: ServiceTag[];
  created_at: string;
  scheduled_range: string;
  status: string;
  price_estimated: number;
  price_final: number;
  platform_fee: number;
  address_display: string;
  address_coords: { x: number; y: number } | null;
  client?: { legal_name: string; avatar_url?: string };
  professional?: { legal_name: string; avatar_url?: string };
}

// --- 2. ENTIDAD ---
export interface Reservation {
  id: string;
  roleId: string;
  roleName: string;
  roleAvatar: any;
  createdAt: Date;
  scheduledStart: Date | null;
  statusDTO: ReservationStatusDTO;
  statusUI: ReservationStatusUI;
  address: string; // Dirección formateada
  serviceTitle: string;
  modality: "instant" | "quote";
  financials: {
    price: number;
    currency: string;
  };
}

// --- 3. PAYLOAD ---
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
  status: string;
  // platform_fee es opcional en payload si quieres
  platform_fee?: number;
}

// 3. PAYLOAD DE EDGE FUNCTION (NUEVO E IMPORTANTE)
// Este es el tipo que usaremos para enviar datos a la función 'process-payment-reservation'
export interface CreatePaidReservationPayload {
  // Datos de Pago
  card_token: string;
  amount: number;
  payer_email: string;
  payment_method_id: string;

  // Datos de Reserva (Planos, para que la Edge Func los formatee)
  user_id: string; // maps to client_id
  professional_id: string;
  service_category: string;
  service_modality: "instant" | "quote" | "urgent";
  start_date: string; // ISO String
  end_date: string; // ISO String
  address_display: string;
  coordinates: {
    // Objeto limpio para enviar
    latitude: number;
    longitude: number;
  };
}
