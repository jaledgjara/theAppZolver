import { supabase } from "@/appSRC/services/supabaseClient";
import {
  Reservation,
  ReservationDTO,
  ReservationPayload,
} from "../Type/ReservationType";
import { mapReservationFromDTO } from "../Mapper/ReservationMapper";

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
