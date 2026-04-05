'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useAuthStore } from '../../../stores/authStore' // ✅ تصحيح المسار

export function CTASection() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('cta')
  const token = useAuthStore((s) => s.token)

  // إخفاء القسم بالكامل إذا كان المستخدم مسجل الدخول
  if (token) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12" style={{ background: '#0D0D0D', border: '1px solid rgba(81,32,200,0.2)' }}>
        <div className="relative max-w-2xl">
          <h2 style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(22px, 3vw, 32px)',
            letterSpacing: '-0.02em',
            color: '#F8F8FA',
          }}>
            {t('title')}
          </h2>
          <p className="mt-3 text-sm leading-6 sm:text-base" style={{ color: 'rgba(248,248,250,0.65)', fontFamily: 'DM Sans, sans-serif' }}>
            {t('subtitle')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/${locale}/register`} className="btn-primary" style={{ fontSize: 15, padding: '12px 28px', fontFamily: "'PingARLT', 'Cairo', sans-serif", fontWeight: 900 }}>
              {t('primary')}
            </Link>
            <Link href={`/${locale}/careers`} className="btn-secondary" style={{ color: '#F8F8FA', borderColor: 'rgba(248,248,250,0.3)', fontSize: 15, padding: '12px 28px' }}>
              {t('secondary')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}