/**
 * Wraps fetch with an AbortController timeout for Deno Edge Functions.
 * Prevents indefinite hangs when external APIs (e.g., Mercado Pago) are unresponsive.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
