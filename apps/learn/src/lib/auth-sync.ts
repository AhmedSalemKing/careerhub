import { api } from './api'
import { useAuthStore, type AuthUser } from '../stores/authStore'

type ApiResponse<T> = { data?: T }

/**
 * Single-flight /auth/me refresh.
 *
 * Several independent places (Providers, the home page, the lesson page, ...)
 * wanted to refresh the user from the API. Each fired its own request, so a
 * single page load produced up to 6 identical /auth/me calls, and every
 * response wrote to the auth store — which re-rendered the whole layout.
 *
 * This module keeps one in-flight promise and shares it with every caller, and
 * it remembers the token it already resolved so repeat calls in the same
 * session are no-ops.
 */
let inFlight: Promise<AuthUser | null> | null = null
let resolvedForToken: string | null = null

export function readToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    localStorage.getItem('deveway_token') ||
    localStorage.getItem('careerhub_token') ||
    localStorage.getItem('token') ||
    document.cookie.match(/deveway_token=([^;]+)/)?.[1] ||
    null
  )
}

export function syncAuthUser(force = false): Promise<AuthUser | null> {
  const token = readToken()
  if (!token) return Promise.resolve(null)

  // Already resolved this token and we're not forcing → skip entirely.
  if (!force && resolvedForToken === token) return Promise.resolve(null)

  // A request for this token is already running → reuse it.
  if (inFlight) return inFlight

  inFlight = api
    .get<ApiResponse<{ user: AuthUser }>>('/auth/me')
    .then((res) => {
      const body = (res.data as any)?.data ?? res.data
      const user: AuthUser | null = body?.user ?? body ?? null
      if (user) useAuthStore.getState().setUser(user)
      resolvedForToken = token
      return user
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null
    })

  return inFlight
}
