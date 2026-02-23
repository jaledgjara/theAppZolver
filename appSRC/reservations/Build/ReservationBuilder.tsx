import { Address, formatAddress } from "@/appSRC/location/Type/LocationType";
import { ReservationPayload } from "../Type/ReservationType";
import { ServiceTag } from "@/appSRC/categories/Service/ProfessionalCatalog";

// Función helper local (o impórtala si la tienes en otro archivo)
const getTodayRangeString = (): string => {
  const start = new Date();
  start.setHours(0, 0, 0, 0); // Inicio del día local
  const end = new Date();
  end.setHours(23, 59, 59, 999); // Fin del día local
  // Formato estricto para Postgres: ["ISO","ISO")
  return `[${start.toISOString()},${end.toISOString()})`;
};

export interface BuilderInput {
  clientId: string;
  professionalId: string;
  category: string;
  isInstant: boolean;
  startTime: Date;
  pricePerHour: number;
  activeAddress?: Address | null;
  selectedTags?: ServiceTag[];
  title?: string;
  description?: string;
  proposedPrice?: number;
}

export const buildReservationPayload = (
  input: BuilderInput
): ReservationPayload => {
  // 1. LÓGICA DE TÍTULO
  let finalTitle = input.title || "Servicio General";
  if (!input.title && input.selectedTags && input.selectedTags.length > 0) {
    finalTitle = input.selectedTags.map((t) => t.label).join(", ");
  }

  // 2. LÓGICA DE DIRECCIÓN
  let finalAddress = "Ubicación a coordinar";
  let finalCoordsStr: string | undefined = undefined;

  if (input.activeAddress) {
    finalAddress = formatAddress(input.activeAddress);
    const { coords } = input.activeAddress;
    if (coords && coords.lng !== undefined && coords.lat !== undefined) {
      finalCoordsStr = `(${coords.lng},${coords.lat})`;
    }
  }

  // =================================================================
  // 3. LÓGICA DE TIEMPO (CORREGIDA)
  // =================================================================
  let rangeString: string;

  if (input.isInstant) {
    // CASO INSTANT: Usamos tu lógica de "Todo el día de hoy"
    rangeString = getTodayRangeString();
  } else {
    // CASO QUOTE / AGENDADO: Usamos la hora seleccionada + 2 horas
    const start = input.startTime || new Date(); // Protección contra null
    const end = new Date(start);
    end.setHours(end.getHours() + 2);
    rangeString = `[${start.toISOString()},${end.toISOString()})`;
  }

  // LOG DE SEGURIDAD (Míralo en la consola al crear)
  console.log("🏗️ [BUILDER] Generated Range:", rangeString);

  // 4. PRECIOS Y ESTADO
  const initialStatus = input.isInstant ? "pending_approval" : "quoting";
  const calculatedPrice = input.isInstant
    ? input.pricePerHour
    : input.proposedPrice || 0;

  // 5. PAYLOAD FINAL
  const payload: ReservationPayload = {
    client_id: input.clientId,
    professional_id: input.professionalId,
    service_category: input.category,
    service_modality: input.isInstant ? "instant" : "quote",
    currency: "ARS",
    status: initialStatus,
    service_tags: input.selectedTags || [],
    title: finalTitle,
    description: input.description || "",
    address_street: finalAddress,
    address_number: input.activeAddress?.address_number || "",
    address_coords: finalCoordsStr,

    // AQUÍ VA EL RANGO CORRECTO
    scheduled_range: rangeString,

    price_estimated: calculatedPrice,
    price_final: calculatedPrice,
    platform_fee: 0,
  };

  return payload;
};
