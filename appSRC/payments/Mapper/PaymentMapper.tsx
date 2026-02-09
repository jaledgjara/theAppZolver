import { Payment, PaymentDTO, PaymentStatusUI } from "../Type/PaymentType";

// Mapping from DB/MP status to a simplified UI status
const getStatusUI = (status: string): PaymentStatusUI => {
  if (status === "approved") return "paid";
  if (status === "refunded") return "refunded";
  if (status === "rejected") return "failed";
  return "pending";
};

export const mapPaymentDTOToEntity = (dto: PaymentDTO): Payment => {
  return {
    id: dto.id,
    reservationId: dto.reservation_id,
    clientId: dto.client_id,
    professionalId: dto.professional_id,

    financials: {
      amount: Number(dto.amount),
      currency: dto.currency ?? "ARS",
      method: dto.method,
      paymentMethodId: dto.payment_method_id ?? undefined,
    },

    status: dto.status ?? "pending",
    statusUI: getStatusUI(dto.status ?? "pending"),

    meta: {
      providerId: dto.provider_payment_id ?? undefined,
    },

    timestamps: {
      createdAt: new Date(dto.created_at ?? Date.now()),
      updatedAt: new Date(dto.updated_at ?? Date.now()),
    },
  };
};
