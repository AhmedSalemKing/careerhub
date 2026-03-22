'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { TRAINING_URL } from '../../lib/constants'
import { LanguageSwitcher } from './LanguageSwitcher'
import { cn } from './ui/cn'

export function Navbar() {
  const t = useTranslations('nav')
  const c = useTranslations('common')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = useMemo(
    () => [
      { href: '/careers', label: t('careers') },
      { href: '/coaches', label: t('coaches') },
      { href: '/pricing', label: t('pricing') },
    ],
    [t],
  )

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-colors',
        scrolled
          ? 'border-[color:var(--border)] bg-[color-mix(in_oklab,var(--surface),transparent_35%)] backdrop-blur'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group inline-flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              CareerHub
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-[color:var(--muted)] hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}

          {/* ⚠️ LEGAL: External link — Saudi e-learning licensing */}
          <a
            href={TRAINING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-foreground hover:text-primary"
          >
            {t('training')} ↗
          </a>

          {/* Fixed courses link to point to learn app */}
          <Link
            href="/courses"
            className="text-sm font-semibold text-foreground hover:text-primary"
          >
            {t('courses')}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-foreground hover:bg-[color:var(--surface-2)] md:inline-flex"
          >
            {t('login')}
          </Link>
          <Link
            href="/register"
            className="hidden rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-[color:var(--primary)]/90 md:inline-flex"
          >
            {t('register')}
          </Link>
        </div>
      </div>
    </header>
  )
}

function ThemeToggle() {
  const c = useTranslations('common')
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => 'light')

  useEffect(() => {
    setMounted(true)
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  if (!mounted) return <div className="h-9 w-9" />

  return (
    <button
      type="button"
      aria-label={c('toggle_theme')}
      onClick={() => {
        const next = theme === 'dark' ? 'light' : 'dark'
        setTheme(next)
        document.documentElement.classList.toggle('dark', next === 'dark')
      }}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] text-sm hover:bg-[color:var(--surface-2)]"
    >
      {theme === 'dark' ? '☾' : '☀'}
    </button>
  )
}
