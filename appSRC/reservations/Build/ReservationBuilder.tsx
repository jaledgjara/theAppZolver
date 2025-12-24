import { Address } from "@/appSRC/location/Type/LocationType";
import { ReservationPayload } from "../Type/ReservationType";
import { ServiceTag } from "@/appSRC/categories/Service/ProfessionalCatalog";
// ✅ Correct Import based on your snippet

export interface BuilderInput {
  // Common Data
  clientId: string;
  professionalId: string;
  category: string;
  isInstant: boolean;
  startTime: Date;
  pricePerHour: number;

  // Location Data (From Store)
  activeAddress?: Address | null;

  // Variable Data
  selectedTags?: ServiceTag[];
  title?: string;
  description?: string;
  proposedPrice?: number;
}

export const buildReservationPayload = (
  input: BuilderInput
): ReservationPayload => {
  // =================================================================
  // 1. LOGICA DE TÍTULO (Restaurada)
  // =================================================================
  let finalTitle = input.title || "Servicio General";
  if (!input.title && input.selectedTags && input.selectedTags.length > 0) {
    // Si no hay título manual, usamos los tags (ej: "Plomería, Destape")
    finalTitle = input.selectedTags.map((t) => t.label).join(", ");
  }
  console.log("🏗️ [BUILDER] Input PricePerHour:", input.pricePerHour);
  console.log("🏗️ [BUILDER] Is Instant?:", input.isInstant);
  // =================================================================
  // 2. LOGICA DE DIRECCIÓN Y COORDENADAS (Restaurada)
  // =================================================================
  let finalAddress = "Ubicación a coordinar";
  let finalCoordsStr: string | undefined = undefined;

  if (input.activeAddress) {
    const { address_street, address_number, floor, apartment, coords } =
      input.activeAddress;

    // String legible para la UI
    finalAddress = `${address_street} ${address_number}`;
    if (floor || apartment) {
      finalAddress += ` (Piso ${floor || "-"} ${apartment || ""})`;
    }

    // Formato Point para Postgres (Longitude, Latitude)
    // Importante: Postgres usa (x, y) = (lng, lat)
    if (coords && coords.lng !== undefined && coords.lat !== undefined) {
      finalCoordsStr = `(${coords.lng},${coords.lat})`;
    }
    console.log("🏗️ [BUILDER] Input PricePerHour:", input.pricePerHour);
    console.log("🏗️ [BUILDER] Is Instant?:", input.isInstant);
  }

  // =================================================================
  // 3. LOGICA DE TIEMPO (Restaurada)
  // =================================================================
  // MVP: Bloques de 2 horas por defecto
  const endTime = new Date(input.startTime);
  endTime.setHours(endTime.getHours() + 2);

  // =================================================================
  // 4. LOGICA DE ESTADO (CRÍTICO: Fix de Visibilidad)
  // =================================================================
  // Instant -> pending_approval (visible en inbox)
  // Quote -> quoting (visible en inbox o chat)
  const initialStatus = input.isInstant ? "pending_approval" : "quoting";

  // =================================================================
  // 5. LOGICA DE PRECIOS
  // =================================================================
  const calculatedPrice = input.isInstant
    ? input.pricePerHour // Instant: 2 horas fijas
    : input.proposedPrice || 0; // Quote: Propuesta del cliente o 0

  // =================================================================
  // 6. CONSTRUCCIÓN DEL PAYLOAD (RETURN)
  // =================================================================
  const payload: ReservationPayload = {
    client_id: input.clientId,
    professional_id: input.professionalId,

    service_category: input.category,
    service_modality: input.isInstant ? "instant" : "quote",

    // Fix Error 1: Falta currency
    currency: "ARS",

    // Fix Error de Status
    status: initialStatus,

    service_tags: input.selectedTags || [],

    // Fix Error 2: Variables restauradas
    title: finalTitle,
    description: input.description || "",

    // Fix Error 3: Variables restauradas
    address_street: finalAddress,
    address_number: input.activeAddress?.address_number || "",

    // Fix Error 4: Variables restauradas
    address_coords: finalCoordsStr,

    // Fix Error 5: endTime restaurado
    scheduled_range: `[${input.startTime.toISOString()},${endTime.toISOString()})`,

    // Financials
    price_estimated: calculatedPrice,
    price_final: calculatedPrice,
    platform_fee: 0,
  };
  console.log("🏗️ [BUILDER] Input PricePerHour:", input.pricePerHour);
  console.log("🏗️ [BUILDER] Is Instant?:", input.isInstant);
  // [ZOLVER-DEBUG] Logs para trazabilidad
  console.log("\n--- [ZOLVER-DEBUG] 01: BUILDER PAYLOAD ---");
  console.log("Modality:", payload.service_modality);
  console.log("Status Asignado:", payload.status);
  console.log("Coords:", payload.address_coords);
  console.log("------------------------------------------\n");

  return payload;
};
