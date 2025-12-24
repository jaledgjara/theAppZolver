import {
  Reservation,
  ReservationDTO,
} from "@/appSRC/reservations/Type/ReservationType";

/**
 * Parsea el string de rango de Postgres "[start,end)" a objetos Date de JS
 */
const parseRange = (rangeStr: string): { start: Date; end: Date } => {
  if (!rangeStr) {
    return { start: new Date(), end: new Date() };
  }

  // 1. Clean the string: remove [, ), ", and \ characters
  const cleanStr = rangeStr.replace(/[\[\]()"\\]/g, "");

  // 2. Split by comma
  const parts = cleanStr.split(",");

  // 3. Parse dates. If split fails, return current date to avoid "Invalid Date"
  const start = parts[0] ? new Date(parts[0]) : new Date();
  const end = parts[1] ? new Date(parts[1]) : new Date();

  return { start, end };
};

export const mapReservationFromDTO = (dto: ReservationDTO): Reservation => {
  // 1. Fix Time Range
  const { start, end } = parseRange(dto.scheduled_range);

  // 2. Location Parsing
  const coords = dto.address_coords
    ? { latitude: dto.address_coords.y, longitude: dto.address_coords.x }
    : undefined;
  // 3. 🛠 FIX 1: Mapping correct names from DB relations
  // We explicitly map 'legal_name' from the DB to 'name' for the Domain Entity
  const clientObj = dto.client
    ? {
        id: dto.client_id,
        name: dto.client.legal_name || "Cliente Sin Nombre", // Map legal_name -> name
        avatar: dto.client.avatar_url,
      }
    : undefined;

  const professionalObj = dto.professional
    ? {
        id: dto.professional_id,
        name: dto.professional.legal_name || "Profesional Zolver", // Map legal_name -> name
        avatar: dto.professional.avatar_url,
      }
    : undefined;

  // 4. Safe Client Parsing (Aquí es donde ocurría tu error anterior)
  // Ahora mapeamos 'legal_name' (DB) a 'legalName' (UI)
  const clientData = dto.client
    ? {
        legal_name: dto.client.legal_name || "Cliente", // Fallback seguro
      }
    : undefined;

  return {
    id: dto.id,
    title: dto.title || "Servicio",
    clientId: dto.client_id,
    professionalId: dto.professional_id,

    serviceCategory: dto.service_category,
    serviceModality: dto.service_modality,

    description: dto.description || "",

    // 📍 UBICACIÓN
    location: {
      street: dto.address_display || "Ubicación registrada",
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

    status: dto.status as any, // Cast a ReservationStatusDTO

    // Pass the objects explicitly
    client: clientObj,
    professional: professionalObj,
  };
};
