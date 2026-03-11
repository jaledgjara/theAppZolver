/**
 * Tests for phone number validation and other input validators.
 * These test the shared validation utilities used at Edge Function boundaries.
 *
 * Note: The actual validate.ts lives in supabase/functions/_shared/ (Deno runtime),
 * so we re-implement the same logic here for testing the validation rules.
 */

// ── Re-implement validators for testing (Deno module can't be imported in Jest) ──
function isValidPhoneAR(phone: unknown): phone is string {
  if (typeof phone !== "string") return false;
  return /^\+54\d{10,11}$/.test(phone.replace(/\s/g, ""));
}

function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function isValidDNI(dni: unknown): dni is string {
  if (typeof dni !== "string") return false;
  return /^\d{7,8}$/.test(dni.replace(/\./g, ""));
}

function isValidString(value: unknown, maxLength = 255): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && value > 0;
}

function isValidRole(role: unknown): role is "client" | "professional" {
  return role === "client" || role === "professional";
}

// ══════════════════════════════════════════════════════════
// Phone Number Protocol (Argentine E.164)
// ══════════════════════════════════════════════════════════

describe("isValidPhoneAR — Argentine E.164 protocol", () => {
  // ── Valid formats ──
  it("accepts +54 + 10 digits (mobile without 9)", () => {
    expect(isValidPhoneAR("+541112345678")).toBe(true);
  });

  it("accepts +54 + 11 digits (mobile with 9)", () => {
    expect(isValidPhoneAR("+5491112345678")).toBe(true);
  });

  it("accepts format with spaces (stripped internally)", () => {
    expect(isValidPhoneAR("+54 9 11 1234 5678")).toBe(true);
  });

  // ── Invalid formats ──
  it("rejects missing +54 prefix", () => {
    expect(isValidPhoneAR("1112345678")).toBe(false);
  });

  it("rejects wrong country code", () => {
    expect(isValidPhoneAR("+551112345678")).toBe(false);
  });

  it("rejects too short (9 digits after +54)", () => {
    expect(isValidPhoneAR("+54111234567")).toBe(false);
  });

  it("rejects too long (12 digits after +54)", () => {
    expect(isValidPhoneAR("+54911123456789")).toBe(false);
  });

  it("rejects letters", () => {
    expect(isValidPhoneAR("+54abcdefghij")).toBe(false);
  });

  it("rejects null", () => {
    expect(isValidPhoneAR(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(isValidPhoneAR(undefined)).toBe(false);
  });

  it("rejects number type", () => {
    expect(isValidPhoneAR(541112345678)).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidPhoneAR("")).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════
// Email validation
// ══════════════════════════════════════════════════════════

describe("isValidEmail", () => {
  it("accepts standard email", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("accepts email with subdomain", () => {
    expect(isValidEmail("user@mail.example.com")).toBe(true);
  });

  it("rejects missing @", () => {
    expect(isValidEmail("userexample.com")).toBe(false);
  });

  it("rejects missing domain", () => {
    expect(isValidEmail("user@")).toBe(false);
  });

  it("rejects spaces", () => {
    expect(isValidEmail("user @example.com")).toBe(false);
  });

  it("rejects email exceeding 254 chars", () => {
    const long = "a".repeat(245) + "@example.com";
    expect(isValidEmail(long)).toBe(false);
  });

  it("rejects non-string types", () => {
    expect(isValidEmail(123)).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════
// DNI (Argentine national ID)
// ══════════════════════════════════════════════════════════

describe("isValidDNI", () => {
  it("accepts 7-digit DNI", () => {
    expect(isValidDNI("1234567")).toBe(true);
  });

  it("accepts 8-digit DNI", () => {
    expect(isValidDNI("12345678")).toBe(true);
  });

  it("accepts DNI with dots (stripped)", () => {
    expect(isValidDNI("12.345.678")).toBe(true);
  });

  it("rejects 6-digit DNI", () => {
    expect(isValidDNI("123456")).toBe(false);
  });

  it("rejects 9-digit DNI", () => {
    expect(isValidDNI("123456789")).toBe(false);
  });

  it("rejects letters", () => {
    expect(isValidDNI("1234567a")).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════
// Other validators
// ══════════════════════════════════════════════════════════

describe("isValidString", () => {
  it("accepts normal string", () => {
    expect(isValidString("hello")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidString("")).toBe(false);
  });

  it("rejects whitespace-only string", () => {
    expect(isValidString("   ")).toBe(false);
  });

  it("rejects string exceeding maxLength", () => {
    expect(isValidString("a".repeat(256))).toBe(false);
  });

  it("accepts with custom maxLength", () => {
    expect(isValidString("abc", 3)).toBe(true);
    expect(isValidString("abcd", 3)).toBe(false);
  });
});

describe("isPositiveNumber", () => {
  it("accepts positive number", () => {
    expect(isPositiveNumber(5000)).toBe(true);
  });

  it("rejects zero", () => {
    expect(isPositiveNumber(0)).toBe(false);
  });

  it("rejects negative", () => {
    expect(isPositiveNumber(-1)).toBe(false);
  });

  it("rejects NaN", () => {
    expect(isPositiveNumber(NaN)).toBe(false);
  });

  it("rejects string", () => {
    expect(isPositiveNumber("5000")).toBe(false);
  });
});

describe("isValidRole", () => {
  it("accepts client", () => {
    expect(isValidRole("client")).toBe(true);
  });

  it("accepts professional", () => {
    expect(isValidRole("professional")).toBe(true);
  });

  it("rejects admin", () => {
    expect(isValidRole("admin")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidRole("")).toBe(false);
  });
});
