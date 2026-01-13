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
  console.log(
    `🗺️ [Mapper] Procesando tarjeta ID: ${dto.id} | Brand Original: ${dto.brand}`
  );

  // 1. Normalización robusta para detectar "visa_debit", etc.
  const brandLower = dto.brand.toLowerCase();

  let validBrand: CardBrand = "unknown";

  if (brandLower.includes("visa")) {
    validBrand = "visa";
  } else if (brandLower.includes("master")) {
    validBrand = "mastercard";
  } else if (brandLower.includes("amex")) {
    validBrand = "amex";
  }

  // 2. Determinar tipo (Crédito vs Débito basado en el string)
  const isDebit = brandLower.includes("debit") || brandLower.includes("debito");
  const type = isDebit ? "debit_card" : "credit_card";

  console.log(`   ↳ Mapeado a: ${validBrand} (${type})`);

  return {
    id: dto.id,
    brand: validBrand,
    last4: dto.last_four_digits,
    type: "credit_card", // Puedes cambiar esto a la variable 'type' si tu UI lo soporta
    titleFormatted: `${
      validBrand.charAt(0).toUpperCase() + validBrand.slice(1)
    } •••• ${dto.last_four_digits}`,
    iconName: "card",
  };
};
