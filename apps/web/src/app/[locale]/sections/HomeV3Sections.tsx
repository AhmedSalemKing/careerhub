'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useAuthStore } from '../../../stores/authStore'
import { CharacterAvatar } from '../../components/CharacterDuo'
import type { CharacterId } from '../../components/characters'

function GoArrow() {
  return (
    <svg
      className="icon go flip"
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

/* Adds class "in" to .rv elements as they enter the viewport. */
export function RevealOnScroll() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    const seen = new WeakSet<Element>()
    const scan = () =>
      document.querySelectorAll('.rv:not(.in)').forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el)
          io.observe(el)
        }
      })
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      mo.disconnect()
      io.disconnect()
    }
  }, [])
  return null
}

function SecHead({
  eyebrow,
  title,
  lede,
  center,
}: {
  eyebrow: string
  title: string
  lede?: string
  center?: boolean
}) {
  return (
    <div className={`sec-head${center ? ' center' : ''} rv`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="h2">{title}</h2>
      {lede && <p className="lede">{lede}</p>}
    </div>
  )
}

/* 3. #how */
export function HowSection() {
  const t = useTranslations('homeV3')
  const steps = [1, 2, 3, 4] as const
  return (
    <section id="how" className="sec">
      <div className="wrap">
        <SecHead eyebrow={t('how.eyebrow')} title={t('how.title')} center />
        <div className="steps">
          {steps.map((n) => (
            <div key={n} className="rv">
              <div className="step-num">{n}</div>
              <div className="step-title">{t(`how.step${n}.title`)}</div>
              <div className="step-body">{t(`how.step${n}.body`)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 4. #tracks */
const TRACKS = [
  { title: 'Frontend Developer', levelKey: 'beginner_intermediate', months: '4–6', skills: ['HTML / CSS', 'JavaScript', 'React'] },
  { title: 'Full Stack Developer', levelKey: 'intermediate_advanced', months: '6–8', skills: ['Frontend', 'Backend', 'Deployment'] },
  { title: 'Data Science', levelKey: 'intermediate', months: '6', skills: ['Python', 'Pandas', 'Visualization'] },
  { title: 'Cyber Security', levelKey: 'intermediate_advanced', months: '6–9', skills: ['Networking', 'Linux', 'Ethical Hacking'] },
  { title: 'AI Engineer', levelKey: 'advanced', months: '8–12', skills: ['Deep Learning', 'NLP', 'LLMs'] },
  { title: 'Mobile Developer', levelKey: 'beginner_intermediate', months: '5', skills: ['Flutter', 'React Native', 'Android'] },
] as const

export function TracksSection() {
  const t = useTranslations('homeV3')
  const tp = useTranslations('careerPaths')
  const locale = useLocale()
  return (
    <section id="tracks" className="sec sec-alt">
      <div className="wrap">
        <SecHead eyebrow={t('careers.eyebrow')} title={t('careers.title')} lede={t('careers.lede')} />
        <div className="paths">
          {TRACKS.map((p) => (
            <Link key={p.title} href={`/${locale}/dashboard/assessment`} className="card rv">
              <div className="card-title">{p.title}</div>
              <div className="card-meta">
                {tp(p.levelKey)} · {p.months} {tp('months')}
              </div>
              <div className="roles">
                {p.skills.map((s) => (
                  <span key={s} className="pill">{s}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 5. moments */
const MOMENT_CAST: readonly (readonly CharacterId[])[] = [
  ['sa2', 'eg1'],
  ['eg2', 'sa3'],
  ['sa1', 'eg3'],
]

export function MomentsV3Section() {
  const t = useTranslations('homeV3')
  const locale = useLocale()
  return (
    <section className="sec">
      <div className="wrap">
        <SecHead eyebrow={t('moments.eyebrow')} title={t('moments.title')} center />
        <div className="moments">
          {[1, 2, 3].map((n, i) => (
            <div key={n} className="moment-card rv">
              <div className="moment-flag">
                {MOMENT_CAST[i].map((id) => (
                  <CharacterAvatar key={id} id={id} size={34} />
                ))}
              </div>
              <div className="moment-title">{t(`moments.card${n}.title`)}</div>
              <div className="moment-body">{t(`moments.card${n}.body`)}</div>
              <Link href={`/${locale}/dashboard/assessment`} className="btn btn-ghost" style={{ marginTop: 16 }}>
                {t(`moments.card${n}.cta`)}
                <GoArrow />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 6. why / AI reasoning */
export function WhySection() {
  const t = useTranslations('homeV3')
  const th = useTranslations('homeV2')
  const locale = useLocale()
  const { token } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const href = mounted && token ? `/${locale}/dashboard/assessment` : `/${locale}/register`
  const bars = [
    { k: 'interests', v: 92 },
    { k: 'skills', v: 84 },
    { k: 'market', v: 85 },
  ] as const
  return (
    <section className="sec sec-alt">
      <div className="wrap why">
        <div>
          <SecHead eyebrow={t('why.eyebrow')} title={t('why.title')} lede={t('why.lede')} />
          <Link href={href} className="btn btn-primary rv" style={{ marginTop: 24 }}>
            {t('why.cta')}
            <GoArrow />
          </Link>
        </div>
        <div className="why-card rv">
          <div className="match-score">87%</div>
          <div className="match-label">{th('aiLabel')} · {t('why.sample')}</div>
          <div className="match-title">{th('aiTrack')}</div>
          <div className="match-bars">
            {bars.map(({ k, v }) => (
              <div key={k} className="bar-row">
                <span style={{ minWidth: 96 }}>{t(`why.bar.${k}`)}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${v}%` }} /></div>
                <span>{v}%</span>
              </div>
            ))}
          </div>
          <div className="match-reasons">
            {[1, 2, 3].map((n) => (
              <div key={n} className="reason">{t(`why.reason${n}`)}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* 7. mentors */
export function MentorsSection() {
  const t = useTranslations('homeV3')
  const locale = useLocale()
  return (
    <section className="sec">
      <div className="wrap split">
        <div>
          <SecHead eyebrow={t('mentors.eyebrow')} title={t('mentors.title')} lede={t('mentors.lede')} />
          <div className="rv" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 24 }}>
            <Link href={`/${locale}/coaching`} className="btn btn-ghost">
              {t('mentors.joinCta')}
            </Link>
            <span className="pill">{t('mentors.comingSoon')}</span>
          </div>
        </div>
        <div className="mentor-types">
          {[1, 2, 3].map((n) => (
            <div key={n} className="mentor-type rv">
              <div className="mentor-type-title">{t(`mentors.type${n}.title`)}</div>
              <div className="mentor-type-body">{t(`mentors.type${n}.body`)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 9. regions */
export function RegionsSection() {
  const t = useTranslations('homeV3')
  return (
    <section className="sec">
      <div className="wrap">
        <SecHead eyebrow={t('regions.eyebrow')} title={t('regions.title')} center />
        <div className="regions">
          {(['sa', 'eg'] as const).map((r) => (
            <div key={r} className="region-card rv">
              <div className="region-title">{t(`regions.${r}.title`)}</div>
              <div className="region-body">{t(`regions.${r}.body`)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* 10. CTA band */
export function CtaBandSection() {
  const t = useTranslations('homeV3')
  const locale = useLocale()
  const { token } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const href = mounted && token ? `/${locale}/dashboard/assessment` : `/${locale}/register`
  return (
    <section className="sec" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="cta-band rv">
          <h2>{t('cta.title')}</h2>
          <p>{t('cta.lede')}</p>
          <div className="hero-ctas">
            <Link href={href} className="btn btn-light">
              {t('cta.primary')}
              <GoArrow />
            </Link>
            <Link href={`/${locale}/careers`} className="btn btn-outline-light">
              {t('cta.secondary')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
