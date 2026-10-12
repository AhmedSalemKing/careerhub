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