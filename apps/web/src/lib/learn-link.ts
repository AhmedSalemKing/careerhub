import { LEARN_URL } from './constants'

/**
 * Build a learn-app URL with the auth token appended (for cross-domain nav).
 * The learn app reads ?token= on load (via TokenSync) and logs the user in.
 */
export function learnUrlWithToken(path: string): string {
  const base = LEARN_URL.replace(/\/+$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  if (typeof window === 'undefined') {
    return `${base}${cleanPath}`
  }
  try {
    const token =
      localStorage.getItem('deveway_token') ||
      localStorage.getItem('careerhub_token')
    if (token) {
      const separator = cleanPath.includes('?') ? '&' : '?'
      return `${base}${cleanPath}${separator}token=${encodeURIComponent(token)}`
    }
  } catch {}
  return `${base}${cleanPath}`
}

/**
 * Build the learn-app SSO sync URL. Learn stores the token, then sends the
 * browser on to `returnUrl` (an absolute URL on a whitelisted host). Used right
 * after login so the learn app is signed in without the user opening it first.
 * Falls back to `returnUrl` unchanged when there is no token.
 */
export function learnSyncUrl(returnUrl: string, locale: string, tokenOverride?: string): string {
  let token = tokenOverride || ''
  if (!token && typeof window !== 'undefined') {
    try {
      token = localStorage.getItem('deveway_token') || localStorage.getItem('careerhub_token') || ''
    } catch {}
  }
  if (!token) return returnUrl
  const base = LEARN_URL.replace(/\/+$/, '')
  return `${base}/${locale}/auth/sync?token=${encodeURIComponent(token)}&return=${encodeURIComponent(returnUrl)}`
}
