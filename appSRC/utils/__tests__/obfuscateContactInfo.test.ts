import { obfuscateContactInfo } from "../obfuscateContactInfo";

describe("obfuscateContactInfo", () => {
  // ── Argentine E.164 formats ──
  it("obfuscates +54 9 11 1234-5678", () => {
    expect(obfuscateContactInfo("Llamame al +54 9 11 1234-5678")).toBe("Llamame al ********");
  });

  it("obfuscates +5491112345678 (no spaces)", () => {
    expect(obfuscateContactInfo("Mi cel: +5491112345678")).toBe("Mi cel: ********");
  });

  // ── Local Argentine formats ──
  it("obfuscates 011 15 1234-5678", () => {
    expect(obfuscateContactInfo("Contactar 011 15 1234-5678")).toBe("Contactar ********");
  });

  it("obfuscates 011-4567-8901", () => {
    expect(obfuscateContactInfo("Fijo: 011-4567-8901")).toBe("Fijo: ********");
  });

  it("obfuscates (011) 1234-5678 including leading parenthesis", () => {
    expect(obfuscateContactInfo("Tel: (011) 1234-5678")).toBe("Tel: ********");
  });

  // ── General sequences ──
  it("obfuscates generic 10-digit number", () => {
    expect(obfuscateContactInfo("Numero: 1145678901")).toBe("Numero: ********");
  });

  it("obfuscates number with dots", () => {
    expect(obfuscateContactInfo("Tel: 11.4567.8901")).toBe("Tel: ********");
  });

  // ── Short numbers should NOT be obfuscated ──
  it("preserves 6-digit numbers (too short)", () => {
    expect(obfuscateContactInfo("Código: 123456")).toBe("Código: 123456");
  });

  it("preserves 4-digit numbers", () => {
    expect(obfuscateContactInfo("Pin: 1234")).toBe("Pin: 1234");
  });

  // ── Mixed text ──
  it("obfuscates multiple phone numbers in same text", () => {
    const input = "Cel: +5491112345678, fijo: 011-4567-8901";
    const result = obfuscateContactInfo(input);
    expect(result).not.toContain("5491112345678");
    expect(result).not.toContain("4567-8901");
  });

  it("preserves non-phone text", () => {
    expect(obfuscateContactInfo("Hola, necesito el servicio de plomería")).toBe(
      "Hola, necesito el servicio de plomería",
    );
  });

  // ── Edge cases ──
  it("handles empty string", () => {
    expect(obfuscateContactInfo("")).toBe("");
  });

  it("preserves prices with dots (not enough consecutive digits)", () => {
    expect(obfuscateContactInfo("El precio es $2.500")).toBe("El precio es $2.500");
  });
});
