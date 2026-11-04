import { LEARN_URL } from './constants'
import { getToken } from './auth'

/** Current session token (localStorage or cookie), or '' when signed out. */
function currentToken(): string {
  if (typeof window === 'undefined') return ''
  try {
    return (
      localStorage.getItem('deveway_token') ||
      localStorage.getItem('careerhub_token') ||
      getToken() ||
      ''
    )
  } catch {
    return ''
  }
}

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
  const token = currentToken()
  if (token) {
    const separator = cleanPath.includes('?') ? '&' : '?'
    return `${base}${cleanPath}${separator}token=${encodeURIComponent(token)}`
  }
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


/** Locale-aware learn link that carries the token: learnLink('/courses', 'ar'). */
export function learnLink(path: string, locale: string = 'ar'): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  return learnUrlWithToken(`/${locale}${clean}`)
}

export function learnCoursesLink(locale: string = 'ar'): string {
  return learnLink('/courses', locale)
}

export function learnCourseLink(courseId: string, locale: string = 'ar'): string {
  return learnLink(`/courses/${courseId}`, locale)
}

/** Add the current token to an absolute URL on the learn origin (others are returned unchanged). */
export function withLearnToken(url: string): string {
  try {
    const target = new URL(url, window.location.href)
    if (target.origin !== new URL(LEARN_URL).origin || target.searchParams.has('token')) return url
    const token = currentToken()
    if (!token) return url
    target.searchParams.set('token', token)
    return target.toString()
  } catch {
    return url
  }
}

/**
 * Links are often rendered on the server (or at module load), where there is no
 * localStorage, so their href has no token and React does not patch it on
 * hydration. This delegated listener adds the token to any link pointing at the
 * learn origin right before it is followed (mousedown/touchstart also cover
 * middle-click, new-tab and copy-link). Returns a cleanup function.
 */
export function installLearnLinkTokenizer(): () => void {
  if (typeof document === 'undefined') return () => {}
  const handler = (e: Event) => {
    const el = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!el) return
    const next = withLearnToken(el.href)
    if (next !== el.href) el.href = next
  }
  const events = ['mousedown', 'touchstart', 'click', 'contextmenu', 'focusin'] as const
  events.forEach((ev) => document.addEventListener(ev, handler, true))
  return () => events.forEach((ev) => document.removeEventListener(ev, handler, true))
}
