// ============================================================================
// ARCHIVO: appSRC/types/PaymentType.tsx
// PROPÓSITO: Definición de tipos para LEER el historial de pagos.
// NOTA: No hay 'Payload' de escritura porque la Edge Function maneja la creación.
// ============================================================================
// 1. ENUMS (Basados en tus Constraints SQL)
export type PaymentStatusDTO = "pending" | "approved" | "rejected" | "refunded";

// Tipos visuales para la UI
export type PaymentStatusUI = "pending" | "paid" | "failed";

// 2. DTO (Data Transfer Object - Lo que viene DIRECTO de Supabase al hacer un select)
export interface PaymentDTO {
  id: string; // uuid
  reservation_id: string; // uuid fk -> reservations
  payer_id: string; // uuid fk -> user_accounts
  amount: number; // numeric(12,2)
  currency: string; // text default 'ARS'
  status: PaymentStatusDTO; // text
  payment_method: string; // text default 'credit_card'
  provider_payment_id: string | null; // text (ID de MercadoPago)
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

// 3. ENTIDAD (Para uso interno en la UI, mapeo limpio)
export interface Payment {
  id: string;
  reservationId: string;
  payerId: string;

  financials: {
    amount: number;
    currency: string;
    method: string;
  };

  status: PaymentStatusDTO;
  statusUI: PaymentStatusUI; // 'paid' | 'pending' | 'failed'

  meta: {
    providerId?: string; // ID externo (MP)
  };

  timestamps: {
    createdAt: Date;
    updatedAt: Date;
  };
}
