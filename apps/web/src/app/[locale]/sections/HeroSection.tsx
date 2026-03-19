'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function HeroSection() {
  const t = useTranslations('hero')

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.20),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(99,102,241,0.18),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(245,158,11,0.14),transparent_50%)]" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-full border border-[color:var(--border)] bg-[color-mix(in_oklab,var(--surface),transparent_25%)] px-4 py-2 text-sm font-semibold text-foreground backdrop-blur">
            {t('badge')}
          </div>
          <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t('title')}
          </h1>
          <p className="mt-5 text-pretty text-base text-[color:var(--muted)] sm:text-lg">
            {t('subtitle')}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--primary)]/90"
            >
              {t('cta_primary')}
            </Link>
            <a
              href="#features"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-6 text-sm font-semibold text-foreground hover:bg-[color:var(--surface-2)]"
            >
              {t('cta_secondary')}
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-center">
            <Stat value="150" label={t('stat_courses')} />
            <Stat value="40" label={t('stat_coaches')} />
            <Stat value="10,000" label={t('stat_students')} />
          </div>
        </div>
      </div>
      <div className="pointer-events-none h-10 w-full bg-[linear-gradient(to_bottom,transparent,var(--background))]" />
    </section>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-[color:var(--surface-2)] px-3 py-4">
      <div className="text-xl font-extrabold text-foreground sm:text-2xl">{value}</div>
      <div className="mt-1 text-xs font-semibold text-[color:var(--muted)] sm:text-sm">{label}</div>
    </div>
  )
}

