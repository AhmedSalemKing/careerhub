'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'
import { MAIN_URL } from '../../../lib/constants'

export default function LoginRedirectPage() {
  const locale = useLocale()

  useEffect(() => {
    // Preserve redirect param so main site can redirect back after login
    const search = typeof window !== 'undefined' ? window.location.search : ''
    const params = new URLSearchParams(search)
    // If no redirect param, set redirect to come back to current learn page
    if (!params.get('redirect')) {
      params.set('redirect', typeof window !== 'undefined' ? window.location.href.replace(window.location.search, '') : `/${locale}`)
    }
    window.location.replace(`${MAIN_URL}/${locale}/login?${params.toString()}`)
  }, [locale])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400 text-sm">جارٍ التوجيه...</p>
    </div>
  )
}
