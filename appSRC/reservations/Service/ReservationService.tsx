import { supabase } from "@/appSRC/services/supabaseClient";
import {
  Reservation,
  ReservationDTO,
  ReservationPayload,
} from "../Type/ReservationType";
import { mapReservationFromDTO } from "../Mapper/ReservationMapper";
import { getTodayRangeString } from "../Helper/GetTodayRangeString";

// ============================================================================
// 1. UPLOADING: A)INSTANT B)QUOTE
// ============================================================================

//A
export const createReservationService = async (payload: ReservationPayload) => {
  // 1. RPC CALL
  // We map the snake_case Payload to the p_ arguments of the RPC
  const { data, error } = await supabase.rpc("create_reservation_bypass", {
    // Keys
    p_client_id: payload.client_id,
    p_professional_id: payload.professional_id,
    p_category: payload.service_category,
    p_modality: payload.service_modality,

    // Content
    p_title: payload.title,
    p_description: payload.description,
    p_service_tags: payload.service_tags,

    // Location (Already formatted by Builder)
    p_address_display: payload.address_street, // passing the full string here
    p_address_coords: payload.address_coords || null,

    // Time (Already formatted by Builder)
    p_range: payload.scheduled_range,
    p_status: payload.status,

    // Money
    p_price_estimated: payload.price_estimated,
    p_price_final: payload.price_final,
    p_platform_fee: payload.platform_fee || 0,
  });

  if (error) {
    console.error("RPC Error:", error);
    throw new Error(error.message);
  }

  // 2. Map response to Domain Entity
  return mapReservationFromDTO(data as ReservationDTO);
};

// Aliases for compatibility with your existing Hooks
export const createInstantReservation = createReservationService;
export const createQuoteReservation = createReservationService;

// ============================================================================
// 1. FETCHING: A)INSTANT B)QUOTE C)CLIENTS
// ============================================================================

//A)
export const fetchProIncomingRequests = async (
  professionalId: string
): Promise<Reservation[]> => {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("professional_id", professionalId) // Solo mis solicitudes
    .eq("service_modality", "instant") // Solo modalidad Instantánea
    .eq("status", "pending_approval") // Que estén esperando confirmación
    .order("created_at", { ascending: false }); // Las más recientes primero

  if (error) {
    console.error("❌ Error fetching incoming requests:", error);
    throw new Error("No se pudieron cargar las solicitudes.");
  }

  // Mapear de DTO crudo a Entidad limpia
  return (data as ReservationDTO[]).map(mapReservationFromDTO);
};

const HISTORY_PAGE_SIZE = 10;
/**
 * Trae reservas que requieren atención inmediata o futura.
 * Status: confirmed, on_route, in_progress
 */
export const fetchClientActiveReservations = async (
  clientId: string
): Promise<Reservation[]> => {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("client_id", clientId)
    .in("status", ["confirmed", "on_route", "in_progress"])
    .order("scheduled_range", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as any[]).map(mapReservationFromDTO);
};

/**
 * Trae reservas en negociación o espera.
 * Status: pending_approval, quoting, draft
 */
export const fetchClientPendingReservations = async (
  clientId: string
): Promise<Reservation[]> => {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("client_id", clientId)
    .in("status", ["pending_approval", "quoting", "draft"])
    .order("created_at", { ascending: false }); // Las creadas más recientemente primero

  if (error) throw new Error(error.message);
  return (data as any[]).map(mapReservationFromDTO);
};

// ============================================================================
// 2. COLD DATA (Historical) - CURSOR PAGINATION
// ============================================================================

/**
 * Trae el historial paginado.
 * Status: completed, canceled_*, disputed
 * @param cursor - (Opcional) La fecha de inicio de la última reserva cargada.
 */
export const fetchClientHistoryReservations = async (
  clientId: string,
  cursor?: string
) => {
  let query = supabase
    .from("reservations")
    .select("*")
    .eq("client_id", clientId)
    .in("status", ["completed", "canceled_client", "canceled_pro", "disputed"])
    // Ordenar por fecha de servicio descendente (lo más reciente arriba)
    // Nota: lower(scheduled_range) accede al inicio del rango en Postgres
    .order("scheduled_range", { ascending: false })
    .limit(HISTORY_PAGE_SIZE);

  // Si hay cursor, traemos solo las que tienen fecha MENOR (más antigua) al cursor
  if (cursor) {
    query = query.lt("scheduled_range", cursor);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  const mappedData = (data as any[]).map(mapReservationFromDTO);

  // Calcular el siguiente cursor
  const nextCursor =
    data && data.length === HISTORY_PAGE_SIZE
      ? data[data.length - 1].scheduled_range // Usamos el string raw del rango como cursor
      : null;

  return {
    reservations: mappedData,
    nextCursor,
  };
};

/**
 * Busca el detalle completo de una reserva por su ID.
 * Incluye datos del profesional y categoría.
 */
export const fetchReservationById = async (
  reservationId: string
): Promise<Reservation> => {
  // CORRECCIÓN: Pedimos 'legal_name' en lugar de 'display_name'.
  // Quitamos 'photo_url' porque tu tabla no tiene esa columna.
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      professional:professional_id ( legal_name )
    `
    )
    .eq("id", reservationId)
    .single();

  if (error) {
    console.error("Error fetching reservation details:", error);
    throw new Error(`Error al cargar reserva: ${error.message}`);
  }

  return mapReservationFromDTO(data as any);
};
