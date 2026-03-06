import { PaymentMethodsService } from "../PaymentMethodService";
import { supabase } from "@/appSRC/services/supabaseClient";

jest.mock("@/appSRC/services/supabaseClient", () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const mockFrom = supabase.from as jest.Mock;
const mockInvoke = supabase.functions.invoke as jest.Mock;

describe("PaymentMethodsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- fetchPaymentMethodsByUser ---

  describe("fetchPaymentMethodsByUser", () => {
    it("returns mapped cards on success", async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [
            {
              id: "card-1",
              user_id: "user-1",
              provider_card_id: "mp-c1",
              provider_customer_id: "mp-cust-1",
              brand: "visa",
              last_four_digits: "4242",
              expiry_month: 12,
              expiry_year: 2028,
              is_default: false,
              created_at: "2025-01-01T00:00:00Z",
            },
          ],
          error: null,
        }),
      };
      mockFrom.mockReturnValue(mockChain);

      const result = await PaymentMethodsService.fetchPaymentMethodsByUser("user-1");
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe("visa");
      expect(result[0].last4).toBe("4242");
      expect(result[0].type).toBe("credit_card");
    });

    it("returns empty array when no data", async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockFrom.mockReturnValue(mockChain);

      const result = await PaymentMethodsService.fetchPaymentMethodsByUser("user-1");
      expect(result).toEqual([]);
    });

    it("throws on Supabase error", async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "RLS blocked" },
        }),
      };
      mockFrom.mockReturnValue(mockChain);

      await expect(PaymentMethodsService.fetchPaymentMethodsByUser("user-1")).rejects.toThrow(
        "No se pudieron cargar tus métodos de pago.",
      );
    });

    it("returns empty array on mapper error (graceful degradation)", async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{ brand: null }], // Will cause mapper to throw
          error: null,
        }),
      };
      mockFrom.mockReturnValue(mockChain);

      const result = await PaymentMethodsService.fetchPaymentMethodsByUser("user-1");
      expect(result).toEqual([]);
    });
  });

  // --- fetchCardProviderDetails ---

  describe("fetchCardProviderDetails", () => {
    it("returns provider details on success", async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            provider_card_id: "mp-c1",
            provider_customer_id: "mp-cust-1",
            brand: "mastercard",
          },
          error: null,
        }),
      };
      mockFrom.mockReturnValue(mockChain);

      const result = await PaymentMethodsService.fetchCardProviderDetails("card-1");
      expect(result.provider_card_id).toBe("mp-c1");
      expect(result.brand).toBe("mastercard");
    });

    it("throws when card not found", async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Not found" },
        }),
      };
      mockFrom.mockReturnValue(mockChain);

      await expect(PaymentMethodsService.fetchCardProviderDetails("nonexistent")).rejects.toThrow(
        "No se encontraron los datos del proveedor",
      );
    });
  });

  // --- deletePaymentMethod ---

  describe("deletePaymentMethod", () => {
    it("returns true on successful deletion", async () => {
      mockInvoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await PaymentMethodsService.deletePaymentMethod("card-1");
      expect(result).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith("delete-payment-method", {
        body: { card_id: "card-1" },
      });
    });

    it("throws on edge function error", async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: "Server error" },
      });

      await expect(PaymentMethodsService.deletePaymentMethod("card-1")).rejects.toThrow(
        "Fallo en el servidor: Server error",
      );
    });

    it("throws on business logic failure", async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false, error: "No tenés permiso." },
        error: null,
      });

      await expect(PaymentMethodsService.deletePaymentMethod("card-1")).rejects.toThrow(
        "No tenés permiso.",
      );
    });
  });

  // --- savePaymentMethod ---

  describe("savePaymentMethod", () => {
    const savePayload = {
      user_id: "user-1",
      email: "test@example.com",
      token: "tok_123",
      dni: "12345678",
      payment_method_id: "visa",
    };

    it("returns mapped card on success", async () => {
      mockInvoke.mockResolvedValue({
        data: {
          success: true,
          data: {
            id: "card-new",
            user_id: "user-1",
            provider_card_id: "mp-c2",
            provider_customer_id: "mp-cust-1",
            brand: "visa",
            last_four_digits: "1234",
            expiry_month: 6,
            expiry_year: 2027,
            is_default: false,
            created_at: "2025-01-01T00:00:00Z",
          },
        },
        error: null,
      });

      const result = await PaymentMethodsService.savePaymentMethod(savePayload);
      expect(result.brand).toBe("visa");
      expect(result.last4).toBe("1234");
    });

    it("throws on edge function error", async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: "MP rejected" },
      });

      await expect(PaymentMethodsService.savePaymentMethod(savePayload)).rejects.toThrow();
    });
  });
});
