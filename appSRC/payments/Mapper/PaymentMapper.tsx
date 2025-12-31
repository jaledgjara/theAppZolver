import { Payment, PaymentDTO } from "../Type/PaymentType";

// Helper function (Colocar en PaymentService o Utils)
export const mapPaymentDTOToEntity = (dto: PaymentDTO): Payment => {
  return {
    id: dto.id,
    reservationId: dto.reservation_id,
    clientId: dto.client_id,
    professionalId: dto.professional_id,
    clientName: dto.client?.legal_name,
    professionalName: dto.professional?.legal_name,

    financials: {
      amount: dto.amount,
      currency: dto.currency,
      method: dto.method,
    },

    status: dto.status,
    statusUI:
      dto.status === "completed"
        ? "paid"
        : dto.status === "failed"
        ? "failed"
        : "pending",

    meta: {
      transactionId: dto.external_transaction_id || undefined,
      proofUrl: dto.proof_of_payment_url || undefined,
    },

    timestamps: {
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    },
  };
};
