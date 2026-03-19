'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { TRAINING_URL } from '../../lib/constants'
import { useAuthStore } from '../../stores/authStore'

export function DashboardSidebar() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('dashboard')
  const nav = useTranslations('nav')
  const logout = useAuthStore((s) => s.logout)

  const base = `/${locale}/dashboard`

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-e border-[color:var(--border)] bg-[color:var(--surface)] md:block">
      <div className="flex h-full flex-col p-4">
        <div className="text-xs font-bold text-[color:var(--muted)]">{nav('dashboard')}</div>
        <nav className="mt-3 space-y-1">
          <Item href={`${base}`} label={t('overview')} />
          <Item href={`${base}/assessment`} label={t('start_assessment')} />
          <Item href={`${base}/career-path`} label={t('my_career')} />
          <Item href={`${base}/coaching`} label={t('coaching')} />
          <Item href={`${base}/certificates`} label={t('certificates')} />
          <Item href={`${base}/notifications`} label={t('notifications')} />
          <Item href={`${base}/settings`} label={t('settings')} />
        </nav>

        <div className="mt-6 text-xs font-bold text-[color:var(--muted)]">{t('courses')}</div>
        <div className="mt-2">
          {/* ⚠️ LEGAL: External training link only */}
          <a
            href={TRAINING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-semibold text-foreground hover:bg-[color:var(--surface-2)]"
          >
            {t('courses')} ↗
          </a>
        </div>

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-bold text-foreground hover:bg-[color:var(--surface-2)]"
          >
            {nav('logout')}
          </button>
        </div>
      </div>
    </aside>
  )
}

function Item({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl px-3 py-2 text-sm font-semibold text-[color:var(--muted)] hover:bg-[color:var(--surface-2)] hover:text-foreground"
    >
      {label}
    </Link>
  )
}

