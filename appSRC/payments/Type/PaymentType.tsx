// ============================================================================
// ARCHIVO: appSRC/payments/Type/PaymentType.tsx
// PROPÓSITO: Contratos de datos estrictos para todo el flujo de pagos.
// Cubre: Lectura (historial), Escritura (crear pago), Cancelación (reembolso).
// ============================================================================

// =============================================================================
// 1. ENUMS & STATUS (Basados en Constraints SQL + Mercado Pago API)
// =============================================================================

/** Status real que devuelve Mercado Pago y se persiste en la tabla 'payments'. */
export type PaymentStatusDTO =
  | "pending"
  | "approved"
  | "in_process"
  | "rejected"
  | "refunded";

/** Status visual simplificado para la UI del cliente. */
export type PaymentStatusUI = "pending" | "paid" | "failed" | "refunded";

// =============================================================================
// 2. DTO (Data Transfer Object - Reflejo EXACTO de la tabla 'payments')
// =============================================================================

/** Method types matching the DB enum 'payment_method_type'. */
export type PaymentMethodTypeDTO = "credit_card" | "debit_card" | "platform_credit";

export interface PaymentDTO {
  id: string; // uuid PK
  reservation_id: string; // uuid fk -> reservations (ON DELETE CASCADE)
  client_id: string; // text fk -> user_accounts.auth_uid
  professional_id: string; // text fk -> professional_profiles.user_id
  amount: number; // numeric(12,2) CHECK >= 1 AND <= 100_000_000
  currency: string | null; // text default 'ARS'
  status: PaymentStatusDTO | null; // payment_status default 'pending'
  method: PaymentMethodTypeDTO; // payment_method_type NOT NULL
  payment_method_id: string | null; // uuid fk -> user_payment_methods.id
  provider_payment_id: string | null; // text (ID de MercadoPago)
  created_at: string | null; // timestamptz default now()
  updated_at: string | null; // timestamptz default now()
}

// =============================================================================
// 3. ENTIDAD UI (Modelo limpio para la Vista, resultado del Mapper)
// =============================================================================

export interface Payment {
  id: string;
  reservationId: string;
  clientId: string;
  professionalId: string;

  financials: {
    amount: number;
    currency: string;
    method: PaymentMethodTypeDTO;
    paymentMethodId?: string; // FK to user_payment_methods
  };

  status: PaymentStatusDTO;
  statusUI: PaymentStatusUI;

  meta: {
    providerId?: string; // ID externo (MP)
  };

  timestamps: {
    createdAt: Date;
    updatedAt: Date;
  };
}

// =============================================================================
// 4. PAYLOADS DE ESCRITURA (Lo que el frontend envía a las Edge Functions)
// =============================================================================

/** Payload para crear un pago via Edge Function 'process-booking-payment'. */
export interface CreatePaymentPayload {
  // --- Required ---
  card_token: string; // New card: full token | Saved card: CVV-only token
  amount: number;
  payer_email: string;
  payment_method_id: string; // MP brand: 'visa', 'mastercard', etc.
  user_id: string;
  professional_id: string;
  service_category: string;
  service_modality: string;
  start_date: string; // ISO 8601
  end_date: string; // ISO 8601
  address_display: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  // --- Optional: Saved Card (Customer Card) fields ---
  customer_id?: string; // MP Customer ID (provider_customer_id in DB)
  saved_card_id?: string; // Zolver DB uuid (user_payment_methods.id) for FK
  method?: PaymentMethodTypeDTO; // defaults to 'credit_card' in Edge Function
}

/** Payload para cancelar/reembolsar via Edge Function 'cancel-reservation-refund'. */
export interface CancelPaymentPayload {
  reservation_id: string;
  reason: string;
  triggered_by: "professional" | "client";
}

// =============================================================================
// 5. RESPUESTAS DE EDGE FUNCTIONS (Contratos de respuesta tipados)
// =============================================================================

/** Wrapper genérico para respuestas de todas las Edge Functions de Zolver. */
export interface EdgeFunctionResponse<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Datos específicos que retorna 'process-booking-payment' en caso de éxito. */
export interface CreatePaymentResponseData {
  reservation_id: string;
  payment_id: number; // ID numérico de Mercado Pago
  status: string;
}

/** Respuesta tipada completa de la Edge Function de creación de pago. */
export type CreatePaymentResponse =
  EdgeFunctionResponse<CreatePaymentResponseData>;

/** Respuesta tipada de la Edge Function de cancelación/reembolso. */
export type CancelPaymentResponse = EdgeFunctionResponse<{
  message: string;
}>;
