'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Reads ?token= from URL (passed by the main site when navigating cross-domain),
 * saves it to localStorage so the learn app's axios interceptor can use it,
 * then strips the param from the address bar.
 */
export function TokenSync() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlToken = searchParams.get('token')
    if (urlToken && urlToken !== 'null' && urlToken !== 'undefined') {
      localStorage.setItem('deveway_token', urlToken)
      localStorage.setItem('careerhub_token', urlToken)
      // Clean the token from the URL
      const url = new URL(window.location.href)
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  return null
}
