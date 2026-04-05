const SENSITIVE_KEYS = /^(password|token|secret|key|authorization|credential|hash|refreshToken|accessToken)$/i;

/**
 * Removes sensitive fields from an object before logging.
 * Keys matching the SENSITIVE_KEYS pattern are redacted.
 */
export function sanitize<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !SENSITIVE_KEYS.test(key)),
  ) as Partial<T>;
}
