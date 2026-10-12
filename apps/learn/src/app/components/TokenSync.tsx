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

  return null
}