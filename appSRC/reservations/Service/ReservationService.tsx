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
export const createInstantReservation = async (payload: ReservationPayload) => {
  const endTime = new Date(payload.startTime);
  endTime.setHours(endTime.getHours() + (payload.durationHours || 1));

  // Formato Postgres TSTZRANGE: [start, end)
  const rangeString = `[${payload.startTime.toISOString()},${endTime.toISOString()})`;

  // Formato Postgres POINT: (x,y) -> (lng,lat) cuidado con el orden
  // Nota: Postgres suele usar (lng, lat) para tipos geográficos
  const pointString = `(${payload.location.coords.lng},${payload.location.coords.lat})`;

  // LLAMADA RPC ACTUALIZADA
  const { data, error } = await supabase.rpc("create_reservation_bypass", {
    p_client_id: payload.clientId,
    p_professional_id: payload.professionalId,
    p_category: payload.category,
    p_modality: "instant",

    // ✅ Nuevos Campos
    p_title: payload.title,
    p_description: payload.description,
    p_service_tags: payload.tags, // Supabase serializa JSONB automáticamente

    p_address_display: payload.location.addressText,
    p_address_coords: pointString, // Pasamos el string formateado como Point

    p_range: rangeString,
    p_status: "pending_approval",

    p_price_estimated: payload.priceEstimated,
    p_price_final: payload.priceEstimated * 1.2, // Ejemplo con Fee (ajustar lógica)
    p_platform_fee: payload.priceEstimated * 0.2,
  });

  if (error) {
    console.error("RPC Error:", error);
    throw new Error(error.message);
  }

  return data as ReservationDTO;
};

//B
export const createQuoteReservation = async (
  payload: ReservationPayload
): Promise<Reservation> => {
  const duration = 1;
  const endTime = new Date(payload.startTime);
  endTime.setHours(endTime.getHours() + duration);
  const rangeString = `[${payload.startTime.toISOString()},${endTime.toISOString()})`;

  const { data, error } = await supabase.rpc("create_reservation_bypass", {
    p_client_id: payload.clientId,
    p_professional_id: payload.professionalId,
    p_category: payload.category,
    p_modality: "quote",
    p_title: payload.title,
    p_description: payload.description,
    p_address: payload.location,
    p_range: rangeString,
    p_status: "quoting",
    p_price_estimated: 0,
    p_price_final: null,
    p_platform_fee: 0,
  });

  if (error) throw new Error(error.message);

  return mapReservationFromDTO(data as ReservationDTO);
};

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
