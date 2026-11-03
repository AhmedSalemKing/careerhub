'use client'

import { useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { useAuthStore } from '../../stores/authStore'

/**
 * Cross-origin token bridge.
 * 1. Reads ?token= from URL (appended by the web app on learn links),
 *    saves it to localStorage + the auth store, then strips the param.
 * 2. If no URL token, hydrates the store from any existing localStorage.
 * Returns null (renderless).
 */
export function TokenSync() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { setToken, hydrate } = useAuthStore()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Sync token from URL if present
    const urlToken = searchParams?.get('token')
    if (urlToken && urlToken !== 'null' && urlToken !== 'undefined') {
      try {
        // Account switch: a different token means a different session, so drop
        // the previous user record (and the store copy) before adopting it.
        // It is refetched from /auth/me for the new token.
        const previous =
          localStorage.getItem('deveway_token') || localStorage.getItem('careerhub_token')
        if (previous && previous !== urlToken) {
          localStorage.removeItem('deveway_user')
          localStorage.removeItem('careerhub_user')
          useAuthStore.setState({ user: null })
        }
        localStorage.setItem('deveway_token', urlToken)
        localStorage.setItem('careerhub_token', urlToken)
        setToken(urlToken)
        hydrate()
      } catch (e) {
        console.error('[TokenSync] failed to store token:', e)
      }
      // Clean up URL (remove token param)
      const url = new URL(window.location.href)
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url.toString())
      return
    }

    // 2. Check existing localStorage (from previous sessions)
    const token =
      localStorage.getItem('deveway_token') ||
      localStorage.getItem('careerhub_token') ||
      document.cookie.match(/deveway_token=([^;]+)/)?.[1] ||
      document.cookie.match(/careerhub_token=([^;]+)/)?.[1]

    if (token) {
      setToken(token)
      hydrate()
    } else {
      hydrate()
    }
  }, [searchParams, pathname, setToken, hydrate])

  // Keep this tab in step with logouts that happen elsewhere.
  // Note: web and learn are different origins, so the `storage` event only fires
  // for other learn tabs; web is signed out through the /logout redirect chain.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'deveway_token' || e.newValue || !e.oldValue) return
      // Token was cleared in another learn tab: sign this tab out too.
      if (window.location.pathname.includes('/logout')) return
      const locale = window.location.pathname.split('/')[1] === 'en' ? 'en' : 'ar'
      window.location.href = `/${locale}/logout`
    }

    // Returning to the tab: re-read storage so a logout in the meantime shows
    // as logged out (hydrate() is a no-op when nothing changed).
    const onFocus = () => hydrate()

    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
    }
  }, [hydrate])

  return null
}