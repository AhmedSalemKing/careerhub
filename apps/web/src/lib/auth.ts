export const TOKEN_KEY = 'deveway_token'
export const REFRESH_KEY = 'deveway_refresh'
export const USER_KEY = 'deveway_user'

// ─── Cookie helpers (browser-only) ────────────────────────────────────────────
function cookieDomain(): string {
  if (typeof window === 'undefined') return ''
  const { hostname } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') return ''
  const parts = hostname.split('.')
  return `; domain=.${parts.slice(-2).join('.')}`
}

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/${cookieDomain()}; SameSite=Lax`
}

function getCookie(name: string): string | null {
  const parts = `; ${document.cookie}`.split(`; ${name}=`)
  if (parts.length === 2) return decodeURIComponent(parts.pop()!.split(';')[0])
  return null
}

function deleteCookie(name: string) {
  const domain = cookieDomain()
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}; SameSite=Lax`
}
// ──────────────────────────────────────────────────────────────────────────────

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY) ?? getCookie(TOKEN_KEY)
}

export function setToken(t: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, t)
  setCookie(TOKEN_KEY, t)
}

export function removeToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  deleteCookie(TOKEN_KEY)
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_KEY) ?? getCookie(REFRESH_KEY)
}

export function setRefreshToken(t: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(REFRESH_KEY, t)
  try { setCookie(REFRESH_KEY, t, 30) } catch {}
}

export function removeRefreshToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(REFRESH_KEY)
  deleteCookie(REFRESH_KEY)
}

export function getUser<T = unknown>(): T | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY) ?? getCookie(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function setUser(u: unknown) {
  if (typeof window === 'undefined') return
  const str = JSON.stringify(u)
  localStorage.setItem(USER_KEY, str)
  try { setCookie(USER_KEY, str) } catch {}
}

export function removeUser() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(USER_KEY)
  deleteCookie(USER_KEY)
}

export function isAuthenticated() {
  return !!getToken()
}

export function logout() {
  removeToken()
  removeRefreshToken()
  removeUser()
  if (typeof window !== 'undefined') {
    const seg = window.location.pathname.split('/')[1]
    const locale = seg === 'en' ? 'en' : 'ar'
    window.location.href = `/${locale}/login`
  }
}
