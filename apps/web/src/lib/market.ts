/**
 * DeveWay Currency System
 *
 * Business rules:
 * - Egypt (EG): show prices in EGP using *Display fields from API
 * - All others: show prices in SAR using raw values as fallback
 * - Earnings/wallet/revenue/course prices: all use API Display fields when available
 *
 * Single source of truth: x-vercel-ip-country (server) / market cookie (client)
 */

// ── SERVER SIDE (Server Components / page.tsx) ──────────────────────────────

/**
 * Get country code on the server from Vercel's CDN header.
 * Use in: async page.tsx, route handlers, server actions
 *
 * @returns 'EG' for Egypt, 'SA' for everything else
 */
export async function getCountry(): Promise<string> {
  try {
    const { headers } = await import('next/headers')
    const h = headers()
    return h.get('x-vercel-ip-country') ?? 'SA'
  } catch {
    return 'SA'
  }
}

/**
 * Build query string to append to API fetch URLs in server components.
 * Usage: fetch(`${API}/courses${await getCountryQuery()}`)
 *
 * @returns '?country=EG' or '' (empty = SAR, the API default)
 */
export async function getCountryQuery(): Promise<string> {
  const country = await getCountry()
  return country === 'EG' ? '?country=EG' : ''
}

/**
 * Merge country param into an existing query string without duplication.
 * Usage: fetch(`${API}/courses?status=PUBLISHED${await appendCountry()}`)
 *
 * @returns '&country=EG' or '' — safely append to any URL
 */
export async function appendCountry(): Promise<string> {
  const country = await getCountry()
  return country === 'EG' ? '&country=EG' : ''
}

// ── CLIENT SIDE (Client Components) ─────────────────────────────────────────

/**
 * Get country code on the client from the market cookie.
 * Use in: 'use client' components that fetch data
 *
 * @returns 'EG' for Egypt, 'SA' for everything else
 */
export function getCountryClient(): string {
  if (typeof document === 'undefined') return 'SA'
  const match = document.cookie.match(/(?:^|;\s*)market=([^;]*)/)
  return match?.[1] === 'EGP' ? 'EG' : 'SA'
}

/**
 * Check if current user is in Egyptian market.
 * Convenience function for conditional rendering.
 */
export function isEgyptClient(): boolean {
  return getCountryClient() === 'EG'
}

// ── RENDERING ────────────────────────────────────────────────────────────────

/**
 * Format a course price for display.
 * Always prefer priceDisplay from the API — it's already formatted correctly.
 *
 * @param course - Any object with optional priceDisplay and price fields
 * @returns Formatted price string like "٧٬٣٢٩ ج.م" or "٥٠٠ ر.س" or "مجاني"
 */
export function formatCoursePrice(course: {
  priceDisplay?: string | null
  price?: number | null
}): string {
  // 1. Use API-provided formatted price if available (preferred)
  if (course.priceDisplay) return course.priceDisplay

  // 2. Zero price = free
  if (!course.price || course.price === 0) return 'مجاني'

  // 3. Fallback: raw price in SAR (should rarely happen if API is correct)
  return `${Number(course.price).toLocaleString('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ر.س`
}

/**
 * Format any monetary amount for display.
 * Prefer API-provided Display fields for Egyptian market.
 *
 * @param amount - Raw SAR amount
 * @param displayValue - Optional pre-formatted value from API (e.g. "٩٦٤٫٠٠ ج.م")
 * @returns Formatted string like "٩٦٤٫٠٠ ج.م" or "٧٢٠٫٠٠ ر.س"
 */
export function formatMoney(
  amount: number | string | null | undefined,
  displayValue?: string | null
): string {
  if (displayValue) return displayValue
  const num = Number(amount) || 0
  return `${num.toLocaleString('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ر.س`
}
