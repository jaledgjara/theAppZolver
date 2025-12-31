// --- 0. STATUS & METHOD DEFINITIONS ---
// Igual que en la DB (Postgres Enum match)
export type PaymentStatusDTO =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded";

export type PaymentMethodDTO =
  | "cash"
  | "transfer_alias"
  | "credit_card"
  | "platform_credit";

export type PaymentStatusUI = "pending" | "paid" | "failed";

export interface PaymentDTO {
  id: string;
  reservation_id: string;
  client_id: string; // UUID del pagador
  professional_id: string; // UUID del cobrador
  amount: number;
  currency: string;
  method: PaymentMethodDTO;
  status: PaymentStatusDTO;

  // Datos opcionales de trazabilidad
  external_transaction_id?: string | null;
  proof_of_payment_url?: string | null;

  created_at: string;
  updated_at: string;

  // Relaciones expandidas (Joins opcionales de Supabase)
  client?: {
    legal_name: string;
    avatar_url?: string;
  };
  professional?: {
    legal_name: string;
    avatar_url?: string;
  };
}

export interface Payment {
  id: string;
  reservationId: string;

  // Roles involucrados (Abstracción limpia)
  clientId: string;
  professionalId: string;
  clientName?: string;
  professionalName?: string;

  // Agrupación financiera (Similar a tu Reservation Entity)
  financials: {
    amount: number;
    currency: string;
    method: PaymentMethodDTO; // Mantenemos el literal string para lógica
  };

  // Detalles de estado y transacción
  status: PaymentStatusDTO; // Estado técnico
  statusUI: PaymentStatusUI; // Estado visual (ej: Color de badge)

  meta: {
    transactionId?: string; // ID externo (MP, Stripe, Hash)
    proofUrl?: string; // Foto del comprobante
  };

  timestamps: {
    createdAt: Date;
    updatedAt: Date;
  };
}

// --- 3. PAYLOADS (Inputs para la API) ---

/**
 * Payload para CREAR un nuevo registro de pago.
 * Se usa cuando el usuario da click en "Pagar" o "Informar Transferencia".
 */
export interface CreatePaymentPayload {
  reservation_id: string;
  client_id: string;
  professional_id: string;
  amount: number;
  currency?: string; // Default 'ARS'
  method: PaymentMethodDTO;
  // Nota: status se omite porque la DB lo pone en 'pending' por defecto
}

/**
 * Payload para ACTUALIZAR un pago existente.
 * Se usa para:
 * 1. Subir la foto del comprobante (Client)
 * 2. Confirmar que se recibió el dinero (Professional)
 */
export interface UpdatePaymentPayload {
  status?: PaymentStatusDTO;
  external_transaction_id?: string;
  proof_of_payment_url?: string;
}
