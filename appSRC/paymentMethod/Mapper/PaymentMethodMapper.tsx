// =============================================================================
// 5. MAPPER HELPER (Patrón Adapter)
// Convierte DTO -> UI Model (Esto se usa en el Servicio)

import {
  CardBrand,
  PaymentMethodDTO,
  UISavedCard,
} from "../Type/PaymentMethodType";

// =============================================================================
export const mapDtoToUi = (dto: PaymentMethodDTO): UISavedCard => {
  // Normalizar marca
  const brandLower = dto.brand.toLowerCase();
  const validBrand: CardBrand =
    brandLower === "visa" ||
    brandLower === "mastercard" ||
    brandLower === "amex"
      ? brandLower
      : "unknown";

  return {
    id: dto.id,
    brand: validBrand,
    last4: dto.last_four_digits,
    type: "credit_card", // Por MVP asumimos crédito, o podrías inferirlo del brand
    titleFormatted: `${
      validBrand.charAt(0).toUpperCase() + validBrand.slice(1)
    } •••• ${dto.last_four_digits}`,
    iconName: "card", // Icono por defecto
  };
};
