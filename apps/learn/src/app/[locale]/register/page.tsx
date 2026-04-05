'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'
import { MAIN_URL } from '../../../lib/constants'

export default function RegisterRedirectPage() {
  const locale = useLocale()

  useEffect(() => {
    // Preserve any query params (e.g., redirect URL)
    const search = typeof window !== 'undefined' ? window.location.search : ''
    window.location.replace(`${MAIN_URL}/${locale}/register${search}`)
  }, [locale])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400 text-sm">جارٍ التوجيه...</p>
    </div>
  )
}
