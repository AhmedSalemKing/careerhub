'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { TRAINING_URL } from '../../../lib/constants'

export function HowItWorksSection() {
  const t = useTranslations('how')

  const steps = [
    { id: 1, icon: '📝', title: t('step1_title'), desc: t('step1_desc'), href: '/register', external: false },
    { id: 2, icon: '🧠', title: t('step2_title'), desc: t('step2_desc'), href: '/dashboard/assessment', external: false },
    { id: 3, icon: '🎯', title: t('step3_title'), desc: t('step3_desc'), href: '/careers', external: false },
    // ⚠️ LEGAL: External link — Saudi e-learning licensing
    { id: 4, icon: '📚', title: t('step4_title'), desc: t('step4_desc'), href: TRAINING_URL, external: true },
    { id: 5, icon: '🎓', title: t('step5_title'), desc: t('step5_desc'), href: '/coaches', external: false },
    { id: 6, icon: '🏆', title: t('step6_title'), desc: t('step6_desc'), href: '/dashboard/certificates', external: false },
  ] as const

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{t('title')}</h2>
        <p className="max-w-2xl text-sm text-[color:var(--muted)] sm:text-base">{t('subtitle')}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--surface-2)] text-xl">
                {s.icon}
              </div>
              <div>
                <div className="text-base font-bold text-foreground">{s.title}</div>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{s.desc}</p>
              </div>
            </div>

            <div className="mt-4">
              {s.external ? (
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {t('cta')} ↗
                </a>
              ) : (
                <Link href={s.href} className="text-sm font-semibold text-primary hover:underline">
                  {t('cta')}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

