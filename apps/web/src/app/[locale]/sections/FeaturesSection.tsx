'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { learnUrlWithToken } from '../../../lib/learn-link'

/* ════════════════════════════════════════
   DATA
   ════════════════════════════════════════ */

const FEATURES = [
  {
    id: 1,
    titleKey: 'career_title' as const,
    descKey: 'career_desc' as const,
    ctaKey: 'career_cta' as const,
    href: '/dashboard/assessment',
    isExternal: false,
  },
  {
    id: 2,
    titleKey: 'training_title' as const,
    descKey: 'training_desc' as const,
    ctaKey: 'training_cta' as const,
    href: learnUrlWithToken('/'),
    isExternal: true,
  },
  {
    id: 3,
    titleKey: 'coaching_title' as const,
    descKey: 'coaching_desc' as const,
    ctaKey: 'coaching_cta' as const,
    href: '/dashboard/coaching',
    isExternal: false,
  },
]

/* ════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════ */

export function FeaturesSection() {
  const t = useTranslations('features')
  const locale = useLocale()
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight

  const renderCard = (feature: typeof FEATURES[number], index: number) => {
    const content = (
      <>
        <span className="dw-step-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <h3>{t(feature.titleKey)}</h3>
        <p>{t(feature.descKey)}</p>
        <span className="dw-step-go" role="img" aria-label={t(feature.ctaKey)}>
          <Arrow size={18} aria-hidden="true" />
        </span>
      </>
    )

    return feature.isExternal ? (
      <a key={feature.id} href={feature.href} target="_blank" rel="noopener noreferrer" className="dw-step">
        {content}
      </a>
    ) : (
      <Link key={feature.id} href={feature.href} className="dw-step">
        {content}
      </Link>
    )
  }

  return (
    <section id="features" className="dw-section dw-section-alt">
      <div className="dw-wrap steps">
        <div className="dw-steps-intro">
          <span className="dw-eyebrow">{t('badge')}</span>
          <h2>{t('title')}</h2>
          <p>{t('subtitle')}</p>
        </div>

        {FEATURES.map(renderCard)}
      </div>
    </section>
  )
}
