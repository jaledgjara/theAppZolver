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
  // 1. TITLE LOGIC
  let finalTitle = input.title || "Servicio General";
  if (!input.title && input.selectedTags && input.selectedTags.length > 0) {
    finalTitle = input.selectedTags.map((t) => t.label).join(", ");
  }

  // 2. ADDRESS & COORDS LOGIC
  let finalAddress = "Ubicación a coordinar";
  let finalCoordsStr = undefined;

  if (input.activeAddress) {
    const { address_street, address_number, floor, apartment, coords } =
      input.activeAddress;

    // Readable String
    finalAddress = `${address_street} ${address_number}`;
    if (floor || apartment) {
      finalAddress += ` (Piso ${floor || "-"} ${apartment || ""})`;
    }

    // Coordinates Formatting for Postgres Point
    // ⚠️ CRITICAL: Postgres Point is (x, y) -> (Longitude, Latitude)
    if (coords && coords.lng !== undefined && coords.lat !== undefined) {
      finalCoordsStr = `(${coords.lng},${coords.lat})`;
    }
  }

  // 3. PRICING LOGIC
  const finalPrice = input.isInstant
    ? input.pricePerHour
    : input.proposedPrice || 0;

  // 4. TIME LOGIC (Default 2 hours)
  const endTime = new Date(input.startTime);
  endTime.setHours(endTime.getHours() + 2);

  // 5. RETURN PAYLOAD (snake_case)
  return {
    client_id: input.clientId,
    professional_id: input.professionalId,

    service_category: input.category,
    service_modality: input.isInstant ? "instant" : "quote",

    service_tags: input.selectedTags || [],

    title: finalTitle,
    description: input.description || "",

    address_street: finalAddress,
    address_number: input.activeAddress?.address_number || "",
    address_coords: finalCoordsStr, // ✅ Ready for RPC

    scheduled_range: `[${input.startTime.toISOString()},${endTime.toISOString()})`,

    currency: "ARS",
    price_estimated: finalPrice,
    price_final: finalPrice,
    platform_fee: finalPrice * 0.15, // Example 15% fee

    status: "draft", // Initial status
  };
};
