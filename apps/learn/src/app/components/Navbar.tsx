'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { SearchBar } from './SearchBar'
import { Menu, X, LogOut, ChevronDown, LayoutDashboard, Sparkles, BookOpen, Bell, ArrowUpRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { useMarket } from '../contexts/MarketContext'
import { api } from '../../lib/api'
import { MAIN_URL } from '../../lib/constants'
import '../dw-header.css'

/* Cross-domain web app (notifications, AI chat, assessment live there) */
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://deveway-teal.vercel.app'

const NAV_FONT = "var(--font-ui, 'IBM Plex Sans Arabic', sans-serif)"

/* Same markup and classes as the web app's header, so both sites look identical. */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'
  return (
    <button type="button" onClick={() => setTheme(isDark ? 'light' : 'dark')} className="icon-btn" aria-label={label} title={label}>
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {isDark ? (
          <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        )}
      </svg>
    </button>
  )
}

function MarketSwitcher() {
  const tm = useTranslations('market')
  const { market, setMarket } = useMarket()
  return (
    // dir=ltr keeps KSA | EG in the same order in Arabic and English
    <div className="mkt" dir="ltr" role="group" aria-label={tm('switcher')}>
      <button type="button" className={market === 'KSA' ? 'on' : undefined} aria-pressed={market === 'KSA'} title={tm('ksa')} onClick={() => setMarket('KSA')}>KSA</button>
      <button type="button" className={market === 'EG' ? 'on' : undefined} aria-pressed={market === 'EG'} title={tm('eg')} onClick={() => setMarket('EG')}>EG</button>
    </div>
  )
}

function Avatar({
  user,
  size,
}: {
  user: { email?: string; profile?: { firstName?: string; avatar?: string } } | null
  size: 'sm' | 'md'
}) {
  const src = user?.profile?.avatar
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const initial = (user?.profile?.firstName?.trim()?.[0] || user?.email?.trim()?.[0] || '').toUpperCase()
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt={initial || 'avatar'}
        className={`${dim} rounded-full object-cover`}
        style={{ boxShadow: '0 0 0 2px var(--border)' }}
        onError={() => setFailedSrc(src)}
      />
    )
  }

  if (!initial) {
    return (
      <span
        aria-hidden="true"
        className={`${dim} block rounded-full animate-pulse`}
        style={{ background: 'var(--surface-3)' }}
      />
    )
  }

  return (
    <span
      className={`flex ${dim} items-center justify-center rounded-full ${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium select-none`}
      style={{ background: 'var(--primary)', fontFamily: NAV_FONT, color: 'var(--primary-fg)' }}
    >
      {initial}
    </span>
  )
}

/* ════════════════════════════════════════
   User Dropdown (Professional Style)
   ════════════════════════════════════════ */
function UserDropdown({ locale }: { locale: string }) {
  const t = useTranslations('nav')
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)


  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleLogout = () => {
    const currentLocale = locale ?? 'ar'
    window.location.href = `/${currentLocale}/logout`
  }

  const isRtl = locale === 'ar'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full focus:outline-none transition-opacity duration-200 hover:opacity-80"
        aria-label="User menu"
      >
        <Avatar user={user} size="sm" />
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
            <p style={{ fontWeight: 500, fontSize: '14px', color: 'var(--foreground)', margin: 0 }}>
              {user?.profile?.firstName ?? ''} {user?.profile?.lastName ?? ''}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>
              {user?.email}
            </p>
          </div>

          {/* My Courses link */}
          <Link
            href={`${WEB_URL}/${locale}/dashboard/my-courses`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '10px',
              color: 'var(--foreground)', textDecoration: 'none',
              fontSize: '14px', fontWeight: 500,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <BookOpen size={16} />
            {t('my_courses')}
          </Link>

          {/* Back to DeveWay */}
          <a
            href={`${MAIN_URL}/${locale}`}
            onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '10px',
              color: 'var(--foreground)', textDecoration: 'none',
              fontSize: '14px', fontWeight: 500,
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <LayoutDashboard size={16} />
            {t('back_to_deveway')}
          </a>

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
              fontSize: '14px', fontWeight: 500,
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


export function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    hydrate()
    const syncAuth = () => hydrate()
    window.addEventListener('storage', syncAuth)
    window.addEventListener('auth:updated', syncAuth)
    return () => {
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('auth:updated', syncAuth)
    }
  }, [hydrate])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isLoggedIn = mounted && !!token
  const initials = mounted && user?.profile
    ? `${user.profile.firstName?.[0] ?? ''}${user.profile.lastName?.[0] ?? ''}`.toUpperCase()
    : ''

  /* Learn pages stay local; pages that live in the web app link back to it. */
  type NavItem = { key: string; href: string; label: string; external?: boolean }
  const links: NavItem[] = [
    { key: 'careers', href: `${MAIN_URL}/${locale}/careers`, label: t('careers'), external: true },
    { key: 'learners', href: `/${locale}`, label: locale === 'ar' ? 'للمتعلّمين' : 'For Learners' },
    { key: 'mentors', href: `${MAIN_URL}/${locale}/coaching`, label: locale === 'ar' ? 'للمرشدين' : 'For Mentors', external: true },
  ]
  const isActive = (href: string) => pathname === href

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['navbar-notifications-unread'],
    enabled: isLoggedIn,
    queryFn: async () => {
      try {
        const res = await api.get('/notifications')
        const d = (res?.data as any)?.data
        const list = Array.isArray(d) ? d : (d?.notifications ?? [])
        return Array.isArray(list) ? list.filter((n: any) => !n.isRead).length : 0
      } catch {
        return 0
      }
    },
    refetchInterval: 60000,
  })

  const renderLink = (l: NavItem, mobile = false) => {
    const active = !l.external && isActive(l.href)
    const content = (
      <>
        {l.label}
        {l.external && <ArrowUpRight size={12} style={{ opacity: 0.4 }} aria-hidden="true" />}
      </>
    )
    if (mobile) {
      const mobileProps = {
        className: 'rounded-xl px-4 py-3.5 text-[15px] transition-colors duration-150 flex items-center gap-1',
        style: { fontWeight: 500, fontFamily: NAV_FONT, color: active ? 'var(--brand)' : 'var(--foreground)', background: active ? 'var(--surface-2)' : 'transparent' },
        onClick: () => setMobileOpen(false),
      }
      return l.external
        ? <a key={l.key} href={l.href} {...mobileProps}>{content}</a>
        : <Link key={l.key} href={l.href} {...mobileProps}>{content}</Link>
    }
    return l.external
      ? <a key={l.key} href={l.href}>{content}</a>
      : <Link key={l.key} href={l.href} className={active ? 'active' : undefined} aria-current={active ? 'page' : undefined}>{content}</Link>
  }

  return (
    <>
      <header className={`header dw-header${scrolled ? ' scrolled' : ''}`}>
        <div className="wrap">
          <Link href={`/${locale}`} className="logo" aria-label="DeveWay">
            <img className="on-light" src="/logo-wordmark-light.webp" alt="DeveWay" />
            <img className="on-dark" src="/logo-wordmark-dark.webp" alt="" />
          </Link>

          <nav className="nav" aria-label="Main">{links.map((l) => renderLink(l))}</nav>

          <div className="hdr-tools">
            <span className="hide-sm"><SearchBar /></span>
            <MarketSwitcher />
            <LanguageSwitcher />
            <ThemeToggle />

            {mounted && isLoggedIn && (
              <>
                <a
                  href={`${WEB_URL}/${locale}/dashboard/notifications`}
                  className="icon-btn"
                  aria-label="Notifications"
                  title={locale === 'ar' ? 'الإشعارات' : 'Notifications'}
                >
                  <Bell className="icon" />
                  {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </a>
                <a href={`${WEB_URL}/${locale}/dashboard/ai-chat`} title="DeveWay AI" aria-label="DeveWay AI" className="icon-btn hide-sm">
                  <Sparkles className="icon" />
                </a>
                <div className="hidden lg:block">
                  {user?.role === 'ADMIN' ? (
                    <Link href={`/${locale}/admin`} className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-medium">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium" style={{ background: 'var(--error)', fontFamily: NAV_FONT, color: '#fff' }}>
                        {initials || 'A'}
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: 'var(--error-subtle)', color: 'var(--error)', fontFamily: NAV_FONT }}>Admin</span>
                    </Link>
                  ) : (
                    <UserDropdown locale={locale} />
                  )}
                </div>
              </>
            )}

            {mounted && !isLoggedIn && (
              <>
                <Link href={`/${locale}/login`} className="dwh-btn dwh-btn-ghost hide-md">{t('login')}</Link>
                <Link href={`/${locale}/register`} className="dwh-btn dwh-btn-primary hide-sm">{t('register')}</Link>
              </>
            )}

            <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="icon-btn menu-btn" aria-label="Menu" aria-expanded={mobileOpen}>
              {mobileOpen ? <X className="icon" /> : <Menu className="icon" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="dw-menu fixed inset-0 top-[64px] z-[99] lg:hidden overflow-y-auto" style={{ background: 'var(--surface)', borderTop: '1px solid var(--line)' }}>
          <div className="px-4 py-5 space-y-5">
            <nav className="flex flex-col gap-0.5">{links.map((l) => renderLink(l, true))}</nav>

            <div className="flex flex-wrap items-center gap-2 px-1" style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <SearchBar />
            </div>

            {isLoggedIn ? (
              <div className="flex gap-2.5 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
                <a
                  href={`${WEB_URL}/${locale}/dashboard`}
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
                  style={{ background: 'var(--surface-2)', color: 'var(--foreground)', fontFamily: NAV_FONT }}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t('dashboard')}
                </a>
                <button
                  onClick={() => { window.location.href = `/${locale}/logout` }}
                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
                  style={{ color: 'var(--error)', border: '1px solid rgba(239,68,68,0.12)', fontFamily: NAV_FONT }}
                  aria-label={t('logout')}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : mounted ? (
              <div className="flex flex-col gap-2.5 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
                <Link href={`/${locale}/login`} onClick={() => setMobileOpen(false)} className="dwh-btn dwh-btn-ghost w-full">{t('login')}</Link>
                <Link href={`/${locale}/register`} onClick={() => setMobileOpen(false)} className="dwh-btn dwh-btn-primary w-full">{t('register')}</Link>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}
