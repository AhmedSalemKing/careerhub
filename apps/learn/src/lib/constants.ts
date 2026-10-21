export const PRODUCTION_API_URL = 'https://api.deveways.com/api'
export const PRODUCTION_MAIN_URL = 'https://deveway-teal.vercel.app'
export const PRODUCTION_LEARN_URL = typeof window !== 'undefined' ? window.location.origin : 'https://deveway-teal.vercel.app'

export const MAIN_URL =
  (() => { const u = process.env.NEXT_PUBLIC_MAIN_URL; return (u && u.trim()) ? u.replace(/\/+$/, '') : PRODUCTION_MAIN_URL })()

/**
 * Web (main app) login URL. Learn has no login of its own — unauthenticated
 * users are always handed off to the main app. Pass `redirectPath` to send them
 * back to where they were after logging in; relative paths are made absolute to
 * the Learn origin so the web app can hand the session back cross-domain.
 */
export function webLoginUrl(locale: string, redirectPath?: string): string {
  const base = `${MAIN_URL}/${locale}/login`
  if (!redirectPath) return base
  const target = redirectPath.startsWith('http')
    ? redirectPath
    : `${typeof window !== 'undefined' ? window.location.origin : LEARN_URL}${redirectPath}`
  return `${base}?redirect=${encodeURIComponent(target)}`
}

export const API_URL =
  (() => { const u = process.env.NEXT_PUBLIC_API_URL; const v = (u && u.trim()) ? u : PRODUCTION_API_URL; return v.replace(/\/+$/, '') })()

export const LEARN_URL =
  (() => { const u = process.env.NEXT_PUBLIC_LEARN_URL; return (u && u.trim()) ? u.replace(/\/+$/, '') : PRODUCTION_LEARN_URL })()

export const TRAINING_URL = LEARN_URL
