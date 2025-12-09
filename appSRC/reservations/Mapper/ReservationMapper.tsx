// appSRC/reservations/Type/ReservationMapper.ts
import { Reservation, ReservationDTO } from "../Type/ReservationType";

/**
 * Parsea el string de rango de Postgres (tstzrange) a objetos Date.
 * Formato esperado: '["2023-01-01T10:00:00Z","2023-01-01T11:00:00Z")'
 */
const parsePostgresRange = (rangeStr: string): { start: Date; end: Date } => {
  // Limpieza básica de caracteres [ ) "
  const cleaned = rangeStr.replace(/[\[\]\(\)"]/g, "");
  const [startStr, endStr] = cleaned.split(",");

  return {
    start: new Date(startStr),
    end: new Date(endStr),
  };
};

export const mapReservationFromDTO = (dto: ReservationDTO): Reservation => {
  const { start, end } = parsePostgresRange(dto.scheduled_range);

  return {
    id: dto.id,
    clientId: dto.client_id,
    professionalId: dto.professional_id,

    serviceCategory: dto.service_category,
    serviceModality: dto.service_modality,

    title: dto.title || "",
    description: dto.description || "",
    photos: dto.photos || [],

    location: {
      street: dto.address_street,
      number: dto.address_number,
      // Asumimos mapeo simple si existe coords
      coordinates: dto.address_coords
        ? {
            latitude: dto.address_coords.x,
            longitude: dto.address_coords.y,
          }
        : undefined,
    },

    schedule: {
      startDate: start,
      endDate: end,
    },

    financials: {
      currency: dto.currency,
      priceEstimated: dto.price_estimated,
      priceFinal: dto.price_final,
      platformFee: dto.platform_fee,
      proPayout: dto.pro_payout,
    },

    status: dto.status,
    createdAt: new Date(dto.created_at),
  };
};
