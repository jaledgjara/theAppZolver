import { mapPaymentDTOToEntity } from "../PaymentMapper";
import { PaymentDTO } from "../../Type/PaymentType";

const makePaymentDTO = (overrides: Partial<PaymentDTO> = {}): PaymentDTO => ({
  id: "pay-uuid-1",
  reservation_id: "res-uuid-1",
  client_id: "client-uid-1",
  professional_id: "pro-uid-1",
  amount: 1500,
  currency: "ARS",
  status: "approved",
  method: "credit_card",
  payment_method_id: "card-uuid-1",
  provider_payment_id: "mp-12345",
  created_at: "2025-06-15T10:00:00Z",
  updated_at: "2025-06-15T10:05:00Z",
  ...overrides,
});

describe("PaymentMapper - mapPaymentDTOToEntity", () => {
  // --- Status mapping ---

  it("maps 'approved' status to 'paid' UI status", () => {
    const result = mapPaymentDTOToEntity(makePaymentDTO({ status: "approved" }));
    expect(result.status).toBe("approved");
    expect(result.statusUI).toBe("paid");
  });

  it("maps 'pending' status to 'pending' UI status", () => {
    const result = mapPaymentDTOToEntity(makePaymentDTO({ status: "pending" }));
    expect(result.statusUI).toBe("pending");
  });

  it("maps 'rejected' status to 'failed' UI status", () => {
    const result = mapPaymentDTOToEntity(makePaymentDTO({ status: "rejected" }));
    expect(result.statusUI).toBe("failed");
  });

  it("maps 'refunded' status to 'refunded' UI status", () => {
    const result = mapPaymentDTOToEntity(makePaymentDTO({ status: "refunded" }));
    expect(result.statusUI).toBe("refunded");
  });

  it("maps null status to 'pending'", () => {
    const result = mapPaymentDTOToEntity(makePaymentDTO({ status: null }));
    expect(result.status).toBe("pending");
    expect(result.statusUI).toBe("pending");
  });

  // --- Financial fields ---

  it("maps amount as number", () => {
    const result = mapPaymentDTOToEntity(makePaymentDTO({ amount: 2500.5 }));
    expect(result.financials.amount).toBe(2500.5);
  });

  it("defaults currency to ARS when null", () => {
    const result = mapPaymentDTOToEntity(makePaymentDTO({ currency: null }));
    expect(result.financials.currency).toBe("ARS");
  });

  it("maps method correctly", () => {
    const result = mapPaymentDTOToEntity(makePaymentDTO({ method: "debit_card" }));
    expect(result.financials.method).toBe("debit_card");
  });

  it("maps payment_method_id to undefined when null", () => {
    const result = mapPaymentDTOToEntity(makePaymentDTO({ payment_method_id: null }));
    expect(result.financials.paymentMethodId).toBeUndefined();
  });

  // --- IDs and meta ---

  it("maps all ID fields correctly", () => {
    const result = mapPaymentDTOToEntity(makePaymentDTO());
    expect(result.id).toBe("pay-uuid-1");
    expect(result.reservationId).toBe("res-uuid-1");
    expect(result.clientId).toBe("client-uid-1");
    expect(result.professionalId).toBe("pro-uid-1");
  });

  it("maps provider_payment_id to meta.providerId", () => {
    const result = mapPaymentDTOToEntity(makePaymentDTO({ provider_payment_id: "mp-99" }));
    expect(result.meta.providerId).toBe("mp-99");
  });

  it("maps null provider_payment_id to undefined", () => {
    const result = mapPaymentDTOToEntity(makePaymentDTO({ provider_payment_id: null }));
    expect(result.meta.providerId).toBeUndefined();
  });

  // --- Timestamps ---

  it("parses timestamps as Date objects", () => {
    const result = mapPaymentDTOToEntity(makePaymentDTO());
    expect(result.timestamps.createdAt).toBeInstanceOf(Date);
    expect(result.timestamps.updatedAt).toBeInstanceOf(Date);
  });

  it("handles null timestamps gracefully", () => {
    const result = mapPaymentDTOToEntity(makePaymentDTO({ created_at: null, updated_at: null }));
    expect(result.timestamps.createdAt).toBeInstanceOf(Date);
    expect(result.timestamps.updatedAt).toBeInstanceOf(Date);
  });
});
