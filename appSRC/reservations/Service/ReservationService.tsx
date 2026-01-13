import { supabase } from "@/appSRC/services/supabaseClient";
import {
  CreatePaidReservationPayload,
  Reservation,
  ReservationDTO,
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
 * CREAR RESERVA PAGADA (Flow Principal - Instant)
 * Llama a la Edge Function. Maneja Pago + Reserva en una sola transacción atómica.
 */
export const createPaidReservation = async (
  payload: CreatePaidReservationPayload
) => {
  console.log(
    "[ReservationService] 📡 Invocando Edge Function: process-payment-reservation función"
  );

  const { data, error } = await supabase.functions.invoke(
    "process-payment-reservation",
    {
      body: payload,
    }
  );

  if (error) {
    console.error("[ReservationService] 💥 Error de Red/Función:", error);
    throw error;
  }

  // La función puede responder 200 OK pero con success: false en el JSON lógico
  if (!data.success) {
    console.error("[ReservationService] ⛔ Rechazo de Negocio:", data.error);
    throw new Error(data.error || "No se pudo procesar el pago o la reserva.");
  }

  return data.data; // Retorna { reservation_id, payment_id, status }
};

/**
 * Esto rechaza y devuelve el dinero del usuario.
 * Se añade 'triggeredBy' para que la DB sepa quién canceló.
 */
export const rejectReservationWithRefund = async (
  reservationId: string,
  reason: string,
  triggeredBy: "professional" | "user" = "professional" // Por defecto pro, pero flexible
) => {
  const { data, error } = await supabase.functions.invoke(
    "cancel-reservation-refund",
    {
      body: {
        reservation_id: reservationId,
        reason,
        triggered_by: triggeredBy,
      },
    }
  );

  if (error || !data.success) throw new Error("Error procesando el reembolso.");
  return data;
};

/**
 * Crea una nueva reserva utilizando una función RPC segura.
 * Se utiliza tanto para flujos 'Instant' como 'Quote'.
 */
export const createReservationService = async (payload: ReservationPayload) => {
  console.log("Service - Sending RPC creation...", payload.status);

  // NOTA: Asegúrate de que tu ReservationPayload tenga 'platform_fee' opcional (?)
  // Si TS se queja, lo casteamos a any temporalmente o actualizas el Type.
  const fee = (payload as any).platform_fee || 0;

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
    p_platform_fee: fee,
  });

  if (error) {
    console.error("RPC ERROR:", error.message);
    throw new Error(error.message);
  }

  return { id: data, ...payload };
};

/**
 * Recupera el detalle completo de una reserva.
 * Trae relaciones de Profesional y Cliente para permitir la reutilización en ambos roles.
 */
export const fetchReservationById = async (
  reservationId: string,
  viewRole: "client" | "professional"
): Promise<Reservation> => {
  console.log(
    `🔍 [SERVICE] Fetching ID: ${reservationId} for Role: ${viewRole}`
  );

  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
      *,
      professional:professional_profiles!reservations_to_pro_profile_fkey (
        legal_name,
        photo_url,
        biography,
        user_id
      ),
      client:user_accounts!reservations_client_id_fkey (
        id, 
        legal_name, 
        email, 
        phone,
        auth_uid
      )
    `
    )
    .eq("id", reservationId)
    .single();

  if (error) {
    console.error("❌ [SERVICE] Error fetching:", error);
    throw new Error(`Error al cargar reserva: ${error.message}`);
  }

  // 1. LOG CRÍTICO: ¿Qué string EXACTO viene de la base de datos?
  // Aquí esperamos ver algo como: '["2024-01-20 15:30:00+00","2024-01-20..."]'
  console.log(
    "📦 [SERVICE] DATA CRUDO (Scheduled Range):",
    data?.scheduled_range
  );

  // 2. TRANSFORMACIÓN
  const result = mapReservationFromDTO(data as any, viewRole);

  // 3. LOG CRÍTICO: ¿Cómo quedó la fecha después del Mapper?
  // Si aquí ves "Date { NaN }", significa que mapReservationFromDTO (y TimeBuilder) mataron la fecha.
  console.log("🛠️ [SERVICE] MAPPED DATE:", result.scheduledStart);

  if (result.scheduledStart && isNaN(result.scheduledStart.getTime())) {
    console.error(
      "🚨 [SERVICE] ERROR FATAL: La fecha se corrompió dentro del Mapper."
    );
  } else {
    console.log("✅ [SERVICE] Fecha procesada correctamente.");
  }

  return result;
};

// ============================================================================
// MARK: - CLIENT SERVICES
// ============================================================================

export const createInstantReservation = createReservationService;
export const createQuoteReservation = createReservationService;

const HISTORY_PAGE_SIZE = 10;

// ... imports

/**
 * Obtiene las reservas activas del cliente.
 * FIX: Agregamos order by created_at para desempatar rangos idénticos.
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

    // ✅ FIX ORDENAMIENTO:
    .order("scheduled_range", { ascending: true }) // Lo más próximo primero
    .order("created_at", { ascending: true }); // Desempate

  if (error) throw new Error(error.message);

  return (data as any[]).map((dto) => {
    // ✅ FIX: Pasamos "client" para que el mapper sepa que somos nosotros
    // y ponga el nombre del PROFESIONAL en la tarjeta.
    return mapReservationFromDTO(dto, "client");
  });
};

/**
 * Obtiene las reservas pendientes (Cliente).
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
    // ✅ FIX: Lo más nuevo arriba
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data as any[]).map((dto) => {
    return mapReservationFromDTO(dto, "client");
  });
};

/**
 * Obtiene el historial del cliente.
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

    // ✅ FIX ORDENAMIENTO DOBLE:
    .order("scheduled_range", { ascending: false }) // Lo más reciente primero
    .order("created_at", { ascending: false }) // Desempate

    .limit(HISTORY_PAGE_SIZE);

  if (cursor) {
    query = query.lt("scheduled_range", cursor);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  const mappedData = (data as any[]).map((dto) => {
    return mapReservationFromDTO(dto, "client");
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

// --- 3. QUOTE FLOW ---

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

/**
 * Obtiene las solicitudes entrantes para el profesional.
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
          // ✅ FIX: Pasamos "professional"
          return mapReservationFromDTO(dto, "professional");
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

    // ✅ FIX: Usamos arrow function para pasar "professional"
    // NO HACER: .map(mapReservationFromDTO) <-- Esto pasa el índice como 2do argumento
    return (data as any[]).map((dto) =>
      mapReservationFromDTO(dto, "professional")
    );
  } catch (err: any) {
    console.error("Exception fetching confirmed works:", err);
    throw err;
  }
};

/**
 * Obtiene el historial del profesional (Paginado + Doble Orden).
 */
// Lista de estados para el historial
const HISTORY_STATUSES_PRO: ReservationStatusDTO[] = [
  "confirmed",
  "completed",
  "canceled_client",
  "canceled_pro",
  "disputed",
];

export const fetchProHistoryReservations = async (
  professionalId: string,
  cursor?: string
) => {
  console.log(`📡 [SERVICE] Fetching History for Pro: ${professionalId}`);

  let query = supabase
    .from("reservations")
    .select(
      `
      *,
      client:user_accounts!client_id(legal_name), 
      professional:professional_profiles!professional_id(legal_name, photo_url)
    `
      // 👆 NOTA: Quitamos 'avatar_url' de 'client' para evitar el error de columna.
    )
    .in("status", HISTORY_STATUSES_PRO)
    .eq("professional_id", professionalId)
    // ⬇️ Ordenamiento correcto: Primero fecha turno, desempate por creación
    .order("scheduled_range", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(HISTORY_PAGE_SIZE);

  if (cursor) {
    query = query.lt("scheduled_range", cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ [SERVICE] Error fetching history:", error);
    throw error;
  }

  const dtos = data as ReservationDTO[];

  // ✅ MAPEO OBLIGATORIO: Convertimos DTO (crudo) a Entidad (procesada)
  // Si falta esto, la UI recibe basura y explota.
  const mappedData = dtos.map((dto) =>
    mapReservationFromDTO(dto, "professional")
  );

  const nextCursor =
    data.length === HISTORY_PAGE_SIZE
      ? data[data.length - 1].scheduled_range
      : null;

  return { reservations: mappedData, nextCursor };
};

// --- INSTANT FLOW ---

export const confirmInstantReservationService = async (
  reservationId: string,
  professionalId: string
) => {
  console.log("Service - Confirming Instant Reservation");

  try {
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

    const { error: statusError } = await supabase
      .from("professional_profiles")
      .update({ is_active: false })
      .eq("user_id", professionalId);

    if (statusError) {
      console.warn("Warning: Could not update is_active status");
    }

    // ✅ FIX: Retornamos como vista Profesional
    return mapReservationFromDTO(reservationData as any, "professional");
  } catch (err: any) {
    console.error("Exception confirming instant reservation:", err);
    throw err;
  }
};

// --- WORKFLOW CONTROL ---

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
    // ✅ FIX: Vista Profesional
    return mapReservationFromDTO(data as any, "professional");
  }

  return null;
};

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
  // ✅ FIX: Vista Profesional
  return mapReservationFromDTO(data as any, "professional");
};

/**
 * Legacy
 */
export const fetchActiveReservationService = async (professionalId: string) => {
  // Este servicio devolvía RAW data, no DTOs mapeados, así que lo dejamos igual
  // o lo deprecas si no lo usas.
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

export const updateReservationStatusService = async (
  reservationId: string,
  professionalId: string,
  newStatus: "on_route" | "in_progress" | "completed"
) => {
  const { data, error } = await supabase
    .from("reservations")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservationId)
    .select()
    .single();

  if (error) throw new Error(`Error updating status: ${error.message}`);

  if (newStatus === "completed") {
    await supabase
      .from("professional_profiles")
      .update({ is_active: true })
      .eq("user_id", professionalId);
  }

  return data;
};

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

// --- REALTIME ---

export const subscribeToIncomingRequestsService = (
  professionalId: string,
  onUpdate: () => void,
  onConnectionError: (status: string, error?: any) => void
): RealtimeChannel => {
  const channelName = `room_orders_${professionalId}`;
  console.log(`Service - Realtime Handshake for Pro: ${professionalId}`);

  // 1. PASO CRÍTICO: Limpieza Preventiva
  // Verificar si el cliente de Supabase ya tiene este canal registrado en memoria.
  // Si existe, lo removemos forzosamente antes de crear uno nuevo para evitar conflictos.
  const allChannels = supabase.getChannels();
  const staleChannel = allChannels.find(
    (ch) => ch.topic === `realtime:${channelName}`
  );

  if (staleChannel) {
    console.log("Service - Limpiando canal huérfano antes de suscribir...");
    supabase.removeChannel(staleChannel);
  }

  // 2. Creación del Canal
  const channel = supabase
    .channel(channelName)
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
      if (status === "SUBSCRIBED") {
        console.log("Service - Conexión Realtime Establecida.");
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        // Validación para evitar loguear 'undefined'
        const errorDetail =
          err || "Error de conexión desconocido o conflicto de canal";
        console.error(`Realtime Error (${status}):`, errorDetail);

        // Notificar al hook para que maneje el reintento
        onConnectionError(status, errorDetail);
      }
    });

  return channel;
};

export const unsubscribeFromChannel = async (
  channel: RealtimeChannel | null
) => {
  if (!channel) return;

  // Intentar encontrar el canal actual en el cliente para asegurar que lo tenemos referenciado
  const currentChannel = supabase
    .getChannels()
    .find((ch) => ch.topic === channel.topic);

  if (currentChannel && currentChannel.state !== "closed") {
    console.log(`Service - Closing channel ${currentChannel.topic} safely.`);
    try {
      await supabase.removeChannel(currentChannel);
    } catch (e) {
      console.warn("Service - Advertencia al remover canal:", e);
    }
  }
};
