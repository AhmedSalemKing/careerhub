'use client'

import { useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'

/**
 * 1. Reads ?token= from URL → saves to localStorage → strips param.
 * 2. If no token at all → redirects to main site login with return URL.
 */
export function TokenSync() {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  useEffect(() => {
    // 1. Sync token from URL if present
    const urlToken = searchParams.get('token')
    if (urlToken && urlToken !== 'null' && urlToken !== 'undefined') {
      localStorage.setItem('deveway_token', urlToken)
      localStorage.setItem('careerhub_token', urlToken)
      const url = new URL(window.location.href)
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url.toString())
      return
    }

    // 2. Check if token exists from any source
    const token =
      localStorage.getItem('deveway_token') ||
      localStorage.getItem('careerhub_token') ||
      document.cookie.match(/deveway_token=([^;]+)/)?.[1] ||
      document.cookie.match(/careerhub_token=([^;]+)/)?.[1]

    if (!token) {
      // 3. Redirect to main site login with return URL
      const returnUrl = encodeURIComponent(window.location.href)
      const mainSiteUrl =
        process.env.NEXT_PUBLIC_MAIN_URL || 'https://deveway-teal.vercel.app'
      window.location.href = `${mainSiteUrl}/ar/login?redirect=${returnUrl}`
    }
  }, [searchParams, pathname])

  return null
}
