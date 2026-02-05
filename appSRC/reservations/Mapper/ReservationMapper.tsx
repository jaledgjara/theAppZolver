import { parsePostgresRange } from "@/appSRC/timeAndData/Builder/TimeBuilder";
import {
  Reservation,
  ReservationDTO,
  ReservationStatusDTO,
  ReservationStatusUI,
} from "../Type/ReservationType";

// Helper simple para convertir estado
const convertStatusToUI = (
  status: ReservationStatusDTO
): ReservationStatusUI => {
  switch (status) {
    case "confirmed":
      return "confirmed";
    case "completed":
      return "finalized";
    case "canceled_client":
    case "canceled_pro":
    case "disputed":
      return "canceled";
    case "on_route":
      return "on_route";
    case "in_progress":
      return "in_progress";
    default:
      return "pending";
  }
};

export const mapReservationFromDTO = (
  dto: ReservationDTO,
  viewRole: "client" | "professional"
): Reservation => {
  // 1. Log de Entrada
  // console.log(`🗺️ [MAPPER] Processing ID: ${dto.id} | Modality: ${dto.service_modality}`);

  // 2. Parseo de Fechas
  const createdAt = new Date(dto.created_at);
  const { start: scheduledStart } = parsePostgresRange(dto.scheduled_range);

  // 3. Determinar Datos de Contraparte
  let roleId = "";
  let roleName = "Usuario";

  if (viewRole === "professional") {
    roleId = dto.client_id;
    roleName = dto.client?.legal_name || "Cliente";
  } else {
    roleId = dto.professional_id;
    roleName = dto.professional?.legal_name || "Profesional";
  }

  // 4. Construcción de Entidad Limpia
  return {
    id: dto.id,
    roleId,
    roleName,
    roleAvatar: require("@/appASSETS/RawImages/avatar-0.jpg"),
    description: dto.description || "No hay descripción.",
    createdAt,
    scheduledStart,
    address: dto.address_display || "Ubicación a coordinar",
    statusDTO: dto.status as ReservationStatusDTO,
    statusUI: convertStatusToUI(dto.status as ReservationStatusDTO),

    serviceTitle: dto.title || dto.service_category,
    modality: dto.service_modality,

    financials: {
      price: dto.price_estimated || 0,
      platformFee: dto.platform_fee || 0,
      currency: "ARS",
    },
  };
};
