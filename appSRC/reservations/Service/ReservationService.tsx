import { supabase } from "@/appSRC/services/supabaseClient";
import {
  Reservation,
  ReservationDTO,
  ReservationPayload,
} from "../Type/ReservationType";
import { mapReservationFromDTO } from "../Mapper/ReservationMapper";
import { getTodayRangeString } from "../Helper/GetTodayRangeString";
import { RealtimeChannel } from "@supabase/supabase-js";
import { da } from "date-fns/locale";

// ============================================================================
// MARK: - SHARED / CORE SERVICES
// (Generic functionality used across domains)
// ============================================================================

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

/**
 * Busca el detalle completo de una reserva por su ID.
 * Incluye datos del profesional y categoría.
 */
// En tu archivo de servicios (ej. ReservationService.ts)

export const fetchReservationById = async (
  reservationId: string
): Promise<Reservation> => {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      professional:professional_profiles!reservations_to_pro_profile_fkey (
        legal_name,
        photo_url,
        biography
      )
    `
    )
    .eq("id", reservationId)
    .single();

  if (error) {
    console.error("❌ Error fetching reservation details for Client:", error);
    throw new Error(`Error al cargar reserva: ${error.message}`);
  }

  // Asegúrate de que tu mapReservationFromDTO maneje "professional" correctamente
  return mapReservationFromDTO(data as any);
};

// ============================================================================
// MARK: - CLIENT SERVICES
// (Creation, Monitoring & History)
// ============================================================================

// --- 1. CREATION ALIASES ---
export const createInstantReservation = createReservationService;
export const createQuoteReservation = createReservationService;

// --- 2. READING (ACTIVE & PENDING) ---

// appSRC/reservations/Service/ReservationService.tsx

// =============================================================================
// ACCIONES DE LECTURA (CLIENTE)
// =============================================================================
const HISTORY_PAGE_SIZE = 10;

/**
 * Trae reservas activas con DATOS DEL PROFESIONAL.
 * Status: confirmed, on_route, in_progress
 */
export const fetchClientActiveReservations = async (
  clientId: string
): Promise<Reservation[]> => {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      professional:professional_profiles!professional_id (
        legal_name,
        photo_url
      )
    `
    )
    .eq("client_id", clientId)
    .in("status", ["confirmed", "on_route", "in_progress"])
    .order("scheduled_range", { ascending: true });

  if (error) throw new Error(error.message);

  // Mapeo con Polyfill de Avatar
  return data.map((dto: any) => {
    if (dto.professional && dto.professional.photo_url) {
      dto.professional.avatar_url = dto.professional.photo_url;
    }
    return mapReservationFromDTO(dto);
  });
};

/**
 * Trae reservas pendientes.
 * Nota: En estado 'draft' o 'quoting' puede que no haya profesional asignado aún,
 * pero si lo hay (ej: pending_approval), lo traeremos.
 */
export const fetchClientPendingReservations = async (
  clientId: string
): Promise<Reservation[]> => {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      professional:professional_profiles!professional_id (
        legal_name,
        photo_url
      )
    `
    )
    .eq("client_id", clientId)
    .in("status", ["pending_approval", "quoting", "draft"])
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data.map((dto: any) => {
    if (dto.professional && dto.professional.photo_url) {
      dto.professional.avatar_url = dto.professional.photo_url;
    }
    return mapReservationFromDTO(dto);
  });
};

/**
 * Trae el historial paginado con DATOS DEL PROFESIONAL.
 */
export const fetchClientHistoryReservations = async (
  clientId: string,
  cursor?: string
) => {
  let query = supabase
    .from("reservations")
    .select(
      `
      *,
      professional:professional_profiles!professional_id (
        legal_name,
        photo_url
      )
    `
    )
    .eq("client_id", clientId)
    .in("status", ["completed", "canceled_client", "canceled_pro", "disputed"])
    .order("scheduled_range", { ascending: false })
    .limit(HISTORY_PAGE_SIZE);

  if (cursor) {
    query = query.lt("scheduled_range", cursor);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  const mappedData = data.map((dto: any) => {
    if (dto.professional && dto.professional.photo_url) {
      dto.professional.avatar_url = dto.professional.photo_url;
    }
    return mapReservationFromDTO(dto);
  });

  const nextCursor =
    data && data.length === HISTORY_PAGE_SIZE
      ? data[data.length - 1].scheduled_range
      : null;

  return {
    reservations: mappedData,
    nextCursor,
  };
};

// --- 4. ACTIONS (QUOTE FLOW) ---

/**
 * CONVERSIÓN DE PRESUPUESTO A RESERVA
 * 1. Crea la reserva en base a los datos del mensaje.
 * 2. (Opcional) El trigger de base de datos o el cliente debe actualizar el mensaje a 'accepted'.
 */

// 1. Crear Reserva (RPC)
export const confirmBudgetService = async (
  clientId: string,
  professionalId: string,
  budgetData: any
) => {
  const DEBUG_TAG = "🔍 [RESERVATION]";

  try {
    if (!budgetData || !budgetData.proposedDate) {
      throw new Error("Datos del presupuesto incompletos");
    }

    // Formato Técnico de Rango (Postgres tstzrange)
    const startDate = new Date(budgetData.proposedDate);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    const rangePayload = `[${startDate.toISOString()},${endDate.toISOString()})`;

    const payload = {
      p_client_id: clientId,
      p_professional_id: professionalId,
      p_category: "personalized_quote",
      p_modality: "quote",
      p_title: budgetData.serviceName || "Servicio Agendado",
      p_description: budgetData.notes || "",
      p_service_tags: [],
      p_address_display: "Ubicación del Cliente",
      p_address_coords: null,
      p_range: rangePayload,
      p_status: "confirmed",
      p_price_estimated: Number(budgetData.price),
      p_price_final: Number(budgetData.price),
      p_platform_fee: 0,
    };

    const { data, error } = await supabase.rpc(
      "create_reservation_bypass",
      payload
    );

    if (error) throw error;

    console.log(`${DEBUG_TAG} ✅ Reserva creada:`, data);
    return data;
  } catch (err) {
    console.error(`${DEBUG_TAG} 💥 Error:`, err);
    throw err;
  }
};
// ============================================================================
// MARK: - PROFESSIONAL SERVICES
// (Incoming Requests & Agenda Management)
// ============================================================================

// --- 1. READING (INCOMING REQUESTS) ---
// appSRC/reservations/Service/ReservationService.tsx

export const fetchProIncomingRequests = async (professionalId: string) => {
  const DEBUG_TAG = "🔍 [FETCH REQUESTS]";
  console.log(`${DEBUG_TAG} Init for Pro:`, professionalId);

  try {
    const { data, error } = await supabase
      .from("reservations")
      .select(
        `
        *,
        client:user_accounts!client_id (
          legal_name
        ),
        professional:professional_profiles!reservations_to_pro_profile_fkey (
          legal_name,
          photo_url
        )
      `
      )
      .eq("professional_id", professionalId)
      .in("status", ["pending_approval", "quoting", "draft"])
      .order("created_at", { ascending: false });

    if (error) {
      // 🛑 AQUÍ CAPTURAMOS EL ERROR REAL
      console.error(`${DEBUG_TAG} ❌ Supabase Error Code:`, error.code);
      console.error(`${DEBUG_TAG} ❌ Message:`, error.message);
      console.error(`${DEBUG_TAG} ❌ Details:`, error.details); // <--- ESTO ES CRUCIAL
      console.error(`${DEBUG_TAG} ❌ Hint:`, error.hint);
      throw new Error(error.message);
    }

    console.log(`${DEBUG_TAG} ✅ Query Success. Records found:`, data?.length);

    // Mapeo seguro para detectar si falla al convertir
    return (data as any[])
      .map((dto, index) => {
        try {
          // Polyfill del Avatar
          if (dto.professional && dto.professional.photo_url) {
            dto.professional.avatar_url = dto.professional.photo_url;
          }
          return mapReservationFromDTO(dto);
        } catch (mapError) {
          console.error(
            `${DEBUG_TAG} ⚠️ Mapping Error at index ${index}:`,
            mapError
          );
          return null; // O manejarlo como prefieras
        }
      })
      .filter(Boolean); // Filtrar nulos si hubo error de mapeo
  } catch (err) {
    console.error(`${DEBUG_TAG} 💥 Critical Failure in Service:`, err);
    throw err;
  }
};
// --- 2. READING (CONFIRMED AGENDA) ---
/**
 * FETCH: Trabajos Confirmados del Profesional (Agenda Activa)
 * Trae todas las reservas en estado 'confirmed' (y opcionalmente 'on_route' o 'in_progress').
 */
// ... imports

// =============================================================================
// [DEBUG] FETCH CONFIRMED WORKS
// =============================================================================
export const fetchProConfirmedWorks = async (professionalId: string) => {
  const DEBUG_TAG = "🔍 [DEBUG-SERVICE]";
  console.log("---------------------------------------------------------");
  console.log(`${DEBUG_TAG} Fetching Confirmed Works for Pro:`, professionalId);

  try {
    const { data, error } = await supabase
      .from("reservations")
      .select(
        `
        *,
        client:user_accounts!client_id(legal_name), 
        professional:professional_profiles!professional_id(legal_name, photo_url)
      `
      )
      .eq("professional_id", professionalId)
      .in("status", ["confirmed", "on_route", "in_progress"])

      // --- CAMBIO AQUÍ ---
      // Ordenar por FECHA DE CREACIÓN (Descendente) para ver la nueva arriba
      .order("created_at", { ascending: false });
    // Antes tenías: .order("scheduled_range", { ascending: true });

    if (error) {
      console.error(`${DEBUG_TAG} ❌ Error en Query Supabase:`, error.message);
      throw new Error(error.message);
    }

    if (data && data.length > 0) {
      console.log(`${DEBUG_TAG} Registros encontrados: ${data.length}`);
      // Log del PRIMERO (que ahora será el nuevo)
      console.log(`${DEBUG_TAG} >> MUESTRA RAW [0] (Más nueva):`, {
        id: data[0].id,
        range: data[0].scheduled_range,
        status: data[0].status,
      });
    }

    return (data as any[]).map(mapReservationFromDTO);
  } catch (err: any) {
    console.error(`${DEBUG_TAG} 💥 Excepción Crítica:`, err);
    throw err;
  }
};
// En ReservationService.ts

// ... imports

/**
 * FETCH: Historial Completo (Paginado)
 * Trae todo lo que ya "pasó": completado, cancelado (por cualquiera) o disputado.
 * Es la "Actividad" tipo Mercado Pago.
 */
// appSRC/reservations/Service/ReservationService.tsx

// appSRC/reservations/Service/ReservationService.tsx

/**
 * Obtiene el historial de reservas de un profesional con paginación y relaciones.
 * SOLUCIÓN: Usa 'profiles' en lugar de 'user_accounts' para obtener avatar y nombre.
 */
// appSRC/reservations/Service/ReservationService.tsx

export const fetchProHistoryReservations = async (
  professionalId: string,
  cursor?: string
) => {
  const DEBUG_TAG = "🔍 [FETCH HISTORY]";

  let query = supabase
    .from("reservations")
    .select(
      `
        *,
        client:user_accounts!client_id (
          legal_name
        ),
        professional:professional_profiles!professional_id (
          legal_name,
          photo_url
        )
      `
    )
    .eq("professional_id", professionalId)
    .order("scheduled_range", { ascending: false }) // CRÍTICO: Debe coincidir con el cursor
    .limit(HISTORY_PAGE_SIZE);

  if (cursor) {
    query = query.lt("scheduled_range", cursor);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  const mappedData = (data as any[]).map(mapReservationFromDTO);

  const nextCursor =
    data && data.length === HISTORY_PAGE_SIZE
      ? data[data.length - 1].scheduled_range
      : null;

  return {
    reservations: mappedData,
    nextCursor,
  };
};

// --- 3. ACTIONS (INSTANT / ZOLVER YA FLOW) ---

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

// ============================================================================
// MARK: - PROFESSIONAL FLOW CONTROL (Active Job & Status Machine)
// ============================================================================

/**
 * 1) FETCH ACTIVE JOB (The "Locking" Order)
 * Busca la reserva que tiene al profesional ocupado actualmente.
 * ESTADOS QUE BLOQUEAN: 'confirmed', 'on_route', 'in_progress'.
 */
export const fetchActiveProfessionalReservation = async (
  professionalId: string
): Promise<Reservation | null> => {
  console.log("[ZOLVER-DEBUG] Checking for Active Job...", professionalId);
  console.log(
    "🔍 [SERVICIO] Buscando trabajo activo para Pro ID:",
    professionalId
  );
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      client:user_accounts!reservations_client_id_fkey (
        auth_uid,
        legal_name,
        phone,
        email
      )
    `
    )
    .eq("professional_id", professionalId)
    .in("status", ["confirmed", "on_route", "in_progress"])
    .maybeSingle();

  if (error) {
    console.error(
      "[ZOLVER-DEBUG] ❌ Error checking active job:",
      error.message
    );
    throw new Error(error.message);
  }

  console.log(
    "📦 [SERVICIO] Data Cruda de Supabase:",
    JSON.stringify(data, null, 2)
  );

  if (data) {
    console.log("[ZOLVER-DEBUG] 🔒 Pro is BUSY with Reservation:", data.id);
    // Asumiendo que tienes esta función importada:
    return mapReservationFromDTO(data as any);
  }

  console.log("[ZOLVER-DEBUG] 🔓 Pro is FREE (No active job found).");
  return null;
};

/**
 * 2) FETCH SPECIFIC ORDER (With Security Check)
 * Obtiene el detalle de una orden específica.
 * CORRECCIÓN: Ahora trae los datos del CLIENTE también.
 */
export const fetchReservationByIdForProfessional = async (
  reservationId: string
) => {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
        *,
        client:user_accounts!reservations_client_id_fkey (
          legal_name,
          phone,
          email,
          auth_uid
        ),
        professional:professional_profiles!reservations_to_pro_profile_fkey (
          legal_name,
          photo_url
        )
      `
    )
    .eq("id", reservationId)
    .single();

  if (error) {
    console.error("❌ Error fetching details for PRO:", error);
    throw new Error(error.message);
  }

  return mapReservationFromDTO(data as any);
};

/**
 * 3) CHANGE STATUS (The State Machine)
 * Maneja las transiciones de estado.
 */
export const updateReservationStatusService = async (
  reservationId: string,
  professionalId: string,
  newStatus: "on_route" | "in_progress" | "completed"
) => {
  console.log(`[ZOLVER-DEBUG] Updating Status to: ${newStatus}`);

  // A. Actualizar el estado de la reserva
  const { data, error } = await supabase
    .from("reservations")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating status: ${error.message}`);
  }

  // B. SI EL TRABAJO FINALIZÓ -> LIBERAR AL PROFESIONAL
  if (newStatus === "completed") {
    console.log(
      "[ZOLVER-DEBUG] Job Completed. Attempting to Unlock Professional..."
    );

    const { error: unlockError } = await supabase
      .from("professional_profiles")
      .update({ is_active: true })
      .eq("user_id", professionalId);

    if (unlockError) {
      // ESTE ES EL ERROR QUE PROBABLEMENTE ESTÁ OCURRIENDO (RLS)
      console.error(
        "[ZOLVER-DEBUG] ⚠️ CRITICAL: Failed to unlock Pro (RLS Error?):",
        unlockError.message
      );
    } else {
      console.log(
        "[ZOLVER-DEBUG] ✅ Professional Unlocked successfully (is_active = true)."
      );
    }
  }

  // Retornamos la data mapeada
  // Nota: mapReservationFromDTO debe estar importado
  return data;
};

/**
 * 4) FETCH ACTIVE RESERVATION (Legacy/Utility)
 * CORRECCIÓN: Usaba 'client_profiles', cambiado a 'user_accounts' para consistencia con tu DB.
 */
export const fetchActiveReservationService = async (professionalId: string) => {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
        *, 
        client:user_accounts!reservations_client_id_fkey (
            legal_name, 
            display_name, 
            avatar_url,
            phone
        )
    `
    )
    .eq("professional_id", professionalId)
    .in("status", ["on_route", "in_progress"])
    .maybeSingle();

  if (error) {
    console.error("[ZOLVER-DEBUG] Error fetching active job:", error);
    return null;
  }
  return data;
};

/**
 * Suscribe al cliente a cambios en la tabla 'reservations' para un profesional específico.
 * @param professionalId - ID del profesional a escuchar
 * @param onUpdate - Callback que se ejecuta cuando hay un cambio
 * @returns El canal de suscripción (para poder cerrarlo después)
 */

// =============================================================================
// [REALTIME SUBSCRIPTION] - Production Ready
// =============================================================================
export const subscribeToIncomingRequestsService = (
  professionalId: string,
  onUpdate: () => void,
  onConnectionError: (status: string, error?: any) => void
): RealtimeChannel => {
  console.log(
    `🔌 [SERVICE] Iniciando handshake Realtime para Pro: ${professionalId}`
  );

  const channel = supabase
    .channel(`room_orders_${professionalId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "reservations",
        filter: `professional_id=eq.${professionalId}`,
      },
      (payload) => {
        console.log("🔔 [REALTIME] Payload recibido:", payload);
        onUpdate();
      }
    )
    .subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        console.log("✅ [REALTIME] Canal establecido y seguro.");
      }

      // Manejo de errores críticos para escalar al Hook
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error(`❌ [REALTIME] Falla crítica (${status}):`, err);
        onConnectionError(status, err);
      }
    });

  return channel;
};

export const unsubscribeFromChannel = async (channel: RealtimeChannel) => {
  // Verificamos estado antes de intentar remover para evitar errores basura
  if (channel && channel.state !== "closed") {
    console.log("🔌 [SERVICE] Cerrando canal de forma segura.");
    await supabase.removeChannel(channel);
  }
};

// =============================================================================
// ACCIONES DEL PROFESIONAL
// =============================================================================

/**
 * El Profesional RECHAZA el trabajo.
 * Estado resultante: 'REJECTED'
 */
export const rejectReservationByPro = async (
  reservationId: string,
  professionalId: string
) => {
  const { data, error } = await supabase
    .from("reservations")
    .update({
      status: "canceled_pro",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservationId)
    .eq("professional_id", professionalId) // 🔒 Security Guard: Solo el pro asignado
    .select()
    .single();

  if (error) throw error;
  return data;
};

// =============================================================================
// ACCIONES DEL CLIENTE
// =============================================================================

/**
 * El Cliente CANCELA la solicitud (antes de que sea aceptada o completada).
 * Estado resultante: 'CANCELLED'
 */
export const cancelReservationByClient = async (
  reservationId: string,
  clientId: string
) => {
  const { data, error } = await supabase
    .from("reservations")
    .update({
      status: "canceled_client",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservationId)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
