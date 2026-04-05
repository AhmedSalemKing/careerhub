'use client'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const switchLocale = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar'
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPath = segments.join('/')
    window.location.href = newPath
  }

  if (!mounted) return null

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-1 px-3 py-1.5 rounded-full
                 border border-gray-300 dark:border-gray-600
                 text-sm font-medium
                 hover:bg-gray-100 dark:hover:bg-gray-800
                 transition-colors duration-200"
    >
      {locale === 'ar' ? 'EN' : 'عربي'}
    </button>
  )
}

