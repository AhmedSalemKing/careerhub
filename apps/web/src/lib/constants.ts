export const LEARN_URL = (() => {
  const u = process.env.NEXT_PUBLIC_LEARN_URL
  if (u && u.trim()) return u.trim().replace(/\/+$/, '')
  // Fallback: production build → learn app origin, dev build → local learn app
  return process.env.NODE_ENV === 'production'
    ? 'https://devewayhub.vercel.app'
    : 'http://localhost:3002'
})()

export const TRAINING_URL = LEARN_URL

/** Build a learn-app URL with the auth token appended (for cross-domain nav) */
export function learnUrl(path: string): string {
  if (typeof window === 'undefined') return `${LEARN_URL}${path}`
  const token =
    localStorage.getItem('careerhub_token') ||
    localStorage.getItem('deveway_token')
  const sep = path.includes('?') ? '&' : '?'
  return token
    ? `${LEARN_URL}${path}${sep}token=${encodeURIComponent(token)}`
    : `${LEARN_URL}${path}`
}

export const MAIN_URL =
  process.env.NEXT_PUBLIC_MAIN_URL || 'https://deveway.com'

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || ''

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || API_URL