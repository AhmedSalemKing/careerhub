// ==========================================
// File: src/app/components/LanguageSwitcher.tsx
// ==========================================
'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languages = [
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ]

  const currentLang = languages.find((l) => l.code === locale)

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) { setIsOpen(false); return }
    const segments = pathname.split('/')
    segments[1] = newLocale
    setIsOpen(false)
    window.location.href = segments.join('/')
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLang?.flag}</span>
        <span className="hidden sm:inline">{currentLang?.name}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 rtl:right-auto rtl:left-0 w-36 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${locale === lang.code ? 'bg-blue-50 dark:bg-blue-900/20 text-[#1e3a8a] dark:text-[#5120c8]' : 'text-slate-700 dark:text-slate-300'
                }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
              {locale === lang.code && (
                <span className="mr-auto rtl:ml-auto rtl:mr-0 text-[#1e3a8a] dark:text-[#5120c8]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}