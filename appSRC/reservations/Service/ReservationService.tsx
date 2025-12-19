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
  // [ZOLVER-DEBUG] 02: Entrada al Servicio
  console.log("[ZOLVER-DEBUG] 02: Service - Sending RPC...", payload.status);

  const { data, error } = await supabase.rpc("create_reservation_bypass", {
    p_client_id: payload.client_id,
    p_professional_id: payload.professional_id,
    p_category: payload.service_category,
    p_modality: payload.service_modality,
    p_title: payload.title,
    p_description: payload.description,
    p_service_tags: payload.service_tags,
    p_address_display: payload.address_street,
    p_address_coords: payload.address_coords || null,
    p_range: payload.scheduled_range,
    p_status: payload.status, // <--- Verifica que esto coincida con los argumentos de tu RPC
    p_price_estimated: payload.price_estimated,
    p_price_final: payload.price_final,
    p_platform_fee: payload.platform_fee || 0,
  });

  if (error) {
    console.error("[ZOLVER-DEBUG] ❌ RPC ERROR:", error.message);
    throw new Error(error.message);
  }

  console.log("[ZOLVER-DEBUG] ✅ RPC SUCCESS. ID:", data); // Asumiendo que devuelve el ID

  // Opcional: Hacer un fetch inmediato de lo que acabamos de crear para confirmar persistencia
  if (data) {
    const check = await supabase
      .from("reservations")
      .select("status")
      .eq("id", data)
      .single();
    console.log("[ZOLVER-DEBUG] VERIFY DB STATUS:", check.data?.status);
  }

  return { id: data, ...payload }; // Retorno mockeado o real según tu RPC
};

// Aliases for compatibility with your existing Hooks
export const createInstantReservation = createReservationService;
export const createQuoteReservation = createReservationService;

// ============================================================================
// 1. FETCHING: A)INSTANT B)QUOTE C)CLIENTS
// ============================================================================

//A)
// B) LECTURA (PROFESIONAL)
export const fetchProIncomingRequests = async (professionalId: string) => {
  console.log(
    "[ZOLVER-DEBUG] 03: Service - Fetching Requests for Pro:",
    professionalId
  );

  // NOTA DE ARQUITECTURA:
  // Revisa que .in() incluya el status que definimos en el Builder ('pending_approval')
  const { data, error } = await supabase
    .from("reservations")
    .select(`*, professional:professional_id(legal_name)`)
    .eq("professional_id", professionalId)
    .in("status", ["pending_approval", "quoting", "draft"]) // <--- AÑADIR TODOS PARA DEBUG
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ZOLVER-DEBUG] ❌ FETCH ERROR:", error.message);
    throw new Error(error.message);
  }

  console.log(`[ZOLVER-DEBUG] ✅ FETCH FOUND: ${data?.length} records`);
  if (data && data.length > 0) {
    console.log("[ZOLVER-DEBUG] Sample Record Status:", data[0].status);
  } else {
    console.log("[ZOLVER-DEBUG] ⚠️ No records found via Query.");
  }

  return (data as any[]).map(mapReservationFromDTO);
};

// ... imports y funciones existentes ...

/**
 * FETCH: Trabajos Confirmados del Profesional (Agenda Activa)
 * Trae todas las reservas en estado 'confirmed' (y opcionalmente 'on_route' o 'in_progress').
 */
export const fetchProConfirmedWorks = async (professionalId: string) => {
  console.log("---------------------------------------------------------");
  console.log(
    "[ZOLVER-DEBUG] 01: Service - Fetching Confirmed Works for Pro:",
    professionalId
  );

  try {
    const { data, error } = await supabase
      .from("reservations")
      .select(`*, professional:professional_id(legal_name)`)
      .eq("professional_id", professionalId)
      // FILTRO CRÍTICO: Solo trabajos confirmados listos para ejecutar
      .in("status", ["confirmed", "on_route", "in_progress"])
      .order("scheduled_range", { ascending: true }); // Ordenar por fecha de inicio (lo más próximo primero)

    if (error) {
      console.error("[ZOLVER-DEBUG] ❌ FETCH ERROR:", error.message);
      throw new Error(error.message);
    }

    console.log(
      `[ZOLVER-DEBUG] ✅ FETCH FOUND: ${data?.length} confirmed records`
    );

    if (data && data.length > 0) {
      console.log("[ZOLVER-DEBUG] Sample Record ID:", data[0].id);
      console.log("[ZOLVER-DEBUG] Sample Status:", data[0].status);
    } else {
      console.log("[ZOLVER-DEBUG] ⚠️ No confirmed works found.");
    }

    // Mapeamos al modelo de dominio seguro para la UI
    return (data as any[]).map(mapReservationFromDTO);
  } catch (err: any) {
    console.error(
      "[ZOLVER-DEBUG] ❌ EXCEPTION in fetchProConfirmedWorks:",
      err
    );
    throw err;
  }
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

// ... imports existentes

/**
 * CONVERSIÓN DE PRESUPUESTO A RESERVA
 * 1. Crea la reserva en base a los datos del mensaje.
 * 2. (Opcional) El trigger de base de datos o el cliente debe actualizar el mensaje a 'accepted'.
 */
export const confirmBudgetService = async (
  clientId: string,
  professionalId: string,
  budgetData: any // El payload que venía en el mensaje
) => {
  console.log("[ZOLVER-DEBUG] Converting Budget to Reservation...");

  // 1. Construimos el Payload de Reserva compatible con tu RPC o Insert
  // NOTA: Asumimos 'quote' porque viene de un presupuesto
  const { data, error } = await supabase.rpc("create_reservation_bypass", {
    p_client_id: clientId,
    p_professional_id: professionalId,
    p_category: "personalized_quote", // O la categoría real si la guardaste en el payload
    p_modality: "quote",
    p_title: budgetData.serviceName,
    p_description: budgetData.notes,
    p_service_tags: [],
    p_address_display: "Ubicación del Cliente", // Deberías sacar esto del Store de Ubicación
    p_address_coords: null,
    p_range: `[${budgetData.proposedDate},${budgetData.proposedDate})`, // Rango simple
    p_status: "confirmed", // <--- NACE CONFIRMADA
    p_price_estimated: budgetData.price,
    p_price_final: budgetData.price,
    p_platform_fee: 0,
  });

  if (error) throw new Error(error.message);

  return data; // Retorna el ID de la nueva reserva
};

/**
 * CONFIRMACIÓN DE SERVICIO INSTANTÁNEO (Zolver Ya)
 * * Flujo Crítico:
 * 1. El Profesional acepta la solicitud -> Reserva pasa a 'confirmed'.
 * 2. El Profesional se bloquea -> is_active pasa a false (Busy).
 */
export const confirmInstantReservationService = async (
  reservationId: string,
  professionalId: string
) => {
  console.log("---------------------------------------------------------");
  console.log("[ZOLVER-DEBUG] 01: Service - Confirming Instant Reservation");
  console.log(
    `[ZOLVER-DEBUG] Reservation: ${reservationId} | Pro: ${professionalId}`
  );

  try {
    // PASO 1: Confirmar la Reserva y Asignar al Profesional
    // Es vital asegurar que el professional_id se grabe por si era una solicitud broadcast (sin dueño previo)
    const { data: reservationData, error: resError } = await supabase
      .from("reservations")
      .update({
        status: "confirmed", // Estado objetivo
        professional_id: professionalId, // Reclamo del trabajo (Claim)
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservationId)
      .select()
      .single();

    if (resError) {
      console.error(
        "[ZOLVER-DEBUG] ❌ Error confirmando reserva:",
        resError.message
      );
      throw resError;
    }
    console.log("[ZOLVER-DEBUG] ✅ Reserva confirmada exitosamente.");

    // PASO 2: Bloquear Disponibilidad del Profesional (Side Effect)
    // El profesional ya no está disponible para "Zolver Ya" porque está "En Camino"
    // NOTA: Asumimos tabla 'professional_profiles'. Ajustar si usas 'users' o 'profiles'.
    const { error: statusError } = await supabase
      .from("professional_profiles")
      .update({ is_active: false })
      .eq("user_id", professionalId);

    if (statusError) {
      // Logueamos pero NO fallamos la transacción principal (la reserva ya es suya)
      console.warn(
        "[ZOLVER-DEBUG] ⚠️ Warning: No se pudo actualizar is_active:",
        statusError.message
      );
    } else {
      console.log(
        "[ZOLVER-DEBUG] 🔒 Profesional marcado como OCUPADO (is_active = false)"
      );
    }

    // Retornamos la reserva mapeada para actualizar la UI inmediatamente
    return mapReservationFromDTO(reservationData as any);
  } catch (err: any) {
    console.error(
      "[ZOLVER-DEBUG] ❌ EXCEPTION in confirmInstantReservationService:",
      err
    );
    throw err;
  }
};
