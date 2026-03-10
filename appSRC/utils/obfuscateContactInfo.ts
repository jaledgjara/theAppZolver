/**
 * Obfuscates phone numbers in text to prevent users from exchanging
 * contact info outside the platform. Replaces any numeric sequence
 * with 7+ digits (allowing common separators) with "********".
 *
 * Covers:
 * - Argentine E.164: +54 9 11 1234-5678, +5491112345678
 * - Local formats: 011 15 1234-5678, 011-4567-8901, (011) 1234-5678
 * - General: any 7+ digit sequence with optional spaces/dashes/dots/parens
 */

const PHONE_PATTERN = /(?:\+?\d[\d\s\-().]{5,}\d)/g;

function countDigits(match: string): number {
  return (match.match(/\d/g) || []).length;
}

export function obfuscateContactInfo(text: string): string {
  return text.replace(PHONE_PATTERN, (match) => {
    return countDigits(match) >= 7 ? "********" : match;
  });
}
