export const TOKEN_KEY = 'careerhub_token'
export const REFRESH_KEY = 'careerhub_refresh'
export const USER_KEY = 'careerhub_user'

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(t: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, t)
}

export function removeToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_KEY)
}

export function setRefreshToken(t: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(REFRESH_KEY, t)
}

export function removeRefreshToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(REFRESH_KEY)
}

export function getUser<T = unknown>(): T | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function setUser(u: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(u))
}

export function removeUser() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(USER_KEY)
}

export function isAuthenticated() {
  return !!getToken()
}

export function logout() {
  removeToken()
  removeRefreshToken()
  removeUser()
  if (typeof window !== 'undefined') window.location.href = '/ar/login'
}

