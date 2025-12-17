import {
  Reservation,
  ReservationDTO,
  ReservationStatusDTO,
} from "../Type/ReservationType"; //

/**
 * 🛠 HELPER: Parse Postgres Range
 * Converts "[2023-01-01, 2023-01-02)" to Javascript Date objects.
 * "Blindado" logic provided in context.
 */
const parseRange = (rangeStr: string): { start: Date; end: Date } => {
  if (!rangeStr) return { start: new Date(), end: new Date() };

  const cleanStr = rangeStr.replace(/[\[\]()"]/g, "");
  const parts = cleanStr.split(",");

  const parseDateSafe = (dateStr: string) => {
    if (!dateStr) return new Date();
    let safeStr = dateStr.trim();
    safeStr = safeStr.replace(" ", "T");
    // Fix microseconds (Postgres .123456 -> JS .123)
    safeStr = safeStr.replace(/(\.\d{3})\d+/, "$1");
    // Fix Timezone (+00 -> Z)
    if (safeStr.endsWith("+00")) {
      safeStr = safeStr.replace("+00", "Z");
    }
    const date = new Date(safeStr);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  return {
    start: parseDateSafe(parts[0]),
    end: parseDateSafe(parts[1]),
  };
};

/**
 * 🗺 MAPPER PRINCIPAL
 * Transforms Database DTO -> Domain Entity (Safe for UI)
 */
export const mapReservationFromDTO = (dto: ReservationDTO): Reservation => {
  // 1. Time Range Parsing
  const { start, end } = parseRange(dto.scheduled_range);

  // 2. Location Parsing (Postgres Point -> Lat/Lng)
  // Postgres sends { x: lng, y: lat }, UI needs { latitude, longitude }
  const coords = dto.address_coords
    ? { latitude: dto.address_coords.y, longitude: dto.address_coords.x }
    : undefined;

  // 3. Safe Professional Parsing (Prevents crash if join is missing)
  const proName = dto.professional?.legal_name || "Profesional Zolver";
  const proAvatar = dto.professional?.photo_url || null;

  return {
    id: dto.id,
    clientId: dto.client_id,
    professionalId: dto.professional_id,

    serviceCategory: dto.service_category,
    serviceModality: dto.service_modality, // 'instant' | 'quote'

    title: dto.title || "Servicio",
    description: dto.description || "",
    photos: [], // If you have photos in DTO, map them here

    // 📍 UBICACIÓN AUTOMÁTICA
    location: {
      street: dto.address_display || "Ubicación registrada",
      number: "", // Usually included in address_display string
      coordinates: coords, // ✅ Critical for Maps
    },

    schedule: {
      startDate: start,
      endDate: end,
    },

    financials: {
      currency: "ARS",
      priceEstimated: dto.price_estimated || 0,
      priceFinal: dto.price_final || 0,
      platformFee: dto.platform_fee || 0,
    },

    status: dto.status as ReservationStatusDTO,
    createdAt: new Date(dto.created_at),

    professional: {
      name: proName,
      avatar: proAvatar,
    },
  };
};
