'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Globe, Check } from 'lucide-react'

/* ════════════════════════════════════════
   🌐 PROFESSIONAL LANGUAGE SWITCHER
   ════════════════════════════════════════ */

const languages = [
  { code: 'ar', label: 'العربية', native: 'العربية' },
  { code: 'en', label: 'English', native: 'English' },
]

export function LanguageSwitcher() {
  const locale = useLocale()
  const t = useTranslations('langSwitcher')
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const currentLang = languages.find(l => l.code === locale)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Click outside to close
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', onClickOutside)
    }
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  // Close on escape key
  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [])

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) {
      setOpen(false)
      return
    }
    
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPath = segments.join('/')
    
    setOpen(false)
    window.location.href = newPath
  }

  if (!mounted) {
    return (
      <div
        className="flex h-9 w-[120px] items-center justify-center rounded-xl"
        style={{ background: 'var(--surface-2)' }}
      >
        <div className="h-4 w-20 rounded-full" style={{ background: 'var(--border)' }} />
      </div>
    )
  }

  const isAr = locale === 'ar'

  return (
    <div className="relative" ref={ref}>
      
      {/* ── Trigger Button ── */}
      <button
        onClick={() => setOpen(!open)}
        className={`
          group flex items-center gap-2 
          px-4 py-2 rounded-xl
          border transition-all duration-200
          ${open 
            ? 'shadow-md scale-[1.02]' 
            : 'hover:shadow-sm hover:scale-[1.01]'
          }
        `}
        style={{
          background: open ? 'var(--surface)' : 'var(--surface-2)',
          borderColor: open ? 'var(--primary-border)' : 'var(--border)',
          borderWidth: '1px',
        }}
        aria-label="Change language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        
        {/* Globe Icon */}
        <Globe 
          size={15} 
          className="transition-colors duration-200"
          style={{ 
            color: open ? 'var(--primary)' : 'var(--muted)',
            transform: open ? 'rotate(15deg)' : 'rotate(0deg)',
          }} 
        />

        {/* Current Language Label */}
        <span
          className="text-[13px] font-semibold tracking-wide select-none whitespace-nowrap"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: open ? 'var(--primary)' : 'var(--foreground)',
          }}
        >
          {currentLang?.label || 'English'}
        </span>

        {/* Chevron */}
        <ChevronDown 
          size={14} 
          className="transition-all duration-200"
          style={{
            color: 'var(--muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: open ? 1 : 0.7,
          }}
        />
      </button>

      {/* ── Dropdown Menu ── */}
      {open && (
        <div
          className={`
            absolute top-full mt-2 w-[180px] overflow-hidden
            rounded-xl border z-50
            ${isAr ? 'right-0 rtl:right-0 rtl:left-auto' : 'left-0'}
          `}
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-xl)',
            animation: 'langDrop 0.2s ease-out',
          }}
          role="listbox"
          aria-label="Select language"
        >
          
          {/* Header */}
          <div
            className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
            style={{
              color: 'var(--muted)',
              borderBottom: `1px solid var(--border)`,
              fontFamily: "'PingARLT', sans-serif",
              letterSpacing: '0.08em',
            }}
          >
            {t('header')}
          </div>

          {/* Options */}
          <div className="py-1.5">
            {languages.map((lang) => {
              const isActive = lang.code === locale
              
              return (
                <button
                  key={lang.code}
                  onClick={() => switchLocale(lang.code)}
                  className={`
                    relative flex w-full items-center justify-between
                    px-4 py-2.5 transition-all duration-150
                    ${isActive ? '' : 'hover:bg-[color:var(--surface-2)]'}
                  `}
                  style={{
                    background: isActive ? 'var(--primary-subtle)' : 'transparent',
                  }}
                  role="option"
                  aria-selected={isActive}
                >
                  
                  <div className="flex items-center gap-3">
                    
                    {/* Language indicator dot */}
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: isActive ? 'var(--primary)' : 'transparent',
                        border: isActive ? 'none' : '1.5px solid var(--border)',
                        boxShadow: isActive ? '0 0 8px rgba(81, 32, 200, 0.4)' : 'none',
                      }}
                    />
                    
                    {/* Language name */}
                    <span
                      className="text-[14px]"
                      style={{
                        fontFamily: isAr && lang.code === 'ar' 
                          ? "'PingARLT', 'Cairo', sans-serif" 
                          : "'DM Sans', sans-serif",
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'var(--primary)' : 'var(--foreground)',
                      }}
                    >
                      {lang.label}
                    </span>
                  </div>

                  {/* Check mark for active */}
                  {isActive && (
                    <Check 
                      size={16} 
                      style={{ color: 'var(--primary)' }}
                      strokeWidth={3}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer hint */}
          <div
            className="px-4 py-2 text-[10px] text-center"
            style={{
              borderTop: `1px solid var(--border)`,
              color: 'var(--muted-foreground)',
            }}
          >
            {t('hint')}
          </div>
        </div>
      )}

      {/* ── Animation Keyframes ── */}
      <style jsx>{`
        @keyframes langDrop {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}

/* ════════════════════════════════════════
   END OF LANGUAGE SWITCHER
   ════════════════════════════════════════ */