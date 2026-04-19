'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { SearchBar } from './SearchBar' 
import { CartIcon } from './CartDrawer'
import { NotificationBell } from './NotificationBell'
import { Sparkles, Menu, X, LogOut, ChevronDown, LayoutDashboard, Sun, Moon } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { TRAINING_URL } from '../../lib/constants'

/* ════════════════════════════════════════
   SCROLL TO SECTION UTILITY
   ════════════════════════════════════════ */
function scrollToSection(sectionId: string, locale: string) {
  const tryScroll = (attempt = 0): boolean => {
    const element = document.getElementById(sectionId)
    
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        })
      }, attempt === 0 ? 50 : 0)
      
      window.history.pushState(null, '', `/#${sectionId}`)
      return true
    }
    
    if (attempt < 20) {
      setTimeout(() => tryScroll(attempt + 1), 100)
      return false
    }
    
    window.location.href = `/${locale}/#${sectionId}`
    return false
  }
  
  return tryScroll()
}

/* ═══ Shared font for nav + buttons ═══ */
const NAV_FONT = "'PingARLT', 'Arial Black', sans-serif"

/* ════════════════════════════════════════
   Theme Toggle
   ════════════════════════════════════════ */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: 'var(--surface-2)' }}
      >
        <div className="h-4 w-4 rounded-full" style={{ background: 'var(--border)' }} />
      </div>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200 overflow-hidden"
      style={{ background: 'var(--surface-2)' }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-3)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center transition-all duration-200"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)',
        }}
      >
        <Moon className="h-[15px] w-[15px]" style={{ color: '#5120c8' }} />
      </div>
      <div
        className="absolute inset-0 flex items-center justify-center transition-all duration-200"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? 'rotate(-90deg) scale(0.5)' : 'rotate(0deg) scale(1)',
        }}
      >
        <Sun className="h-[15px] w-[15px]" style={{ color: '#F59E0B' }} />
      </div>
    </button>
  )
}

/* ════════════════════════════════════════
   User Dropdown
   ════════════════════════════════════════ */
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
    window.dispatchEvent(new Event('auth:updated'))
    window.location.href = `/${locale}`
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full focus:outline-none transition-opacity duration-200 hover:opacity-80"
        aria-label="User menu"
      >
        {user?.profile?.avatar ? (
          <img
            src={user.profile.avatar}
            alt="avatar"
            className="h-8 w-8 rounded-full object-cover"
            style={{ boxShadow: '0 0 0 2px var(--border)' }}
          />
        ) : (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black select-none"
            style={{ background: '#5120c8', fontFamily: NAV_FONT, color: '#ffffff' }}
          >
            {initials}
          </span>
        )}
        <ChevronDown
          className="h-3 w-3 transition-transform duration-200"
          style={{ color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 rtl:left-auto rtl:right-0 top-full mt-2.5 w-56 rounded-2xl border py-1.5 z-50"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-xl)',
            animation: 'navFadeIn 0.15s ease-out',
          }}
        >
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
              {user?.profile?.firstName
                ? `${user.profile.firstName} ${user.profile.lastName ?? ''}`.trim()
                : user?.email}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--muted)' }}>{user?.email}</p>
          </div>

          <Link
            href={user?.accountType === 'ADMIN' ? `/${locale}/admin` : `/${locale}/dashboard`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-150"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <LayoutDashboard className="h-4 w-4" />
            {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </Link>

          <div className="mt-1 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors duration-150"
              style={{ color: 'var(--error)', fontFamily: NAV_FONT }}
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

/* ════════════════════════════════════════
   Navbar
   ════════════════════════════════════════ */
export function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const { resolvedTheme } = useTheme() // ← إضافة useTheme للحصول على الوضع الحالي
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, token, hydrate } = useAuthStore()

  useEffect(() => {
    setMounted(true)
    hydrate()

    const syncAuth = () => hydrate()
    window.addEventListener('storage', syncAuth)
    window.addEventListener('auth:updated', syncAuth)
    const timers = [
      setTimeout(syncAuth, 1000),
      setTimeout(syncAuth, 2000),
      setTimeout(syncAuth, 3000),
    ]

    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('auth:updated', syncAuth)
      window.removeEventListener('scroll', onScroll)
      timers.forEach(clearTimeout)
    }
  }, [])

  const isLoggedIn = mounted && !!token
  const isAr = locale === 'ar'
  const isLearnRelative = TRAINING_URL.startsWith('/')

  // ← تحديد لون DeveWay بناءً على الوضع
  const deveWayColor = mounted 
    ? (resolvedTheme === 'dark' ? '#ffffff' : '#0d0d0d')
    : '#ffffff'

  const initials = mounted && user?.profile
    ? `${user.profile.firstName?.[0] ?? ''}${user.profile.lastName?.[0] ?? ''}`.toUpperCase()
    : ''

  /* ═══ Navigation Links ═══ */
  const links = [
    { href: `/#career-paths`, label: t('careers'), isAnchor: true, sectionId: 'career-paths' },
    { href: `/${locale}/coaching`, label: t('coaches') },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <>
      <style jsx>{`
        @keyframes navFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes mobileSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header
        className="sticky top-0 z-40 w-full transition-all duration-200"
        style={{
          background: '#050505',
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(81,32,200,0.08) 0%, transparent 60%)',
          borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        <div className="dw-container flex h-[68px] items-center justify-between">

          {/* ═══ Branding (Logo + Text) ═══ */}
          <Link href={`/${locale}`} className="shrink-0 flex items-center gap-3 sm:mr-6 md:mr-8" style={{ marginRight: '12px' }}>
            <img
              src="/logo-icon.png"
              alt="DeveWay"
              className="h-[44px] w-auto object-contain transition-opacity duration-200 hover:opacity-80 sm:h-[52px]"
              style={{ background: 'transparent', minWidth: '44px' }}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            {/* ✅ تم تعديل اللون هنا ليكون ديناميكياً حسب الوضع */}
            <span
              className="hidden sm:inline-block text-[22px] font-black tracking-tight transition-colors duration-200 hover:opacity-80 md:text-[24px]"
              style={{ 
                fontFamily: NAV_FONT, 
                color: deveWayColor,  // ← اللون الديناميكي
                lineHeight: 1 
              }}
            >
              DeveWay
            </span>
          </Link>

          {/* ═══ Navigation Links (Desktop) ═══ */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {links.map((l) => {
              const active = isActive(l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={(e) => {
                    if (l.isAnchor) {
                      e.preventDefault()
                      const sectionId = l.sectionId || 'career-paths'
                      scrollToSection(sectionId, locale)
                    }
                  }}
                  className="relative px-[18px] py-[9px] rounded-xl transition-colors duration-150"
                  style={{
                    fontSize: '14px',
                    fontWeight: 900,
                    letterSpacing: '-0.01em',
                    fontFamily: NAV_FONT,
                    color: active ? '#5120c8' : 'var(--foreground)',
                    background: active ? 'var(--surface-2)' : 'transparent',
                    opacity: active ? 1 : 0.75,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'var(--surface-2)'
                      e.currentTarget.style.opacity = '1'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.opacity = '0.75'
                    }
                  }}
                >
                  {l.label}
                </Link>
              )
            })}
            <a
              href={`${TRAINING_URL}/${locale}`}
              target={isLearnRelative ? '_self' : '_blank'}
              rel="noopener noreferrer"
              className="px-[18px] py-[9px] rounded-xl transition-colors duration-150"
              style={{
                fontSize: '14px',
                fontWeight: 900,
                letterSpacing: '-0.01em',
                fontFamily: NAV_FONT,
                color: 'var(--foreground)',
                opacity: 0.85,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-2)'
                e.currentTarget.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.opacity = '0.85'
              }}
            >
              {t('training')}
              <span className="inline-block ml-1 text-[10px] opacity-35">↗</span>
            </a>
          </nav>

          {/* ═══ Actions ═══ */}
          <div className="flex items-center gap-1.5">

            {/* Icon buttons row */}
            <div className="flex items-center gap-1">
              
              <SearchBar />

              <div className="hidden sm:flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
                <LanguageSwitcher />
                <ThemeToggle />
                {mounted && isLoggedIn && (
                  <Link
                    href={`/${locale}/dashboard/ai-chat`}
                    title="DeveWay AI"
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150"
                    style={{ background: 'rgba(81, 32, 200, 0.10)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(81, 32, 200, 0.18)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(81, 32, 200, 0.10)' }}
                  >
                    <Sparkles className="h-[14px] w-[14px]" style={{ color: '#5120c8' }} />
                  </Link>
                )}
              </div>

              <NotificationBell />
              <CartIcon />
            </div>

            {/* Separator */}
            {mounted && isLoggedIn && (
              <div className="hidden lg:block h-6 w-px mx-0.5" style={{ background: 'var(--border)' }} />
            )}

            {/* Auth (desktop) */}
            {!mounted ? (
              <div className="h-9 w-[130px] hidden lg:block" />
            ) : isLoggedIn ? (
              <div className="hidden lg:block">
                {user?.role === 'ADMIN' || user?.accountType === 'ADMIN' ? (
                  <Link
                    href={`/${locale}/admin`}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-medium transition-colors duration-150"
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--error-subtle)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black"
                      style={{ background: 'var(--error)', fontFamily: NAV_FONT, color: '#ffffff' }}
                    >
                      {initials || 'A'}
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-black"
                      style={{ background: 'var(--error-subtle)', color: 'var(--error)', fontFamily: NAV_FONT }}
                    >
                      Admin
                    </span>
                  </Link>
                ) : (
                  <UserDropdown locale={locale} />
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  href={`/${locale}/login`}
                  className="px-4 py-2 text-[13px] font-black rounded-xl transition-colors duration-150"
                  style={{
                    color: 'var(--muted)',
                    border: '1px solid var(--border)',
                    fontFamily: NAV_FONT,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--foreground)'
                    e.currentTarget.style.borderColor = 'var(--border-strong)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--muted)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  {t('login')}
                </Link>
                <Link
                  href={`/${locale}/register`}
                  className="px-5 py-2 text-[13px] font-black rounded-xl transition-colors duration-150"
                  style={{
                    background: '#5120c8',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px -2px rgba(81,32,200,0.25)',
                    fontFamily: NAV_FONT,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4318a8'
                    e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(81,32,200,0.30)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#5120c8'
                    e.currentTarget.style.boxShadow = '0 2px 8px -2px rgba(81,32,200,0.25)'
                  }}
                >
                  {t('register')}
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex lg:hidden h-9 w-9 items-center justify-center rounded-xl transition-colors duration-150"
              style={{
                color: 'var(--muted)',
                background: mobileOpen ? 'var(--surface-2)' : 'transparent',
              }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>
      </header>

      {/* ═══ Mobile Menu ═══ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-[68px] z-30 lg:hidden overflow-y-auto"
          style={{
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            animation: 'mobileSlide 0.2s ease-out',
          }}
        >
          <div className="px-4 py-5 space-y-5">
            {/* Nav links */}
            <nav className="flex flex-col gap-0.5">
              {links.map((l) => {
                const active = isActive(l.href)
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={(e) => {
                      if (l.isAnchor) {
                        e.preventDefault()
                        const sectionId = l.sectionId || 'career-paths'
                        scrollToSection(sectionId, locale)
                        setMobileOpen(false)
                      } else {
                        setMobileOpen(false)
                      }
                    }}
                    className="rounded-xl px-4 py-3.5 text-[15px] transition-colors duration-150"
                    style={{
                      fontWeight: 900,
                      fontFamily: NAV_FONT,
                      color: active ? '#5120c8' : 'var(--foreground)',
                      background: active ? 'var(--surface-2)' : 'transparent',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {l.label}
                  </Link>
                )
              })}
              <a
                href={`${TRAINING_URL}/${locale}`}
                target={isLearnRelative ? '_self' : '_blank'}
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3.5 text-[15px] transition-colors duration-150"
                style={{ fontWeight: 900, fontFamily: NAV_FONT, color: 'var(--foreground)', letterSpacing: '-0.01em' }}
              >
                {t('training')} <span className="text-xs opacity-30">↗</span>
              </a>
            </nav>

            {/* Mobile actions row */}
            <div
              className="flex items-center gap-2 px-1"
              style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}
            >
              <LanguageSwitcher />
              <ThemeToggle />
              {mounted && isLoggedIn && (
                <Link
                  href={`/${locale}/dashboard/ai-chat`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black"
                  style={{ background: 'rgba(81, 32, 200, 0.10)', color: '#5120c8', fontFamily: NAV_FONT }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  AI
                </Link>
              )}
              <NotificationBell />
              <CartIcon />
            </div>

            {/* Auth section */}
            {isLoggedIn ? (
              <div className="flex flex-col gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3 px-2">
                  {user?.profile?.avatar ? (
                    <img
                      src={user.profile.avatar}
                      alt="avatar"
                      className="h-10 w-10 rounded-full object-cover"
                      style={{ boxShadow: '0 0 0 2px var(--border)' }}
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black"
                      style={{ background: '#5120c8', fontFamily: NAV_FONT, color: '#ffffff' }}
                    >
                      {initials || '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                      {user?.profile?.firstName
                        ? `${user.profile.firstName} ${user.profile.lastName ?? ''}`.trim()
                        : user?.email}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <Link
                    href={user?.accountType === 'ADMIN' ? `/${locale}/admin` : `/${locale}/dashboard`}
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-colors duration-150"
                    style={{ background: 'var(--surface-2)', color: 'var(--foreground)', fontFamily: NAV_FONT }}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                  </Link>
                  <button
                    onClick={() => {
                      const { logout } = useAuthStore.getState();
                      logout();
                      setMobileOpen(false);
                      window.dispatchEvent(new Event('auth:updated'));
                      window.location.href = `/${locale}`;
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-colors duration-150"
                    style={{ color: 'var(--error)', border: '1px solid rgba(239,68,68,0.12)', fontFamily: NAV_FONT }}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : mounted ? (
              <div className="flex flex-col gap-2.5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <Link
                  href={`/${locale}/login`}
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-center rounded-xl py-3 text-sm font-black transition-colors duration-150"
                  style={{ border: '1px solid var(--border)', color: 'var(--foreground)', fontFamily: NAV_FONT }}
                >
                  {t('login')}
                </Link>
                <Link
                  href={`/${locale}/register`}
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-center rounded-xl py-3 text-sm font-black transition-colors duration-150"
                  style={{
                    background: '#5120c8',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px -2px rgba(81,32,200,0.25)',
                    fontFamily: NAV_FONT,
                  }}
                >
                  {t('register')}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}