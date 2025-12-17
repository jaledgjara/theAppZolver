// appSRC/searchable/Type/LocationType.ts
import { ProfessionalTypeWork } from "@/appSRC/userProf/Type/ProfessionalTypeWork";

export interface ProfessionalResult {
  id: string; // UUID de la tabla
  user_id: string; // Auth ID (Link con usuarios)
  legal_name: string;
  specialization_title: string;
  biography: string | null;
  rating: number;
  reviews_count: number;
  photo_url: string | null;

  // Geodata
  base_lat: number;
  base_lng: number;
  dist_meters: number | null;
  coverage_radius_km: number;

  // Lógica de Negocio
  is_urgent: boolean;
  is_active: boolean;
  type_work: ProfessionalTypeWork;

  // ✅ CRÍTICO PARA RESERVAS
  category_id: string; // Para buscar Tags
  category_name: string; // Para mostrar texto
  price_per_hour: number; // Para calcular total (instant_service_price)

  // Detalles Extra
  portfolio_photos: string[] | null;
  enrollment_number: string | null;
}
