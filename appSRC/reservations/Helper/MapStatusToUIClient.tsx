import {
  Reservation,
  ReservationStatusDTO,
} from "@/appSRC/reservations/Type/ReservationType";
// Asegúrate de que ReservationCardProps ya tenga 'counterpartName' en lugar de 'professionalName'
import {
  ReservationCardProps,
  ReservationStatus as ReservationStatusUI,
} from "@/appCOMP/cards/ReservationCard";

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
    case "disputed":
      return "canceled";
    default:
      return "pending";
  }
};

// ... (keep mapStatusToUI and getStatusConfig as they are) ...

export const mapReservationToCard = (
  item: Reservation,
  viewRole: "client" | "professional"
): ReservationCardProps => {
  // 1. Date Formatting (Safe check)
  const dateObj =
    item.schedule.startDate instanceof Date &&
    !isNaN(item.schedule.startDate.getTime())
      ? item.schedule.startDate
      : new Date(); // Fallback if invalid

  const dateStr = dateObj.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
  });

  const timeStr = dateObj.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // 2. 🛠 FIX 1: Name Logic
  let nameToDisplay = "Usuario";
  let avatarToDisplay = require("@/appASSETS/RawImages/avatar-0.jpg"); // Default

  if (viewRole === "client") {
    // If I am the client, I want to see the Professional's name
    if (item.professional && item.professional.name) {
      nameToDisplay = item.professional.name;
      // avatarToDisplay = item.professional.avatar ...
    } else {
      nameToDisplay = "Buscando Profesional..."; // Friendly fallback for 'draft'/'pending'
    }
  } else {
    // If I am the professional, I want to see the Client's name
    if (item.client && item.client.name) {
      nameToDisplay = item.client.name;
    } else {
      nameToDisplay = "Cliente Reservado";
    }
  }

  // 3. 🛠 FIX 3: Price Logic
  // Ensure we are displaying the estimated price correctly
  const priceDisplay =
    item.financials.priceEstimated > 0
      ? `$${item.financials.priceEstimated.toLocaleString("es-AR")}`
      : "A cotizar"; // If 0, show text instead of $0 or $10.000

  return {
    id: item.id,
    counterpartName: nameToDisplay, // Use the variable we calculated
    serviceName: item.title,
    date: dateStr,
    time: timeStr,
    status: mapStatusToUI(item.status), // Ensure this function is imported
    avatar: avatarToDisplay,
    price: priceDisplay,
  };
};

/* Transforma un estado en un texto con un color (Sin cambios, está perfecto) */
export const getStatusConfig = (statusUI: string) => {
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
