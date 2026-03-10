/**
 * Input validation utilities for Edge Functions.
 *
 * Provides basic validation for common input types at system boundaries.
 */

/** Validate an email address format */
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  // Simple but effective email regex — covers 99.9% of real emails
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/** Validate an Argentine phone number format (E.164) */
export function isValidPhoneAR(phone: unknown): phone is string {
  if (typeof phone !== "string") return false;
  // E.164: +54 followed by 10 digits (area code + number)
  return /^\+54\d{10,11}$/.test(phone.replace(/\s/g, ""));
}

/** Validate a non-empty string within a max length */
export function isValidString(value: unknown, maxLength = 255): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

/** Validate that a value is a positive number */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && value > 0;
}

/** Validate a DNI (Argentine national ID) — 7 or 8 digits */
export function isValidDNI(dni: unknown): dni is string {
  if (typeof dni !== "string") return false;
  return /^\d{7,8}$/.test(dni.replace(/\./g, ""));
}

/** Validate a role is one of the allowed values */
export function isValidRole(role: unknown): role is "client" | "professional" {
  return role === "client" || role === "professional";
}

/** Build a validation error response */
export function validationError(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
