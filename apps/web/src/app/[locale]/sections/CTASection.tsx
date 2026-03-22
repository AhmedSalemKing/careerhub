'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function CTASection() {
  const t = useTranslations('cta')

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-[color:var(--border)] bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 p-8 shadow-sm sm:p-12">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{t('title')}</h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)] sm:text-base">{t('subtitle')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow hover:bg-primary/90"
            >
              {t('primary')}
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-3 text-sm font-bold text-foreground hover:bg-[color:var(--surface-2)]"
            >
              {t('secondary')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

