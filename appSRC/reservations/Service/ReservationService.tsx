import { supabase } from "@/appSRC/services/supabaseClient";
import {
  Reservation,
  ReservationPayload,
  ReservationStatusDTO,
} from "../Type/ReservationType";
import { mapReservationFromDTO } from "../Mapper/ReservationMapper";
import { RealtimeChannel } from "@supabase/supabase-js";

// ============================================================================
// MARK: - SHARED / CORE SERVICES
// (Funcionalidad genérica utilizada por ambos roles)
// ============================================================================

/**
 * Crea una nueva reserva utilizando una función RPC segura.
 * Se utiliza tanto para flujos 'Instant' como 'Quote'.
 * * @param payload Datos necesarios para la creación de la reserva.
 * @returns Objeto con el ID de la reserva creada y los datos enviados.
 */
export const createReservationService = async (payload: ReservationPayload) => {
  console.log("Service - Sending RPC creation...", payload.status);

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
    p_status: payload.status,
    p_price_estimated: payload.price_estimated,
    p_price_final: payload.price_final,
    p_platform_fee: payload.platform_fee || 0,
  });

  if (error) {
    console.error("RPC ERROR:", error.message);
    throw new Error(error.message);
  }

  // Verificación opcional de persistencia
  if (data) {
    const check = await supabase
      .from("reservations")
      .select("status")
      .eq("id", data)
      .single();
    console.log("DB Persistence verified:", check.data?.status);
  }

  return { id: data, ...payload };
};

/**
 * Recupera el detalle completo de una reserva por su ID.
 * Incluye la relación con el perfil profesional.
 * * @param reservationId ID de la reserva.
 * @returns Entidad de dominio Reservation.
 */
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
    console.error("Error fetching reservation details:", error);
    throw new Error(`Error al cargar reserva: ${error.message}`);
  }

  return mapReservationFromDTO(data as any);
};

// ============================================================================
// MARK: - CLIENT SERVICES
// ============================================================================

// --- 1. CREATION ALIASES ---
export const createInstantReservation = createReservationService;
export const createQuoteReservation = createReservationService;

// --- 2. READ OPERATIONS (Lists & History) ---

const HISTORY_PAGE_SIZE = 10;

/**
 * Obtiene las reservas activas del cliente.
 * Estados: confirmed, on_route, in_progress.
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

  return data.map((dto: any) => {
    if (dto.professional && dto.professional.photo_url) {
      dto.professional.avatar_url = dto.professional.photo_url;
    }
    return mapReservationFromDTO(dto);
  });
};

/**
 * Obtiene las reservas pendientes o en proceso de cotización.
 * Estados: pending_approval, quoting, draft.
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
 * Obtiene el historial de reservas finalizadas o canceladas (Paginado).
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

// --- 3. QUOTE FLOW (Specific Actions) ---

/**
 * Confirma un presupuesto convirtiéndolo en una reserva oficial.
 * Transforma los datos del chat/presupuesto en una estructura de reserva válida.
 * * @param clientId ID del cliente.
 * @param professionalId ID del profesional.
 * @param budgetData Payload JSON del presupuesto aceptado.
 */
export const confirmBudgetService = async (
  clientId: string,
  professionalId: string,
  budgetData: any
) => {
  try {
    if (!budgetData || !budgetData.proposedDate) {
      throw new Error("Datos del presupuesto incompletos");
    }

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
    return data;
  } catch (err) {
    console.error("Error confirming budget:", err);
    throw err;
  }
};

/**
 * Cancela una reserva por parte del cliente.
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

// ============================================================================
// MARK: - PROFESSIONAL SERVICES
// ============================================================================

// --- 1. READ OPERATIONS (Inbox & Agenda) ---

/**
 * Obtiene las solicitudes entrantes para el profesional.
 * Incluye nuevas cotizaciones y solicitudes pendientes de aprobación.
 */
export const fetchProIncomingRequests = async (professionalId: string) => {
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
      console.error("Error fetching pro requests:", error.message);
      throw new Error(error.message);
    }

    return (data as any[])
      .map((dto) => {
        try {
          if (dto.professional && dto.professional.photo_url) {
            dto.professional.avatar_url = dto.professional.photo_url;
          }
          return mapReservationFromDTO(dto);
        } catch (mapError) {
          console.warn("Mapping error:", mapError);
          return null;
        }
      })
      .filter(Boolean);
  } catch (err) {
    console.error("Critical failure fetching requests:", err);
    throw err;
  }
};

/**
 * Obtiene la agenda confirmada del profesional.
 * Ordenada por fecha de creación descendente (lo más nuevo arriba).
 */
export const fetchProConfirmedWorks = async (professionalId: string) => {
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
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data as any[]).map(mapReservationFromDTO);
  } catch (err: any) {
    console.error("Exception fetching confirmed works:", err);
    throw err;
  }
};

/**
 * Obtiene el historial de trabajos del profesional (Paginado).
 */
export const fetchProHistoryReservations = async (
  professionalId: string,
  cursor?: string
) => {
  // Definimos los estados que queremos ver en la pestaña "Historial".
  // Basado en tu DTO real:
  const targetStatuses: ReservationStatusDTO[] = [
    "confirmed", // Activa (Aceptada)
    "on_route", // Activa (En camino)
    "in_progress", // Activa (Trabajando)
    "completed", // Finalizada (Éxito)
    "canceled_client", // Cancelada por cliente (CORREGIDO)
    "canceled_pro", // Cancelada por ti/Rechazada (CORREGIDO)
    "disputed", // En disputa
  ];

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
    // Usamos el array corregido sin "rejected" ni "finalized" ni doble L
    .in("status", targetStatuses)
    .eq("professional_id", professionalId)
    .order("scheduled_range", { ascending: false })
    .limit(HISTORY_PAGE_SIZE);

  if (cursor) {
    query = query.lt("scheduled_range", cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ Error en fetchProHistoryReservations:", error.message);
    throw new Error(error.message);
  }

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

// --- 2. INSTANT FLOW / ZOLVER YA (Specific Actions) ---

/**
 * Confirma una reserva Instantánea (Zolver Ya).
 * Realiza dos acciones atómicas:
 * 1. Confirma la reserva y la asigna al profesional (Claim).
 * 2. Bloquea al profesional (is_active = false) para evitar nuevas asignaciones.
 */
export const confirmInstantReservationService = async (
  reservationId: string,
  professionalId: string
) => {
  console.log("Service - Confirming Instant Reservation");

  try {
    // 1. Confirmar y asignar
    const { data: reservationData, error: resError } = await supabase
      .from("reservations")
      .update({
        status: "confirmed",
        professional_id: professionalId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservationId)
      .select()
      .single();

    if (resError) throw resError;

    // 2. Bloquear disponibilidad (Side Effect)
    const { error: statusError } = await supabase
      .from("professional_profiles")
      .update({ is_active: false })
      .eq("user_id", professionalId);

    if (statusError) {
      console.warn(
        "Warning: Could not update is_active status:",
        statusError.message
      );
    }

    return mapReservationFromDTO(reservationData as any);
  } catch (err: any) {
    console.error("Exception confirming instant reservation:", err);
    throw err;
  }
};

// --- 3. WORKFLOW CONTROL (State Machine) ---

/**
 * Busca si el profesional tiene un trabajo activo que lo esté bloqueando.
 * Estados bloqueantes: confirmed, on_route, in_progress.
 */
export const fetchActiveProfessionalReservation = async (
  professionalId: string
): Promise<Reservation | null> => {
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
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    return mapReservationFromDTO(data as any);
  }

  return null;
};

/**
 * Obtiene una reserva específica con datos completos del cliente para la vista del Profesional.
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
    throw new Error(error.message);
  }

  return mapReservationFromDTO(data as any);
};

/**
 * Legacy: Obtiene reserva activa (Variante alternativa).
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
    console.error("Error fetching active job (Legacy):", error);
    return null;
  }
  return data;
};

/**
 * Actualiza el estado de la reserva y gestiona la disponibilidad del profesional.
 * Si el estado es 'completed', libera al profesional (is_active = true).
 */
export const updateReservationStatusService = async (
  reservationId: string,
  professionalId: string,
  newStatus: "on_route" | "in_progress" | "completed"
) => {
  // A. Actualizar estado de la reserva
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

  // B. Liberar al profesional si finalizó
  if (newStatus === "completed") {
    const { error: unlockError } = await supabase
      .from("professional_profiles")
      .update({ is_active: true })
      .eq("user_id", professionalId);

    if (unlockError) {
      console.error("Critical: Failed to unlock Pro:", unlockError.message);
    }
  }

  return data;
};

/**
 * Rechaza una reserva por parte del profesional.
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
    .eq("professional_id", professionalId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// --- 4. REALTIME (Subscriptions) ---

/**
 * Suscribe a eventos de nuevas reservas para un profesional.
 */
export const subscribeToIncomingRequestsService = (
  professionalId: string,
  onUpdate: () => void,
  onConnectionError: (status: string, error?: any) => void
): RealtimeChannel => {
  console.log(`Service - Realtime Handshake for Pro: ${professionalId}`);

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
        console.log("Realtime Payload:", payload);
        onUpdate();
      }
    )
    .subscribe((status, err) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error(`Realtime Error (${status}):`, err);
        onConnectionError(status, err);
      }
    });

  return channel;
};

/**
 * Cierra un canal de realtime de forma segura.
 */
export const unsubscribeFromChannel = async (channel: RealtimeChannel) => {
  if (channel && channel.state !== "closed") {
    console.log("Service - Closing channel safely.");
    await supabase.removeChannel(channel);
  }
};
