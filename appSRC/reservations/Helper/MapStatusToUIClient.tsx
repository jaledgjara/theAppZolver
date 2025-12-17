import {
  Reservation,
  ReservationStatusDTO,
} from "@/appSRC/reservations/Type/ReservationType";
import {
  ReservationCardProps,
  ReservationStatus as ReservationStatusUI,
} from "@/appSRC/reservations/Screens/Client/ReservationCard";

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

/**
 * Transforma la Entidad de Dominio (Reservation)
 * en las Props exactas que necesita la Tarjeta Visual.
 */
export const mapReservationToCard = (
  item: Reservation
): ReservationCardProps => {
  // Formateo de fecha y hora (Localización Argentina)
  const dateObj = new Date(item.schedule.startDate);

  // Ej: "15 de diciembre"
  const dateStr = dateObj.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
  });

  // Ej: "14:30"
  const timeStr = dateObj.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    id: item.id,
    // TODO: Usar el nombre real cuando el backend lo envíe en el join
    professionalName: "Profesional Zolver",
    serviceName: item.title,
    date: dateStr,
    time: timeStr,
    status: mapStatusToUI(item.status),
    // Placeholder hasta tener bucket de imágenes real
    avatar: require("@/appASSETS/RawImages/avatar-0.jpg"),
    price: item.financials.priceEstimated
      ? `$${item.financials.priceEstimated.toLocaleString("es-AR")}`
      : undefined,
  };
};

/* Transforma un estado en un texto con un color */
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
