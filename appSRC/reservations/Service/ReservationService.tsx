import { supabase } from "@/appSRC/services/supabaseClient";
import {
  Reservation,
  ReservationDTO,
  ReservationPayload,
} from "../Type/ReservationType";
import { mapReservationFromDTO } from "../Mapper/ReservationMapper";
import { getTodayRangeString } from "../Helper/GetTodayRangeString";

// ⚡️ ZOLVER YA (Instant) - Usa RPC para bypass RLS de Firebase
export const createInstantReservation = async (
  payload: ReservationPayload
): Promise<Reservation> => {
  const duration = payload.durationHours || 1;
  const endTime = new Date(payload.startTime);
  endTime.setHours(endTime.getHours() + duration);

  // Formato Postgres [start, end)
  const rangeString = `[${payload.startTime.toISOString()},${endTime.toISOString()})`;

  // LLAMADA RPC (Soluciona el error 42501)
  const { data, error } = await supabase.rpc("create_reservation_bypass", {
    p_client_id: payload.clientId,
    p_professional_id: payload.professionalId,
    p_category: payload.category,
    p_modality: "instant",
    p_title: payload.title,
    p_description: payload.description,
    p_address: payload.address,
    p_range: rangeString,
    p_status: "pending_approval",
    p_price_estimated: "1000",
    p_price_final: "1200",
    p_platform_fee: "200",
  });

  if (error) {
    console.error("RPC Error:", error);
    throw new Error(error.message);
  }

  return mapReservationFromDTO(data as ReservationDTO);
};

// 📄 PRESUPUESTO (Quote) - Usa RPC para bypass RLS de Firebase
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
    p_address: payload.address,
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
// 1. FETCHING: AGENDA DE HOY
// ============================================================================
export const fetchProTodayReservations = async (
  professionalId: string
): Promise<Reservation[]> => {
  console.log(
    "🔍 [1. START] fetchProTodayReservations para ID:",
    professionalId
  );

  const todayRange = getTodayRangeString();

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("professional_id", professionalId)
    .in("status", ["confirmed", "on_route", "in_progress"])
    .overlaps("scheduled_range", todayRange)
    .order("scheduled_range", { ascending: true });

  if (error) {
    console.error("❌ [1. ERROR] Supabase fetchProTodayReservations:", error);
    throw new Error("No se pudo cargar la agenda de hoy.");
  }

  console.log(
    "✅ [1. SUCCESS] Resultados crudos (Today):",
    data?.length,
    "records found."
  );
  if (data && data.length > 0) {
    console.log("   -> Primer registro encontrado:", data[0]);
  }

  return (data as ReservationDTO[]).map(mapReservationFromDTO);
};

// ============================================================================
// 2. FETCHING: CONFIRMACIONES PENDIENTES
// ============================================================================
export const fetchProPendingConfirmations = async (
  professionalId: string
): Promise<Reservation[]> => {
  console.log(
    "🔍 [2. START] fetchProPendingConfirmations para ID:",
    professionalId
  );

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("status", "pending_approval")
    .order("scheduled_range", { ascending: true })
    .limit(10);

  if (error) {
    console.error(
      "❌ [2. ERROR] Supabase fetchProPendingConfirmations:",
      error
    );
    throw new Error("Error al cargar confirmaciones pendientes.");
  }

  console.log(
    "✅ [2. SUCCESS] Resultados crudos (Pending):",
    data?.length,
    "records found."
  );

  return (data as ReservationDTO[]).map(mapReservationFromDTO);
};

// ============================================================================
// 3. FETCHING: ALERTAS
// ============================================================================
export const fetchProAlerts = async (
  professionalId: string
): Promise<Reservation[]> => {
  // Debug para verificar fecha de umbral
  const timeThreshold = new Date();
  timeThreshold.setHours(timeThreshold.getHours() - 48);
  console.log(
    "🔍 [3. START] fetchProAlerts. Umbral de tiempo:",
    timeThreshold.toISOString()
  );

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("professional_id", professionalId)
    .in("status", ["canceled_client", "disputed"])
    .gt("updated_at", timeThreshold.toISOString())
    .order("updated_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("❌ [3. ERROR] Supabase fetchProAlerts:", error);
    throw new Error("Error al cargar alertas.");
  }

  console.log(
    "✅ [3. SUCCESS] Resultados crudos (Alerts):",
    data?.length,
    "records found."
  );

  return (data as ReservationDTO[]).map(mapReservationFromDTO);
};
