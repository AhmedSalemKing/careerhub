'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function PricingPage() {
  const t = useTranslations('pricing')
  const c = useTranslations('common')

  const plans = [
    { id: 'starter', name: t('starter_name'), price: t('starter_price'), desc: t('starter_desc'), items: [t('starter_i1'), t('starter_i2'), t('starter_i3')] },
    { id: 'pro', name: t('pro_name'), price: t('pro_price'), desc: t('pro_desc'), items: [t('pro_i1'), t('pro_i2'), t('pro_i3')] },
    { id: 'team', name: t('team_name'), price: t('team_price'), desc: t('team_desc'), items: [t('team_i1'), t('team_i2'), t('team_i3')] },
  ] as const

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{t('title')}</h1>
        <p className="mt-3 text-sm text-[color:var(--muted)] sm:text-base">{t('subtitle')}</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
            <div className="text-sm font-bold text-foreground">{p.name}</div>
            <div className="mt-2 text-2xl font-extrabold text-foreground">{p.price}</div>
            <div className="mt-2 text-sm text-[color:var(--muted)]">{p.desc}</div>
            <ul className="mt-5 space-y-2 text-sm text-foreground">
              {p.items.map((it) => (
                <li key={it} className="flex items-start gap-2">
                  <span aria-hidden className="mt-0.5 text-primary">
                    G£ô
                  </span>
                  <span className="text-[color:var(--muted)]">{it}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90"
              >
                {t('cta')}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <div className="text-sm font-bold text-foreground">{t('faq_title')}</div>
        <div className="mt-3 space-y-3 text-sm text-[color:var(--muted)]">
          <p>{t('faq_1')}</p>
          <p>{t('faq_2')}</p>
          <p>{t('faq_3')}</p>
        </div>
        <div className="mt-5">
          <Link href="/coaches" className="text-sm font-semibold text-primary hover:underline">
            {c('view')}
          </Link>
        </div>
      </div>
    </div>
  )
}

