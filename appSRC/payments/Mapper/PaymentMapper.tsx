import { Payment, PaymentDTO, PaymentStatusUI } from "../Type/PaymentType";

// Función auxiliar para calcular estado visual
const getStatusUI = (status: string): PaymentStatusUI => {
  if (status === "approved") return "paid";
  if (status === "rejected" || status === "refunded") return "failed";
  return "pending";
};

export const mapPaymentDTOToEntity = (dto: PaymentDTO): Payment => {
  return {
    id: dto.id,
    reservationId: dto.reservation_id,
    payerId: dto.payer_id,

    financials: {
      amount: Number(dto.amount),
      currency: dto.currency,
      method: dto.payment_method,
    },

    status: dto.status,
    statusUI: getStatusUI(dto.status),

    meta: {
      providerId: dto.provider_payment_id || undefined,
    },

    timestamps: {
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    },
  };
};
