import {
  Reservation,
  ReservationDTO,
} from "@/appSRC/reservations/Type/ReservationType";

/**
 * [DEBUG] Helper para limpiar fechas de Postgres
 */
const fixPostgresDateStr = (dateStr: string): Date | null => {
  if (!dateStr) return null;

  try {
    // Logueamos la entrada para ver qué formato extraño trae
    // console.log(`[DEBUG-MAPPER] Fixing Date Str: '${dateStr}'`);

    let clean = dateStr.replace(/['"]/g, "").trim();
    clean = clean.replace(" ", "T");
    if (clean.endsWith("+00")) {
      clean = clean.replace("+00", "Z");
    }

    const date = new Date(clean);
    const isValid = !isNaN(date.getTime());

    if (!isValid) {
      console.error(`[DEBUG-MAPPER] ❌ Fecha Inválida tras fix: ${clean}`);
      return null;
    }

    return date;
  } catch (e) {
    console.error(`[DEBUG-MAPPER] 💥 Error en fixPostgresDateStr:`, e);
    return null;
  }
};

const parseRange = (
  rangeStr: string
): { start: Date | null; end: Date | null } => {
  // 1. Logs de entrada
  // console.log(`[DEBUG-MAPPER] Parsing Range Raw: ${rangeStr}`);

  if (!rangeStr || rangeStr === "empty") {
    console.warn("[DEBUG-MAPPER] ⚠️ Rango 'empty' o null detectado.");
    return { start: null, end: null };
  }

  try {
    const cleanStr = rangeStr.replace(/[\[\]\(\)\"\\]/g, "");
    const parts = cleanStr.split(","); // [start, end]

    const start = parts[0] ? fixPostgresDateStr(parts[0]) : null;
    const end = parts[1] ? fixPostgresDateStr(parts[1]) : null;

    return { start, end };
  } catch (e) {
    console.error("[DEBUG-MAPPER] ❌ Error parseando rango:", rangeStr);
    return { start: null, end: null };
  }
};

export const mapReservationFromDTO = (dto: ReservationDTO): Reservation => {
  // --- TRAZA DE MAPEO ---
  // console.log(`[DEBUG-MAPPER] Mapeando ID: ${dto.id}`);

  const { start, end } = parseRange(dto.scheduled_range);

  // Mapeos auxiliares
  const coords = dto.address_coords
    ? { latitude: dto.address_coords.y, longitude: dto.address_coords.x }
    : undefined;

  const clientObj = dto.client
    ? {
        id: dto.client_id,
        name: dto.client.legal_name || "Cliente",
        avatar: undefined, // Sin avatar_url por ahora
      }
    : undefined;

  const professionalObj = dto.professional
    ? {
        id: dto.professional_id,
        name: dto.professional.legal_name || "Profesional",
        avatar: dto.professional.avatar_url,
      }
    : undefined;

  return {
    id: dto.id,
    title: dto.title || "Servicio",
    clientId: dto.client_id,
    professionalId: dto.professional_id,
    status: dto.status as any,
    serviceCategory: dto.service_category,
    serviceModality: dto.service_modality,
    description: dto.description || "",
    location: {
      street: dto.address_display || "Ubicación",
      number: "",
      coordinates: coords,
    },
    schedule: {
      startDate: start,
      endDate: end,
    },
    financials: {
      currency: "ARS",
      priceEstimated: Number(dto.price_estimated) || 0,
      priceFinal: Number(dto.price_final) || 0,
      platformFee: Number(dto.platform_fee) || 0,
    },
    client: clientObj,
    professional: professionalObj,
    createdAt: dto.created_at ? new Date(dto.created_at) : new Date(),
  };
};
