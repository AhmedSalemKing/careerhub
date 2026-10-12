// ==========================================
// File: src/app/components/LanguageSwitcher.tsx
// ==========================================
'use client'

import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languages = [
    { code: 'ar', name: 'العربية' },
    { code: 'en', name: 'English' },
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
        aria-label="Change language"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-xl transition-colors duration-150"
        style={{ background: 'var(--surface-2)', color: 'var(--foreground)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-3)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline text-sm font-medium">{currentLang?.name}</span>
        <ChevronDown className="h-3 w-3" style={{ color: 'var(--muted)' }} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full mt-2 right-0 rtl:right-auto rtl:left-0 min-w-[140px] rounded-xl overflow-hidden z-50"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150"
              style={{
                color: locale === lang.code ? '#5120c8' : 'var(--foreground)',
                background: locale === lang.code ? 'var(--surface-2)' : 'transparent',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = locale === lang.code ? 'var(--surface-2)' : 'transparent' }}
            >
              <span>{lang.name}</span>
              {locale === lang.code && <Check className="h-4 w-4 mr-auto rtl:ml-auto rtl:mr-0" style={{ color: '#5120c8' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
