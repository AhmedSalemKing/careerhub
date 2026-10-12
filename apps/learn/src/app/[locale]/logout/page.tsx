'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { clearAuthStorage } from '../../../lib/auth'

/**
 * Cross-origin logout bridge.
 *
 * The web app cannot clear the learn app's origin-scoped localStorage, so it
 * sends the browser here after revoking the server session. This page wipes the
 * learn identity and then forwards the user back to an absolute URL provided
 * via ?to= (or the learn home as a fallback).
 */
export default function LogoutBridgePage() {
  const pathname = usePathname()

  useEffect(() => {
    clearAuthStorage()

    const seg = pathname?.split('/')[1]
    const locale = seg === 'en' ? 'en' : 'ar'

    let target = ''
    try {
      target = new URLSearchParams(window.location.search).get('to') || ''
    } catch {}
    const safe = /^https?:\/\//.test(target) ? target : null

    window.location.replace(safe || `/${locale}`)
  }, [pathname])

  const isAr = pathname?.split('/')[1] !== 'en'

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <p style={{ opacity: 0.7 }}>{isAr ? 'جارٍ تسجيل الخروج…' : 'Signing out…'}</p>
    </div>
  )
}
