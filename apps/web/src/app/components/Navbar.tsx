'use client'

import Link from 'next/link'
import { UserAvatar } from '../../components/avatars/UserAvatar'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NotificationBell } from './NotificationBell'
import VerifiedBadge from '../../components/VerifiedBadge'
import { Sparkles, Menu, X, LogOut, ChevronDown, LayoutDashboard, Sun, Moon, Shield, BookOpen, Calendar, Settings } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useMarket } from '../contexts/MarketContext'
import { get } from '../../lib/api'
import { LEARN_URL } from '../../lib/constants'
import { learnUrlWithToken, installLearnLinkTokenizer } from '../../lib/learn-link'


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
const NAV_FONT = 'var(--font-ui)'

/* ════════════════════════════════════════
   Theme Toggle
   ════════════════════════════════════════ */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type='button'
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className='icon-btn'
      aria-label={label}
      title={label}
    >
      <svg className='icon' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.9' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
        {isDark ? (
          <path d='M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' />
        ) : (
          <path d='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z' />
        )}
      </svg>
    </button>
  )
}

/* ════════════════════════════════════════
   Market Switcher (KSA / EG) — drives the `market` cookie read by api.ts
   ════════════════════════════════════════ */
function MarketSwitcher({ inMenu }: { inMenu?: boolean }) {
  const tm = useTranslations('market')
  const { market, setMarket } = useMarket()

  return (
    // dir="ltr" keeps KSA | EG in the same order and position in Arabic and English.
    <div className={inMenu ? "mkt" : "mkt hide-sm"} dir="ltr" role="group" aria-label={tm('switcher')}>
      <button type="button" className={market === 'KSA' ? 'on' : undefined} aria-pressed={market === 'KSA'} title={tm('ksa')} onClick={() => setMarket('KSA')}>KSA</button>
      <button type="button" className={market === 'EG' ? 'on' : undefined} aria-pressed={market === 'EG'} title={tm('eg')} onClick={() => setMarket('EG')}>EG</button>
    </div>
  )
}

/* ════════════════════════════════════════
   User Dropdown
   ════════════════════════════════════════ */
function UserDropdown({ locale }: { locale: string }) {
  const t = useTranslations('nav')
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
  }

  const isRtl = locale === 'ar'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full focus:outline-none transition-opacity duration-200 hover:opacity-80"
        aria-label="User menu"
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <UserAvatar user={{ avatar: user?.profile?.avatar, gender: user?.profile?.gender, name: user?.profile?.firstName }} size={32} />
          {user?.isVerified && <VerifiedBadge size="xs" onAvatar showTooltip={false} />}
        </div>
        <ChevronDown
          className="h-3 w-3 transition-transform duration-200"
          style={{ color: 'var(--muted)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            left: isRtl ? 0 : 'auto',
            right: isRtl ? 'auto' : 0,
            zIndex: 9999,
            minWidth: '220px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            padding: '8px',
            animation: 'navFadeIn 0.15s ease-out',
          }}
        >
          {/* User info header */}
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--border)',
            marginBottom: '6px',
          }}>
            <p style={{ fontWeight: '600', fontSize: '14px', color: 'var(--foreground)', margin: 0 }}>
              {user?.profile?.firstName ?? ''} {user?.profile?.lastName ?? ''}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>
              {user?.email}
            </p>
          </div>

          {/* Dashboard link */}
          <Link
            href={`/${locale}/dashboard`}
            onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '10px',
              color: 'var(--foreground)', textDecoration: 'none',
              fontSize: '14px', fontWeight: '500',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <LayoutDashboard size={16} />
            {t('dashboard')}
          </Link>

          {/* Admin link */}
          {user?.accountType === 'ADMIN' && (
            <Link
              href={`/${locale}/admin`}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: '10px',
                color: 'var(--brand)', textDecoration: 'none',
                fontSize: '14px', fontWeight: '500',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(81,32,200,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <Shield size={16} color="#5120c8" />
              {t('admin')}
            </Link>
          )}

          {/* Instructor link */}
          {user?.accountType === 'INSTRUCTOR' && (
            <Link
              href={`/${locale}/dashboard/create-course`}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: '10px',
                color: '#2BBFA3', textDecoration: 'none',
                fontSize: '14px', fontWeight: '500',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(43,191,163,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <BookOpen size={16} color="#2BBFA3" />
              {locale === 'ar' ? 'لوحة المحاضر' : 'Instructor Panel'}
            </Link>
          )}

          {/* Consultant link */}
          {user?.accountType === 'CONSULTANT' && (
            <Link
              href={`/${locale}/dashboard/my-sessions`}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', borderRadius: '10px',
                color: '#f59e0b', textDecoration: 'none',
                fontSize: '14px', fontWeight: '500',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <Calendar size={16} color="#f59e0b" />
              {locale === 'ar' ? 'لوحة المرشد' : 'Mentor Panel'}
            </Link>
          )}

          {/* Settings link */}
          <Link
            href={`/${locale}/dashboard/settings`}
            onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '10px',
              color: 'var(--foreground)', textDecoration: 'none',
              fontSize: '14px', fontWeight: '500',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <Settings size={16} />
            {locale === 'ar' ? 'الإعدادات' : 'Settings'}
          </Link>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--border)', margin: '6px 0' }} />

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '10px',
              color: '#ef4444', background: 'transparent',
              border: 'none', width: '100%', cursor: 'pointer',
              fontSize: '14px', fontWeight: '500',
              fontFamily: 'inherit',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut size={16} />
            {t('logout')}
          </button>
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
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, token, hydrate } = useAuthStore()

  // Every link to the learn app carries the current token, even ones rendered
  // before auth state was available (SSR / module-level hrefs).
  useEffect(() => installLearnLinkTokenizer(), [])

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
  const isLearnRelative = LEARN_URL.startsWith('/')

  const initials = mounted && user?.profile
    ? `${user.profile.firstName?.[0] ?? ''}${user.profile.lastName?.[0] ?? ''}`.toUpperCase()
    : ''

  /* ═══ Navigation Links (same five items as the reference nav) ═══ */
  type NavItem = { key: string; href: string; label: string; external?: boolean }
  const navItems: NavItem[] = [
    { key: 'careers', href: `/${locale}/careers`, label: t('careers') },
    { key: 'learners', href: learnUrlWithToken(`/${locale}`), label: t('learners'), external: true },
    { key: 'mentors', href: `/${locale}/coaching`, label: t('mentors') },
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

      <header className={`header dw-header${scrolled ? ' scrolled' : ''}`}>
        <div className="wrap">

          {/* Logo (wordmark image, light/dark swap handled in CSS) */}
          <Link href={`/${locale}`} className="logo" aria-label="DeveWay">
            <img className="on-light" src="/logo-wordmark-light.webp" alt="DeveWay" />
            <img className="on-dark" src="/logo-wordmark-dark.webp" alt="" />
          </Link>

          {/* Main nav */}
          <nav className="nav" aria-label="Main">
            {navItems.map((l) => {
              const active = isActive(l.href)
              return l.external ? (
                <a
                  key={l.key}
                  href={l.href}
                  target={isLearnRelative ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.key}
                  href={l.href}
                  className={active ? 'active' : undefined}
                  aria-current={active ? 'page' : undefined}
                >
                  {l.label}
                </Link>
              )
            })}
          </nav>

          {/* Tools: market, language, theme, auth, menu */}
          <div className="hdr-tools">
            <MarketSwitcher />
            <LanguageSwitcher />
            <ThemeToggle />

            {mounted && isLoggedIn && (
              <>
                <NotificationBell />
                <Link href={`/${locale}/dashboard/ai-chat`} title="DeveWay AI" aria-label="DeveWay AI" className="icon-btn hide-sm">
                  <Sparkles className="icon" />
                </Link>
                <div className="hidden lg:block">
                  {user?.role === 'ADMIN' || user?.accountType === 'ADMIN' ? (
                    <Link
                      href={`/${locale}/admin`}
                      className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-medium transition-colors duration-150"
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--error-subtle)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <UserAvatar user={{ avatar: user?.profile?.avatar, gender: user?.profile?.gender, name: user?.profile?.firstName }} size={28} />
                        {user?.isVerified && <VerifiedBadge size="xs" onAvatar showTooltip={false} />}
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: 'var(--error-subtle)', color: 'var(--error)', fontFamily: NAV_FONT }}
                      >
                        Admin
                      </span>
                    </Link>
                  ) : (
                    <UserDropdown locale={locale} />
                  )}
                </div>
              </>
            )}

            {mounted && !isLoggedIn && (
              <>
                <Link href={`/${locale}/login`} className="btn btn-ghost btn-sm hide-md">
                  {t('login')}
                </Link>
                <Link href={`/${locale}/register`} className="btn btn-primary btn-sm hide-sm">
                  {t('start_assessment')}
                </Link>
              </>
            )}

            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="icon-btn menu-btn"
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="icon" /> : <Menu className="icon" />}
            </button>
          </div>
        </div>
      </header>

      {/* ═══ Mobile Menu ═══ */}
      {mobileOpen && (
        <div
          className="dw-menu fixed inset-0 top-[64px] z-30 lg:hidden overflow-y-auto"
          style={{
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            animation: 'mobileSlide 0.2s ease-out',
          }}
        >
          <div className="px-4 py-5 space-y-5">
            {/* Nav links */}
            <nav className="flex flex-col gap-0.5">
              {navItems.map((l) => {
                const active = isActive(l.href)
                const style = {
                  fontWeight: 500,
                  fontFamily: NAV_FONT,
                  color: active ? 'var(--brand)' : 'var(--foreground)',
                  background: active ? 'var(--surface-2)' : 'transparent',
                  letterSpacing: '-0.01em',
                } as const
                return l.external ? (
                  <a
                    key={l.key}
                    href={l.href}
                    target={isLearnRelative ? '_self' : '_blank'}
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-4 py-3.5 text-[15px] transition-colors duration-150"
                    style={style}
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.key}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-4 py-3.5 text-[15px] transition-colors duration-150"
                    style={style}
                  >
                    {l.label}
                  </Link>
                )
              })}
            </nav>

            {/* Mobile actions row */}
            <div
              className="flex items-center gap-2 px-1"
              style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}
            >
              <MarketSwitcher inMenu />
              <LanguageSwitcher />
              <ThemeToggle />
              {mounted && isLoggedIn && (
                <Link
                  href={`/${locale}/dashboard/ai-chat`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
                  style={{ background: 'rgba(81, 32, 200, 0.10)', color: 'var(--brand)', fontFamily: NAV_FONT }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  AI
                </Link>
              )}
              <NotificationBell />
            </div>

            {/* Auth section */}
            {isLoggedIn ? (
              <div className="flex flex-col gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
<div className="flex items-center gap-3 px-2">
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <UserAvatar user={{ avatar: user?.profile?.avatar, gender: user?.profile?.gender, name: user?.profile?.firstName }} size={40} />
                    {user?.isVerified && <VerifiedBadge size="xs" onAvatar showTooltip={false} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                      {user?.profile?.firstName
                        ? `${user.profile.firstName} ${user.profile.lastName ?? ''}`.trim()
                        : user?.email}
                      {user?.isVerified && <VerifiedBadge size="xs" showTooltip={false} />}
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
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors duration-150"
                    style={{ background: 'var(--surface-2)', color: 'var(--foreground)', fontFamily: NAV_FONT }}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {t('dashboard')}
                  </Link>
                  <button
                    onClick={() => {
                      const { logout } = useAuthStore.getState();
                      logout();
                      setMobileOpen(false);
                      window.dispatchEvent(new Event('auth:updated'));
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-150"
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
                  className="btn btn-ghost w-full"
                >
                  {t('login')}
                </Link>
                <Link
                  href={`/${locale}/register`}
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-primary w-full"
                >
                  {t('start_assessment')}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}