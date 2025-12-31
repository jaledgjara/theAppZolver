import {
  Reservation,
  ReservationStatusDTO,
} from "@/appSRC/reservations/Type/ReservationType";
import { ReservationCardProps } from "@/appCOMP/cards/ReservationCard";

// ✅ 1. SOLUCIÓN DEL ERROR DE TIPO: Definimos qué strings espera la UI
export type ReservationStatusUI =
  | "pending"
  | "confirmed"
  | "on_route"
  | "in_progress"
  | "finalized"
  | "canceled";

/**
 * Convierte el estado técnico de la base de datos (DTO)
 * al estado visual simplificado para la UI.
 */
export const mapStatusToUI = (
  status: ReservationStatusDTO
): ReservationStatusUI => {
  switch (status) {
    case "draft":
    case "quoting":
    case "pending_approval":
      return "pending";
    case "confirmed":
      return "confirmed";
    case "on_route":
      return "on_route";
    case "in_progress":
      return "in_progress";
    case "completed":
      return "finalized";
    case "canceled_client":
    case "canceled_pro":
    case "disputed": // Podrías mapearlo a 'canceled' o crear uno nuevo 'disputed'
      return "canceled";
    default:
      return "pending";
  }
};

export const mapReservationToCard = (
  item: Reservation,
  viewRole: "client" | "professional"
): ReservationCardProps => {
  // ✅ 2. SOLUCIÓN DE HORA (12:00 AM FIX):
  // Si es instantánea, usamos la hora de creación (item.createdAt).
  // Si es agendada, usamos la hora del turno (item.schedule.startDate).
  const targetDate =
    item.serviceModality === "instant" && item.createdAt
      ? item.createdAt
      : item.schedule.startDate;

  // Validación de seguridad
  const dateObj =
    targetDate instanceof Date && !isNaN(targetDate.getTime())
      ? targetDate
      : new Date();

  // Formateo visual
  const dateStr = dateObj.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });

  const timeStr = dateObj.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // AM/PM
  });

  // 3. Lógica de Nombres (Tu lógica existente corregida)
  let nameToDisplay = "Usuario";
  let avatarToDisplay = require("@/appASSETS/RawImages/avatar-0.jpg");

  if (viewRole === "client") {
    // Si soy Cliente, veo al Profesional
    if (item.professional && item.professional.name) {
      nameToDisplay = item.professional.name;
      // if (item.professional.avatar) avatarToDisplay = ...
    } else {
      nameToDisplay = "Buscando Profesional...";
    }
  } else {
    // Si soy Profesional, veo al Cliente
    if (item.client && item.client.name) {
      nameToDisplay = item.client.name;
    } else {
      nameToDisplay = "Cliente Reservado";
    }
  }

  // 4. Lógica de Precio
  const priceDisplay =
    item.financials.priceEstimated > 0
      ? `$${item.financials.priceEstimated.toLocaleString("es-AR")}`
      : "A cotizar";

  return {
    id: item.id,
    counterpartName: nameToDisplay,
    serviceName: item.title,
    date: dateStr,
    time: timeStr, // Ahora mostrará la hora real
    status: mapStatusToUI(item.status), // Ahora usa el tipo correcto
    avatar: avatarToDisplay,
    price: priceDisplay,
  };
};

/* Transforma un estado en un texto con un color (UI Config) */
export const getStatusConfig = (statusUI: ReservationStatusUI) => {
  switch (statusUI) {
    case "confirmed":
      return { text: "Confirmada", bg: "#DBEAFE", color: "#3B82F6" };
    case "on_route":
      return { text: "En Camino", bg: "#EDE9FE", color: "#8B5CF6" };
    case "in_progress":
      return { text: "En Curso", bg: "#D1FAE5", color: "#10B981" };
    case "finalized":
      return { text: "Finalizada", bg: "#F3F4F6", color: "#374151" };
    case "canceled":
      return { text: "Cancelada", bg: "#FEE2E2", color: "#EF4444" };
    default:
      return { text: "Pendiente", bg: "#FEF3C7", color: "#F59E0B" };
  }
};
