'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useAuthStore } from '../../stores/authStore'

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  const locale = useLocale() as 'ar' | 'en'
  const nav = useTranslations('adminNav')
  const logout = useAuthStore((s) => s.logout)

  const base = `/${locale}/admin`

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-e border-[color:var(--border)] bg-[color:var(--surface)] md:block">
        <div className="flex h-full flex-col p-4">
          <div className="text-xs font-bold text-[color:var(--muted)]">{nav('title')}</div>
          <nav className="mt-3 space-y-1">
            <Item href={`${base}`} label={nav('dashboard')} />
            <Item href={`${base}/users`} label={nav('users')} />
            <Item href={`${base}/courses`} label={nav('courses')} />
            <Item href={`${base}/coaches`} label={nav('coaches')} />
            <Item href={`${base}/sessions`} label={nav('sessions')} />
            <Item href={`${base}/payments`} label={nav('payments')} />
            <Item href={`${base}/certificates`} label={nav('certificates')} />
            <Item href={`${base}/analytics`} label={nav('analytics')} />
          </nav>

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

      <div className="min-w-0 flex-1">
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{title}</h1>
            {subtitle ? <p className="text-sm text-[color:var(--muted)]">{subtitle}</p> : null}
          </div>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
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

