'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useAuthStore } from '../../../stores/authStore'
import { Rocket, ArrowLeft, ArrowRight } from 'lucide-react'

export function CTASection() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('cta')
  const token = useAuthStore((s) => s.token)
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight

  // Hide section entirely if user is logged in
  if (token) return null

  return (
    <section className="dw-cta-section">
      <div className="dw-wrap">
        <div className="dw-cta">
          <span className="dw-eyebrow">
            <Rocket size={14} aria-hidden="true" />
            {t('badge')}
          </span>

          <h2>{t('title')}</h2>

          <p>{t('subtitle')}</p>

          <div className="dw-hero-actions">
            <Link href={`/${locale}/register`} className="btn btn-primary">
              {t('primary')}
              <Arrow size={18} aria-hidden="true" />
            </Link>

            <Link href={`/${locale}/careers`} className="btn btn-ghost">
              {t('secondary')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
