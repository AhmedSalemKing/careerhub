'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowLeft, ArrowRight, Compass, Map, GraduationCap, Rocket, Users, FileText, Target } from 'lucide-react'
import { CharacterScene, CharacterAvatar } from '../../components/CharacterDuo'
import type { CharacterId } from '../../components/characters'

/* Role names scrolling in the strip (translated) */
export function MarqueeStrip() {
  const t = useTranslations('homeV2')
  const roles = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8'] as const
  // Rendered twice so translating by -50% loops seamlessly.
  const loop = [...roles, ...roles]

  return (
    <div className="dw-strip" aria-hidden="true">
      <div className="dw-marquee">
        {loop.map((k, i) => (
          <span key={`${k}-${i}`}>
            <span className="dot" />
            {t(k)}
          </span>
        ))}
      </div>
    </div>
  )
}

/* 4-step "how it works" */
export function StepsSection() {
  const t = useTranslations('homeV2')
  const steps = [
    { n: 1, Icon: Compass, title: t('s1_title'), desc: t('s1_desc') },
    { n: 2, Icon: Map, title: t('s2_title'), desc: t('s2_desc') },
    { n: 3, Icon: GraduationCap, title: t('s3_title'), desc: t('s3_desc') },
    { n: 4, Icon: Rocket, title: t('s4_title'), desc: t('s4_desc') },
  ]

  return (
    <section className="dw-section">
      <div className="dw-wrap">
        <div className="dw-head" style={{ marginInline: 'auto', textAlign: 'center' }}>
          <span className="dw-eyebrow">{t('stepsEyebrow')}</span>
          <h2>{t('stepsTitle')}</h2>
          <p>{t('stepsLede')}</p>
        </div>
        <div className="dw-flow">
          {steps.map(({ n, Icon, title, desc }) => (
            <div className="dw-flow-step" key={n}>
              <div className="dw-flow-ic">
                <Icon size={28} aria-hidden="true" />
                <span className="dw-flow-n">{n}</span>
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* Three career moments: persona cards with an illustrated duo */
const PERSONA_CAST: readonly (readonly CharacterId[])[] = [
  ['sa2', 'eg1'], // students and new graduates
  ['eg2', 'sa3'], // career changers
  ['sa1', 'eg3'], // professionals
]

export function MomentsSection() {
  const t = useTranslations('homeV2')
  const locale = useLocale()
  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight
  const items = [
    { title: t('m1_title'), desc: t('m1_desc') },
    { title: t('m2_title'), desc: t('m2_desc') },
    { title: t('m3_title'), desc: t('m3_desc') },
  ]

  return (
    <section className="dw-section dw-section-alt">
      <div className="dw-wrap">
        <div className="dw-head" style={{ marginInline: 'auto', textAlign: 'center' }}>
          <span className="dw-eyebrow">{t('momentsEyebrow')}</span>
          <h2>{t('momentsTitle')}</h2>
        </div>
        <div className="dw-personas">
          {items.map(({ title, desc }, i) => (
            <Link key={title} href={`/${locale}/register`} className="dw-pcard">
              <CharacterScene
                ids={PERSONA_CAST[i]}
                label={title}
                flagSa={t('flagSa')}
                flagEg={t('flagEg')}
                top
              />
              <div className="dw-p-body">
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="dw-p-cta">
                  {t('momentsCta')}
                  <Arrow size={16} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* Coaching formats: split layout with an illustrated mentor + learner */
export function CoachingSection() {
  const t = useTranslations('homeV2')
  const locale = useLocale()
  const items = [
    { Icon: Users, title: t('c1_title'), desc: t('c1_desc') },
    { Icon: FileText, title: t('c2_title'), desc: t('c2_desc') },
    { Icon: Target, title: t('c3_title'), desc: t('c3_desc') },
  ]

  return (
    <section className="dw-section">
      <div className="dw-wrap dw-split">
        <div className="dw-split-media">
          <CharacterScene
            ids={['sa5', 'eg7']}
            label={t('coachIllus')}
            flagSa={t('flagSa')}
            flagEg={t('flagEg')}
          />
          <div className="dw-float dw-f-coach">
            <CharacterAvatar id="sa5" size={40} />
            <div>
              <div className="dw-f-track-label">{t('liveLabel')}</div>
              <div className="dw-f-track-title">{t('liveTitle')}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="dw-head" style={{ marginBottom: 18 }}>
            <span className="dw-eyebrow">{t('coachEyebrow')}</span>
            <h2>{t('coachTitle')}</h2>
            <p>{t('coachLede')}</p>
          </div>
          <div className="dw-feat-list">
            {items.map(({ Icon, title, desc }) => (
              <div className="dw-feat" key={title}>
                <span className="dw-feat-ic"><Icon size={22} aria-hidden="true" /></span>
                <div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <Link href={`/${locale}/coaching`} className="btn btn-primary">
              {t('coachCta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
