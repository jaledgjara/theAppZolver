import { PaymentService } from "../PaymentService";
import { supabase } from "@/appSRC/services/supabaseClient";

// Mock supabase client
jest.mock("@/appSRC/services/supabaseClient", () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
      single: jest.fn(),
    })),
  },
}));

const mockInvoke = supabase.functions.invoke as jest.Mock;

describe("PaymentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- createPayment ---

  describe("createPayment", () => {
    const validPayload = {
      card_token: "tok_123",
      amount: 500,
      subtotal: 5000,
      payer_email: "test@example.com",
      payment_method_id: "visa",
      user_id: "user-1",
      professional_id: "pro-1",
      service_category: "plomería",
      service_modality: "instant",
      start_date: "2025-01-01T10:00:00Z",
      end_date: "2025-01-01T11:00:00Z",
      address_display: "Av. San Martín 123",
    };

    it("returns response data on success", async () => {
      mockInvoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            reservation_id: "res-1",
            payment_id: 12345,
            status: "pending_approval",
            payment_status: "approved",
          },
        },
        error: null,
      });

      const result = await PaymentService.createPayment(validPayload);
      expect(result.reservation_id).toBe("res-1");
      expect(result.payment_status).toBe("approved");
      expect(mockInvoke).toHaveBeenCalledWith("process-booking-payment", {
        body: validPayload,
      });
    });

    it("throws on edge function error", async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: "Server error" },
      });

      await expect(PaymentService.createPayment(validPayload)).rejects.toThrow("Server error");
    });

    it("throws on business logic failure", async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false, error: "Fondos insuficientes." },
        error: null,
      });

      await expect(PaymentService.createPayment(validPayload)).rejects.toThrow(
        "Fondos insuficientes.",
      );
    });

    it("throws generic message when no error detail", async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false },
        error: null,
      });

      await expect(PaymentService.createPayment(validPayload)).rejects.toThrow(
        "No se pudo procesar el pago.",
      );
    });
  });

  // --- cancelPayment ---

  describe("cancelPayment", () => {
    const cancelPayload = {
      reservation_id: "res-1",
      reason: "No longer needed",
      triggered_by: "client" as const,
    };

    it("returns success message", async () => {
      mockInvoke.mockResolvedValue({
        data: {
          success: true,
          message: "Reserva cancelada y dinero reembolsado.",
        },
        error: null,
      });

      const result = await PaymentService.cancelPayment(cancelPayload);
      expect(result).toBe("Reserva cancelada y dinero reembolsado.");
      expect(mockInvoke).toHaveBeenCalledWith("cancel-reservation-refund", {
        body: cancelPayload,
      });
    });

    it("throws on edge function error", async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: "Network error" },
      });

      await expect(PaymentService.cancelPayment(cancelPayload)).rejects.toThrow(
        "Fallo en el servidor: Network error",
      );
    });

    it("throws on business logic failure", async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false, error: "No tenés permiso." },
        error: null,
      });

      await expect(PaymentService.cancelPayment(cancelPayload)).rejects.toThrow(
        "No tenés permiso.",
      );
    });
  });

  // --- fetchPaymentsByClient ---

  describe("fetchPaymentsByClient", () => {
    it("returns empty array when no payments", async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await PaymentService.fetchPaymentsByClient("user-1");
      expect(result).toEqual([]);
    });

    it("throws on query error", async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "DB error" },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(PaymentService.fetchPaymentsByClient("user-1")).rejects.toThrow(
        "No se pudo cargar el historial de pagos.",
      );
    });

    it("maps DTOs to entities", async () => {
      const mockPayment = {
        id: "pay-1",
        reservation_id: "res-1",
        client_id: "user-1",
        professional_id: "pro-1",
        amount: 1000,
        currency: "ARS",
        status: "approved",
        method: "credit_card",
        payment_method_id: null,
        provider_payment_id: "mp-1",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [mockPayment],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await PaymentService.fetchPaymentsByClient("user-1");
      expect(result).toHaveLength(1);
      expect(result[0].statusUI).toBe("paid");
      expect(result[0].financials.amount).toBe(1000);
    });
  });
});
