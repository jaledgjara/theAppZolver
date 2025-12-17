// appSRC/reservations/Helper/ReservationMapper.ts

import {
  Reservation,
  ReservationDTO,
  ReservationStatusDTO,
} from "../Type/ReservationType";

/**
 * Parsea el string de rango de postgres "[start, end)" a objetos Date
 * BLINDADO para React Native (Android/iOS)
 */
const parseRange = (rangeStr: string): { start: Date; end: Date } => {
  if (!rangeStr) return { start: new Date(), end: new Date() };

  // 1. Limpieza de caracteres de rango [], (), ""
  const cleanStr = rangeStr.replace(/[\[\]()"]/g, "");

  // 2. Separar inicio y fin
  const parts = cleanStr.split(",");

  const parseDateSafe = (dateStr: string) => {
    if (!dateStr) return new Date();

    // A. Trim: Quitamos espacios
    let safeStr = dateStr.trim();

    // B. Fix ISO: Espacio -> T
    safeStr = safeStr.replace(" ", "T");

    // C. Fix Microsegundos: Postgres envía 6 dígitos (.145578), JS soporta 3 (.145)
    // Si encontramos más de 3 dígitos de ms, los cortamos.
    // Ejemplo: .145578+00 -> .145+00
    safeStr = safeStr.replace(/(\.\d{3})\d+/, "$1");

    // D. Fix Timezone: Postgres "+00" -> ISO "Z"
    // React Native suele fallar con "+00" simple.
    if (safeStr.endsWith("+00")) {
      safeStr = safeStr.replace("+00", "Z");
    }

    const date = new Date(safeStr);

    // Validación final: Si sigue fallando, devolvemos fecha actual para no romper la UI
    return isNaN(date.getTime()) ? new Date() : date;
  };

  return {
    start: parseDateSafe(parts[0]),
    end: parseDateSafe(parts[1]),
  };
};

export const mapReservationFromDTO = (dto: ReservationDTO): Reservation => {
  const { start, end } = parseRange(dto.scheduled_range);

  const coords = dto.address_coords
    ? { latitude: dto.address_coords.y, longitude: dto.address_coords.x }
    : undefined;

  const proName = dto.professional?.legal_name || "Profesional Zolver";
  // Como no hay columna de foto en la DB, dejamos null
  const proAvatar = null;

  return {
    id: dto.id,
    clientId: dto.client_id,
    professionalId: dto.professional_id,

    serviceCategory: dto.service_category,
    serviceModality: dto.service_modality,

    title: dto.title || "Servicio Sin Título",
    description: dto.description || "",

    photos: [],

    location: {
      street: dto.address_display,
      number: "",
      coordinates: coords,
    },

    schedule: {
      startDate: start,
      endDate: end,
    },

    financials: {
      currency: "ARS",
      priceEstimated: dto.price_estimated,
      priceFinal: dto.price_final,
      platformFee: dto.platform_fee,
    },

    status: dto.status as ReservationStatusDTO,
    createdAt: new Date(dto.created_at),

    professional: {
      name: proName,
      avatar: proAvatar,
    },
  };
};
