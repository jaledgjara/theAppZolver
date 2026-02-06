import { ReservationCardProps } from "@/appCOMP/cards/ReservationCard";
import {
  Reservation,
  ReservationStatusDTO,
  ReservationStatusUI,
} from "@/appSRC/reservations/Type/ReservationType";

/**
 * Convierte el estado técnico (DTO) -> Estado Visual (UI)
 * Mantenemos esto por si alguna parte de la app lo necesita aislado.
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
 * Transforma la ENTIDAD DE DOMINIO (Reservation) -> PROPS VISUALES (Card)
 * Ahora es mucho más simple porque la Entidad ya viene limpia.
 */
export const mapReservationToCard = (
  item: Reservation,
  viewRole: "client" | "professional"
): ReservationCardProps => {
  // 🛡️ 1. BLOQUE DEFENSIVO
  if (!item) {
    return {
      id: "error",
      counterpartName: "Error",
      serviceName: "Datos no disponibles",
      date: "--",
      time: "--:--",
      status: "pending",
      avatar: require("@/appASSETS/RawImages/avatar-0.jpg"),
      price: "Error",
      viewRole: viewRole,
    };
  }

  // ========================================================================
  // 🕒 2. LÓGICA DE FECHA (CORREGIDA PARA QUOTING/PENDING)
  // ========================================================================

  let targetDate: Date | null = null;

  // A. Si es Instantánea, SIEMPRE usamos la fecha de creación (createdAt)
  if (item.modality === "instant") {
    targetDate = item.createdAt;
  }
  // B. Si es Agendada (Quote), intentamos usar la fecha del turno...
  else {
    targetDate = item.scheduledStart;
  }

  // C. FALLBACK CRÍTICO PARA "QUOTING/PENDING":
  // Si targetDate es null (común en cotizaciones nuevas) o inválido,
  // usamos createdAt para que la tarjeta tenga SU propia hora y no "Ahora".
  if (!targetDate || isNaN(targetDate.getTime())) {
    targetDate = item.createdAt;
  }

  // D. Fallback Final (Solo si createdAt también estuviera roto)
  const dateObj = targetDate || new Date();

  // ========================================================================

  const dateStr = dateObj.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });

  const timeStr = dateObj.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // 3. RETORNO LIMPIO
  return {
    id: item.id,
    // Usamos el nombre que ya resolvió el Mapper en la capa de datos
    counterpartName:
      item.roleName || (viewRole === "client" ? "Profesional" : "Cliente"),
    serviceName: item.serviceTitle || "Servicio",
    date: dateStr,
    time: timeStr,
    status: item.statusUI,
    avatar: item.roleAvatar,
    price:
      item.financials?.price > 0
        ? `$${item.financials.price.toLocaleString("es-AR")}`
        : "A cotizar",

    viewRole: viewRole,
  };
};

// Configuración de colores (opcional, si la usas fuera de la tarjeta)
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
