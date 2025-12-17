import { ServiceTag } from "@/appSRC/categories/Service/ProfessionalCatalog";
import { ReservationPayload } from "../Type/ReservationType";

interface BuilderInput {
  clientId: string;
  professionalId: string;
  category: string;

  selectedTags: ServiceTag[]; // ✅ Recibimos el array de objetos
  description: string;

  // Recibimos el objeto Address completo del Store
  activeAddress: {
    address_street: string;
    address_number: string;
    coords: { lat: number; lng: number };
  };

  startTime: Date;
  isInstant: boolean;
  pricePerHour: number;
}

export const buildReservationPayload = (
  input: BuilderInput
): ReservationPayload => {
  // 1. Generar título inteligente
  const title =
    input.selectedTags.length > 0
      ? input.selectedTags.map((t) => t.label).join(" + ")
      : "Servicio General";

  // 2. Formatear Dirección de Visualización
  const addressText = `${input.activeAddress.address_street} ${input.activeAddress.address_number}`;

  // 3. Calcular estimación inicial (Lógica básica)
  const duration = 1; // Default 1 hora MVP
  const estimatedTotal = input.pricePerHour * duration;

  return {
    clientId: input.clientId,
    professionalId: input.professionalId,
    category: input.category,

    tags: input.selectedTags,
    title: title,
    description: input.description || "",

    location: {
      addressText: addressText,
      coords: input.activeAddress.coords, // Pasamos las coordenadas reales
    },

    startTime: input.startTime,
    durationHours: duration,

    priceEstimated: estimatedTotal,
    pricePerHour: input.pricePerHour,
  };
};
