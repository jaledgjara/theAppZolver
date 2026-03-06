import { mapDtoToUi } from "../PaymentMethodMapper";
import { PaymentMethodDTO } from "../../Type/PaymentMethodType";

const makeDTO = (overrides: Partial<PaymentMethodDTO> = {}): PaymentMethodDTO => ({
  id: "card-uuid-1",
  user_id: "user-123",
  provider_card_id: "mp-card-1",
  provider_customer_id: "mp-customer-1",
  brand: "visa",
  last_four_digits: "4242",
  expiry_month: 12,
  expiry_year: 2028,
  is_default: false,
  created_at: "2025-01-01T00:00:00Z",
  ...overrides,
});

describe("PaymentMethodMapper - mapDtoToUi", () => {
  // --- Brand normalization ---

  it("maps 'visa' brand correctly", () => {
    const result = mapDtoToUi(makeDTO({ brand: "visa" }));
    expect(result.brand).toBe("visa");
    expect(result.type).toBe("credit_card");
  });

  it("maps 'mastercard' brand correctly", () => {
    const result = mapDtoToUi(makeDTO({ brand: "mastercard" }));
    expect(result.brand).toBe("mastercard");
  });

  it("maps 'amex' brand correctly", () => {
    const result = mapDtoToUi(makeDTO({ brand: "amex" }));
    expect(result.brand).toBe("amex");
  });

  it("maps unknown brand to 'unknown'", () => {
    const result = mapDtoToUi(makeDTO({ brand: "naranja" }));
    expect(result.brand).toBe("unknown");
  });

  it("handles case-insensitive brand matching", () => {
    expect(mapDtoToUi(makeDTO({ brand: "VISA" })).brand).toBe("visa");
    expect(mapDtoToUi(makeDTO({ brand: "MasterCard" })).brand).toBe("mastercard");
    expect(mapDtoToUi(makeDTO({ brand: "AMEX" })).brand).toBe("amex");
  });

  // --- Debit detection ---

  it("detects debit cards from 'visa_debit'", () => {
    const result = mapDtoToUi(makeDTO({ brand: "visa_debit" }));
    expect(result.brand).toBe("visa");
    expect(result.type).toBe("debit_card");
  });

  it("detects debit cards from 'master_debito'", () => {
    const result = mapDtoToUi(makeDTO({ brand: "master_debito" }));
    expect(result.brand).toBe("mastercard");
    expect(result.type).toBe("debit_card");
  });

  it("defaults to credit_card when no debit indicator", () => {
    const result = mapDtoToUi(makeDTO({ brand: "visa" }));
    expect(result.type).toBe("credit_card");
  });

  // --- Output structure ---

  it("maps id and last4 correctly", () => {
    const result = mapDtoToUi(makeDTO({ id: "abc-123", last_four_digits: "9876" }));
    expect(result.id).toBe("abc-123");
    expect(result.last4).toBe("9876");
  });

  it("generates correct titleFormatted", () => {
    const result = mapDtoToUi(makeDTO({ brand: "visa", last_four_digits: "4242" }));
    expect(result.titleFormatted).toBe("Visa •••• 4242");
  });

  it("sets iconName to 'card'", () => {
    const result = mapDtoToUi(makeDTO());
    expect(result.iconName).toBe("card");
  });
});
