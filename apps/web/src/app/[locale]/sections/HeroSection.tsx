'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { Sparkles, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { TypewriterHero } from '../../components/TypewriterHero'

export function HeroSection({ siteConfig }: { siteConfig?: Record<string, any> }) {
  const t = useTranslations('hero')
  const th = useTranslations('homeV2')
  const locale = useLocale()
  const { user } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const cfg = siteConfig || {}
  const heroTitle = cfg['hero.title'] || t('title')
  const heroSubtitle = cfg['hero.subtitle'] || t('subtitle')
  const ctaPrimary = cfg['hero.ctaText'] || t('cta_primary')
  const statCourses = cfg['landing.stats.courses']
    ? `${cfg['landing.stats.courses']}+` : '150+'
  const statCoaches = cfg['landing.stats.coaches']
    ? `${cfg['landing.stats.coaches']}+` : '40+'
  const statStudents = cfg['landing.stats.students']
    ? `${cfg['landing.stats.students'].toLocaleString()}+` : '10,000+'

  const ctaHref = mounted && user
    ? `/${locale}/dashboard/assessment`
    : `/${locale}/register`

  // The stat labels in the message files carry a trailing "+" (the value already has one).
  const label = (key: 'stat_courses' | 'stat_coaches' | 'stat_students') => t(key).replace(/\+$/, '')

  const stats = [
    { value: statCourses, label: label('stat_courses') },
    { value: statCoaches, label: label('stat_coaches') },
    { value: statStudents, label: label('stat_students') },
  ]

  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight

  return (
    <section className="dw-hero">
      {/* Background: purple blobs + dotted grid */}
      <div className="dw-blob dw-blob-1" aria-hidden="true" />
      <div className="dw-blob dw-blob-2" aria-hidden="true" />
      <div className="dw-dots" aria-hidden="true" />

      <div className="dw-wrap dw-hero-grid">
        <div className="dw-hero-copy">
          <span className="dw-eyebrow">
            <Sparkles size={14} aria-hidden="true" />
            {t('badge')}
          </span>

          <h1>
            <span>{heroTitle}</span>
            <span className="dw-hero-brand">
              <TypewriterHero />
            </span>
          </h1>

          <p className="dw-hero-sub">{heroSubtitle}</p>

          <div className="dw-hero-actions">
            <Link href={ctaHref} className="btn btn-primary">
              <span>{ctaPrimary}</span>
              <Arrow size={18} aria-hidden="true" />
            </Link>

            <a href="#features" className="btn btn-ghost">
              {t('cta_secondary')}
            </a>
          </div>

          <p className="dw-hero-note">
            <Check size={14} aria-hidden="true" /> {th('heroNote')}
          </p>

          <div className="dw-stats">
            {stats.map((s) => (
              <div key={s.label} className="dw-stat">
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Illustrative product mockup (sample content, not live data) */}
        <div className="dw-collage" aria-hidden="true">
          <div className="dw-collage-visual">
            <div className="cv-logo">DeveWay</div>
            <div className="cv-tracks">
              {['Frontend', 'Cyber Security', 'Data Science', 'AI Engineer', 'Full Stack', 'Mobile'].map((n) => (
                <span key={n}>{n}</span>
              ))}
            </div>
          </div>
          <div className="dw-collage-ring" />

          <div className="dw-float dw-f-ai">
            <div className="dw-ring-wrap">
              <svg className="dw-ring-svg" viewBox="0 0 56 56">
                <defs>
                  <linearGradient id="dw-rg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" style={{ stopColor: 'var(--brand)' }} />
                    <stop offset="100%" style={{ stopColor: 'var(--lavender)' }} />
                  </linearGradient>
                </defs>
                <circle className="bg" cx="28" cy="28" r="22" />
                <circle className="fg" cx="28" cy="28" r="22" />
              </svg>
              <b>87%</b>
            </div>
            <div className="dw-f-ai-info">
              <p>{th('aiLabel')}</p>
              <strong>{th('aiTrack')}</strong>
              <p className="dw-f-ai-why">{th('aiWhy')}</p>
            </div>
          </div>

          <div className="dw-float dw-f-track">
            <div className="dw-f-track-label">{th('trackLabel')}</div>
            <div className="dw-f-track-title">{th('trackNext')}</div>
            <div className="bar"><span /></div>
          </div>

          <div className="dw-float dw-f-live">
            <span className="dw-live-dot" />
            <div>
              <div className="dw-f-track-label">{th('liveLabel')}</div>
              <div className="dw-f-track-title">{th('liveTitle')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
