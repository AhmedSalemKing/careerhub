'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { CartIcon } from './CartIcon'
import { SearchBar } from './SearchBar'
import { Menu, X, ExternalLink, LogOut, BookOpen, ChevronDown, Sparkles } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { MAIN_URL } from '../../lib/constants'

function UserDropdown({ locale }: { locale: string }) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const firstName = user?.profile?.firstName || user?.email?.split('@')[0] || ''
  const initials = firstName[0]?.toUpperCase() || '?'

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setOpen(false)
    window.location.href = `/${locale}`
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full focus:outline-none"
        aria-label="User menu"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white select-none" style={{ background: 'var(--primary)' }}>
          {initials}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
      </button>

      {open && (
        <div
          className="absolute left-0 rtl:left-auto rtl:right-0 top-full mt-2 w-52 rounded-xl py-1 z-50"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
              {user?.profile?.firstName
                ? `${user.profile.firstName} ${user.profile.lastName ?? ''}`.trim()
                : user?.email}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{user?.email}</p>
          </div>

          <Link
            href={`/${locale}/my-courses`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <BookOpen className="h-4 w-4" />
            {locale === 'ar' ? 'كورساتي' : 'My Courses'}
          </Link>

          <a
            href={`${MAIN_URL}/${locale}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <ExternalLink className="h-4 w-4" />
            {locale === 'ar' ? 'العودة لـ DeveWay' : 'Back to DeveWay'}
          </a>

          <div className="mt-1" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--error)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--error-subtle)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <LogOut className="h-4 w-4" />
              {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const locale = useLocale()
  const t = useTranslations('nav')
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isLoggedIn = mounted && !!token

  const links = [
    { href: `/${locale}`, label: locale === 'ar' ? 'الرئيسية' : 'Home' },
    { href: `/${locale}/courses`, label: t('courses') },
    { href: `/${locale}/my-courses`, label: locale === 'ar' ? 'كورساتي' : 'My Courses' },
    { href: `/${locale}/coaching`, label: locale === 'ar' ? 'احجز استشارة' : 'Book Consultation' },
  ]

  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: '0 1px 3px rgba(27,35,64,0.06)',
      }}
    >
      <div className="dw-container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-3 shrink-0">
          <img
            src="/logo-icon.png"
            alt="DeveWay"
            className="h-9 w-auto object-contain md:h-11"
style={{ background: 'transparent', mixBlendMode: 'screen' }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <span style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 800,
            fontSize: 20,
            color: 'var(--foreground)',
            letterSpacing: '-0.02em',
          }}>
            DeveWay
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-sm rounded-lg transition-colors duration-150 hover:text-primary"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-brand)', fontWeight: 900 }}
            >
              {l.label}
            </Link>
          ))}

          <a
            href={`${MAIN_URL}/${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-colors duration-150 hover:text-primary"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-brand)', fontWeight: 900 }}
          >
            {locale === 'ar' ? 'الموقع الرئيسي' : 'Main Site'}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <SearchBar />
          </div>
          <CartIcon />
          <ThemeToggle />
          <LanguageSwitcher />
          {isLoggedIn && (
            <a
              href={`${MAIN_URL}/${locale}/dashboard/ai-chat`}
              title="DeveWay AI"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/20 transition group"
            >
              <Sparkles className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </a>
          )}

          {/* Auth area — desktop */}
          <div className="hidden items-center gap-2 md:flex">
            {isLoggedIn ? (
              <UserDropdown locale={locale} />
            ) : (
              <>
                <a href={`${MAIN_URL}/${locale}/login`} className="btn-secondary text-sm">
                  {t('login')}
                </a>
                <a href={`${MAIN_URL}/${locale}/register`} className="btn-primary text-sm">
                  {t('register')}
                </a>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg md:hidden transition-colors"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden animate-fade-up" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="space-y-1 px-4 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 text-base transition-colors duration-150 hover:text-primary"
                style={{ color: 'var(--muted)', fontFamily: 'var(--font-brand)', fontWeight: 900 }}
              >
                {l.label}
              </Link>
            ))}

            <a
              href={`${MAIN_URL}/${locale}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-4 py-3 text-base transition-colors duration-150 hover:text-primary"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-brand)', fontWeight: 900 }}
            >
              {locale === 'ar' ? 'الموقع الرئيسي' : 'Main Site'}
              <ExternalLink className="h-4 w-4" />
            </a>

            {/* Mobile auth */}
            {isLoggedIn ? (
              <div className="pt-4 border-t mt-4 space-y-1" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3 px-4 py-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white select-none" style={{ background: 'var(--primary)' }}>
                    {(user?.profile?.firstName || user?.email?.split('@')[0] || '?')[0]?.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                    {user?.profile?.firstName
                      ? `${user.profile.firstName} ${user.profile.lastName ?? ''}`.trim()
                      : user?.email}
                  </span>
                </div>
                <button
                  onClick={() => {
                    useAuthStore.getState().logout()
                    setMobileMenuOpen(false)
                    window.location.href = `/${locale}`
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{ color: 'var(--error)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--error-subtle)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <LogOut className="h-4 w-4" />
                  {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                </button>
              </div>
            ) : (
              <div className="flex gap-3 pt-4 border-t mt-4" style={{ borderColor: 'var(--border)' }}>
                <a
                  href={`${MAIN_URL}/${locale}/login`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center btn-secondary text-sm"
                >
                  {t('login')}
                </a>
                <a
                  href={`${MAIN_URL}/${locale}/register`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center btn-primary text-sm"
                >
                  {t('register')}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
