'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { TypewriterHero } from '../../components/TypewriterHero'

export function HeroSection({ siteConfig }: { siteConfig?: Record<string, any> }) {
  const t = useTranslations('hero')
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

      <div className="dw-wrap dw-hero-inner">
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

        <div className="dw-stats">
          {stats.map((s) => (
            <div key={s.label} className="dw-stat">
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
