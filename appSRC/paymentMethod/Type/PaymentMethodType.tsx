import { Ionicons } from "@expo/vector-icons";

// =============================================================================
// 1. DOMINIO / ENUMS (Constantes del Negocio)
// =============================================================================
export type PaymentMethodType =
  | "credit_card"
  | "debit_card"
  | "platform_credit";

export type CardBrand = "visa" | "mastercard" | "amex" | "unknown";

// =============================================================================
// 2. DTO (Data Transfer Object) - Reflejo EXACTO de la Base de Datos (Supabase)
// =============================================================================
export interface PaymentMethodDTO {
  id: string; // uuid
  user_id: string; // uuid/text
  provider_card_id: string; // text (MP ID)
  provider_customer_id: string; // text (MP Customer)
  brand: string; // text ('visa', 'mastercard'...)
  last_four_digits: string; // text
  identification_number?: string;
  expiry_month: number | null;
  expiry_year: number | null;
  is_default: boolean;
  created_at: string; // timestamptz
}

// =============================================================================
// 3. PAYLOAD (Escritura) - Lo que enviamos a la Edge Function
// =============================================================================
export interface SavePaymentMethodPayload {
  user_id: string;
  email: string;
  token: string; // Token temporal de MercadoPago
  dni: string;
}

// =============================================================================
// 4. UI MODEL (Vista) - Lo que el Componente React Native necesita para dibujar
// =============================================================================
export interface UISavedCard {
  id: string;

  // Datos Visuales Listos
  brand: CardBrand;
  last4: string;
  type: PaymentMethodType;

  // Helpers visuales (Opcionales, pero útiles para no calcular en la vista)
  titleFormatted: string; // Ej: "Visa terminada en 4242"
  iconName: keyof typeof Ionicons.glyphMap;
}
