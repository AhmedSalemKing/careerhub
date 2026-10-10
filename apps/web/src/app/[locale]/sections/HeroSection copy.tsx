'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { TypewriterHero } from '../../components/TypewriterHero'

export function HeroSection() {
  const t = useTranslations('hero')
  const locale = useLocale()
  const { user } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const ctaHref = mounted && user
    ? `/${locale}/dashboard/assessment`
    : `/${locale}/register`

  return (
    <section
      className="relative min-h-[92vh] text-white overflow-hidden"
      style={{ background: '#0D0D0D' }}
    >
      {/* ============================================= */}
      {/* 1. إضافة الشبكة التقنية (Technical Grid) هنا */}
      {/* ============================================= */}
      <div className="hero-grid-pattern"></div>

      {/* Ambient light orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        <div
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full animate-float"
          style={{ background: 'rgba(81,32,200,0.06)', filter: 'blur(100px)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full animate-float"
          style={{ background: 'rgba(43,191,163,0.05)', filter: 'blur(80px)', animationDelay: '2s' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-[92vh] mx-auto max-w-3xl px-4">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm mb-6"
          style={{
            background: 'rgba(248,248,250,0.07)',
            border: '1px solid rgba(248,248,250,0.12)',
            color: 'rgba(248,248,250,0.8)',
          }}
        >
          <Sparkles className="h-4 w-4" style={{ color: '#F5A623' }} />
          <span>{t('badge')}</span>
        </div>

        {/* Heading */}
        <h1
          className="text-4xl sm:text-5xl lg:text-7xl font-bold font-madinet leading-tight animate-fade-up stagger-1"
          style={{ color: '#F8F8FA' }}
        >
          {locale === 'ar' ? (
            <>
              اكتشف مسارك المهني مع{' '}
              <TypewriterHero />
            </>
          ) : (
            <>
              Discover your career path with{' '}
              <TypewriterHero />
            </>
          )}
        </h1>

        {/* Subtext */}
        <p
          className="mt-6 text-lg sm:text-xl max-w-2xl animate-fade-up stagger-2"
          style={{ color: 'rgba(248,248,250,0.65)', fontFamily: 'DM Sans, sans-serif' }}
        >
          {t('subtitle')}
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 animate-fade-up stagger-3">
          <Link href={ctaHref} className="btn-cta-primary">
            <span>{t('cta_primary')}</span>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 text-base font-semibold rounded-xl px-8 py-3.5 transition-all duration-200"
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(248,248,250,0.25)',
              color: '#F8F8FA',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(248,248,250,0.05)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
          >
            {t('cta_secondary')}
          </a>
        </div>

        {/* Stats strip */}
        <div className="mt-12 w-full max-w-2xl animate-fade-up stagger-4">
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl sm:text-3xl font-bold">150+</p>
                <p className="text-sm" style={{ color: 'rgba(248,248,250,0.5)' }}>{t('stat_courses')}</p>
              </div>
              <div style={{ borderLeft: '1px solid rgba(248,248,250,0.1)', borderRight: '1px solid rgba(248,248,250,0.1)' }}>
                <p className="text-2xl sm:text-3xl font-bold">40+</p>
                <p className="text-sm" style={{ color: 'rgba(248,248,250,0.5)' }}>{t('stat_coaches')}</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold">10,000+</p>
                <p className="text-sm" style={{ color: 'rgba(248,248,250,0.5)' }}>{t('stat_students')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}