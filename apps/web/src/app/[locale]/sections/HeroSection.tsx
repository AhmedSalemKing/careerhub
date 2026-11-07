'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { CharacterScene, CharacterAvatar, CharacterCast, RasheedAvatar } from '../../components/CharacterDuo'

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

  const ctaHref = mounted && user
    ? `/${locale}/dashboard/assessment`
    : `/${locale}/register`

  return (
    <section className="dw-hero">
      <div className="dw-hero-bg" aria-hidden="true">
        <span className="dots" />
        <span className="dw-blob dw-blob-1" />
        <span className="dw-blob dw-blob-2" />
      </div>

      <div className="dw-wrap dw-hero-grid">
        <div className="dw-hero-copy">
          <span className="dw-eyebrow">{t('badge')}</span>

          <h1>
            {heroTitle}
            <span className="grad">{t('title2')}</span>
          </h1>

          <p className="dw-hero-sub">{heroSubtitle}</p>

          <div className="dw-hero-actions">
            <Link href={ctaHref} className="btn btn-primary">
              {ctaPrimary}
              <ArrowRight className="go flip" size={18} aria-hidden="true" />
            </Link>

            <Link href={`/${locale}/careers`} className="btn btn-ghost">
              {t('cta_secondary')}
            </Link>
          </div>

          <p className="dw-hero-note">
            <CharacterCast ids={['sa2', 'eg1', 'sa4', 'eg3']} size={34} />
            <span>{th('heroNote')}</span>
          </p>
        </div>

        {/* Illustrated collage (sample content, not live data) */}
        <div className="dw-collage" aria-hidden="true">
          <span className="dw-collage-ring" />

          <div className="dw-collage-main">
            <CharacterScene
              ids={['sa2', 'eg1']}
              label={th('heroIllus')}
              flagSa={th('flagSa')}
              flagEg={th('flagEg')}
            />
          </div>
          <div className="dw-collage-side">
            <CharacterScene ids={['eg3']} label={th('heroIllus')} flagEg={th('flagEg')} />
          </div>

          <div className="dw-float dw-f-ai">
            <div className="dw-ring-wrap">
              <svg className="dw-ring-svg" viewBox="0 0 56 56">
                <defs>
                  <linearGradient id="dw-rg" x1="0" y1="0" x2="1" y2="1">
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
              <p className="dw-r-line">
                <RasheedAvatar size={18} />
                {th('aiLabel')}
              </p>
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
            <CharacterAvatar id="sa7" size={34} />
          </div>
        </div>
      </div>
    </section>
  )
}
