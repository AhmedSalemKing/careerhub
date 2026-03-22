'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { TRAINING_URL } from '../../../lib/constants'

export function FeaturesSection() {
  const t = useTranslations('features')
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{t('title')}</h2>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        <FeatureCard
          title={t('career_title')}
          desc={t('career_desc')}
          cta={<Link href="/register" className="font-semibold text-primary hover:underline">ابدأ / Start</Link>}
        />
        <FeatureCard
          title={t('training_title')}
          desc={t('training_desc')}
          cta={
            // ⚠️ LEGAL: External link — Saudi e-learning licensing
            <a
              href={TRAINING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              التدريب / Training ↗
            </a>
          }
        />
        <FeatureCard
          title={t('coaching_title')}
          desc={t('coaching_desc')}
          cta={<Link href="/coaches" className="font-semibold text-primary hover:underline">احجز / Book</Link>}
        />
      </div>
    </section>
  )
}

function FeatureCard({
  title,
  desc,
  cta,
}: {
  title: string
  desc: string
  cta: React.ReactNode
}) {
  return (
    <div className="group rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
      <div className="text-lg font-bold text-foreground">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{desc}</p>
      <div className="mt-4">{cta}</div>
    </div>
  )
}

