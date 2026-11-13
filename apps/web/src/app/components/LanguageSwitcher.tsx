'use client'

import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'

/* Header language toggle: shows the language you will switch TO ("English" on the
   Arabic site, "العربية" on the English site), matching the reference nav. */
export function LanguageSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()

  const target = locale === 'ar' ? 'en' : 'ar'
  const label = target === 'en' ? 'English' : 'العربية'

  const switchLocale = () => {
    const segments = pathname.split('/')
    segments[1] = target
    window.location.href = segments.join('/')
  }

  return (
    <button
      type="button"
      className="icon-btn lang-btn"
      onClick={switchLocale}
      aria-label="Language"
      data-testid="language-switcher"
    >
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 5h8M8 3v2M10.5 5c-.9 3.6-3.1 6.4-6.5 8M6 9c1 1.8 2.6 3.2 4.5 4M12 21l4.5-10 4.5 10M13.4 18h6.2" />
      </svg>
      <span className="lang-full">{label}</span>
      <span className="lang-short" aria-hidden="true">{target.toUpperCase()}</span>
    </button>
  )
}
