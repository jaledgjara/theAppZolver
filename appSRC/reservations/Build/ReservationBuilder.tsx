// appSRC/reservations/Utils/ReservationBuilder.ts
import { ReservationPayload } from "../Type/ReservationType";

/**
 * Datos simples que vienen del Formulario UI
 */
interface BuilderInput {
  clientId: string;
  professionalId: string;
  category: string;
  title: string;
  description: string;
  address: string;
  startTime: Date;
  isInstant: boolean;
  pricePerHour: number;
}

export const buildReservationPayload = (
  input: BuilderInput
): ReservationPayload => {
  const duration = 2; // Default MVP (2 horas)

  // 1. Lógica de Negocio: Cálculo de Precios
  const priceEstimated = input.isInstant ? input.pricePerHour * duration : 0;
  // Fee del 10% si es instantáneo
  const platformFee = input.isInstant ? priceEstimated * 0.1 : 0;

  // 2. Construcción del Payload Limpio
  return {
    // Identificadores
    clientId: input.clientId,
    professionalId: input.professionalId,
    category: input.category,

    // Contenido User Generated
    title: input.title,
    description: input.description,
    address: input.address,
    photos: [], // MVP: Vacío

    // Objetos Estructurales (Mapeados aquí para no ensuciar la vista)
    location: {
      street: input.address,
      coordinates: { latitude: 0, longitude: 0 }, // Placeholder MVP
    },

    schedule: {
      startDate: input.startTime,
      endDate: new Date(input.startTime.getTime() + duration * 60 * 60 * 1000),
    },

    financials: {
      currency: "ARS",
      priceEstimated: priceEstimated,
      platformFee: platformFee,
      priceFinal: input.isInstant ? priceEstimated : undefined, // Solo instant tiene precio final ya
    },

    // Compatibilidad Legacy (Si tu servicio aún usa estos campos planos)
    startTime: input.startTime,
    durationHours: duration,
  };
};
