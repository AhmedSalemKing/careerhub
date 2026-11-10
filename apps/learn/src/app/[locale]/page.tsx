'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { get } from '../../lib/api'
import { syncAuthUser } from '../../lib/auth-sync'
import { useAuthStore } from '../../stores/authStore'

const MAIN_SITE_URL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_MAIN_URL
  return envUrl && envUrl.trim() ? envUrl : 'https://deveway-teal.vercel.app'
})()

type TrackCard = {
  id: string
  slug: string
  title: string
  description: string
  roles: string[]
  salary: string | null
}

function parseSalary(raw: unknown, unit: string, locale: string): string | null {
  try {
    const o = typeof raw === 'string' ? JSON.parse(raw) : raw
    const min = Number((o as any)?.min)
    const max = Number((o as any)?.max)
    if (!isFinite(min) || !isFinite(max) || max <= 0) return null
    // API stores full monthly amounts; the card shows thousands
    const k = (n: number) => (n / 1000).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 1 })
    return `${k(min)} – ${k(max)} ${unit}`
  } catch {
    return null
  }
}

function Arrow({ flip }: { flip: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export default function HomePage() {
  const t = useTranslations('learnHome')
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const authUser = useAuthStore((s) => s.user)
  const authToken = useAuthStore((s) => s.token)

  const [tracks, setTracks] = useState<TrackCard[]>([])
  const [current, setCurrent] = useState<{ title: string; progress: number } | null>(null)

  const assessmentHref = `${MAIN_SITE_URL}/${locale}/dashboard/assessment`

  // Hydrate the user from the token (single-flight helper shared app-wide)
  useEffect(() => {
    if (authUser || !authToken) return
    let cancelled = false
    syncAuthUser().then((user) => {
      if (cancelled || !user) return
      if (user.id || user.email) useAuthStore.getState().setUser(user)
    })
    return () => {
      cancelled = true
    }
  }, [authUser, authToken])

  // Career tracks (same endpoint the main site uses)
  useEffect(() => {
    let cancelled = false
    get('/career/paths')
      .then((res: any) => {
        const d = res?.data
        const arr = d?.data?.careerPaths ?? d?.data ?? d ?? []
        const unit = t('salaryUnit')
        const list: TrackCard[] = (Array.isArray(arr) ? arr : []).slice(0, 6).map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: (isAr ? p.titleAr : p.titleEn) || p.title || '',
          description: (isAr ? p.descriptionAr : p.descriptionEn) || '',
          roles: ((isAr ? p.jobTitlesAr : p.jobTitlesEn) ?? []).slice(0, 3),
          salary: parseSalary(isAr ? p.salaryRangeAr : p.salaryRangeEn, unit, locale),
        }))
        if (!cancelled) setTracks(list)
      })
      .catch(() => {
        if (!cancelled) setTracks([])
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  // Learner progress shown in the hero scene (only for signed-in learners with an enrollment)
  useEffect(() => {
    if (!authUser) {
      setCurrent(null)
      return
    }
    let cancelled = false
    get('/courses/enrolled')
      .then((res: any) => {
        const body = res?.data?.data
        const data = body?.items || body || res?.data || []
        const list = Array.isArray(data) ? data : []
        const first = list[0]
        const course = first?.course || first
        if (!first || !course) return
        const title = (isAr ? course.titleAr : course.titleEn) || course.titleAr || course.titleEn || course.title || ''
        const progress = Math.max(0, Math.min(100, Math.round(Number(first.progress ?? 0) || 0)))
        if (!cancelled) setCurrent({ title, progress })
      })
      .catch(() => {
        if (!cancelled) setCurrent(null)
      })
    return () => {
      cancelled = true
    }
  }, [authUser, isAr])

  const tiles = [1, 2, 3, 4].map((n) => ({ t: t(`tile${n}t`), d: t(`tile${n}d`) }))
  const personas = [1, 2, 3].map((n) => ({ t: t(`persona${n}t`), d: t(`persona${n}d`) }))

  return (
    <main className="dw2-learn" dir={isAr ? 'rtl' : 'ltr'}>
      {/* HERO */}
      <section className="dw2-l-hero">
        <div className="dw2-l-wrap dw2-l-hero-grid">
          <div className="dw2-l-hero-copy">
            <span className="dw2-l-eyebrow">{t('eyebrow')}</span>
            <h1>{t('title')}</h1>
            <p className="dw2-l-lede">{t('lede')}</p>
            <div className="dw2-l-ctas">
              <a className="dw2-l-btn primary" href={assessmentHref}>
                {t('ctaAssessment')}
                <Arrow flip={isAr} />
              </a>
              <Link className="dw2-l-btn ghost" href={`/${locale}/my-courses`}>{t('ctaLearning')}</Link>
            </div>
          </div>
          <div className="dw2-l-scene" role="img" aria-label={t('title')}>
            <span className="dw2-l-orb o1" />
            <span className="dw2-l-orb o2" />
            {current && (
              <div className="dw2-l-duo">
                <span className="dw2-l-duo-ring"><b>{current.progress}%</b></span>
                <div>
                  <p>{t('sceneProgress')}</p>
                  <strong>{current.title}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* TILES */}
      <section className="dw2-l-sec alt">
        <div className="dw2-l-wrap">
          <div className="dw2-l-tiles">
            {tiles.map((x, i) => (
              <div key={i} className="dw2-l-tile">
                <span className="dw2-l-tile-n">{i + 1}</span>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERSONAS */}
      <section className="dw2-l-sec">
        <div className="dw2-l-wrap">
          <div className="dw2-l-head center">
            <span className="dw2-l-eyebrow">{t('personasEyebrow')}</span>
            <h2>{t('personasTitle')}</h2>
          </div>
          <div className="dw2-l-personas">
            {personas.map((x, i) => (
              <a key={i} className="dw2-l-pcard" href={assessmentHref}>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
                <span className="dw2-l-link">{t('startHere')}<Arrow flip={isAr} /></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* TRACKS */}
      {tracks.length > 0 && (
        <section className="dw2-l-sec alt">
          <div className="dw2-l-wrap">
            <div className="dw2-l-head">
              <span className="dw2-l-eyebrow">{t('tracksEyebrow')}</span>
              <h2>{t('tracksTitle')}</h2>
            </div>
            <div className="dw2-l-tracks">
              {tracks.map((p) => (
                <a key={p.id} className="dw2-l-tcard" href={`${MAIN_SITE_URL}/${locale}/careers/${p.slug}`}>
                  <h3>{p.title}</h3>
                  {p.description && <p className="dw2-l-tdesc">{p.description}</p>}
                  {p.roles.length > 0 && (
                    <div className="dw2-l-roles">
                      {p.roles.map((r) => <span key={r}>{r}</span>)}
                    </div>
                  )}
                  {p.salary && (
                    <p className="dw2-l-sal">
                      <span>{t('salaryLabel')}</span>
                      <b>{p.salary}</b>
                    </p>
                  )}
                  <span className="dw2-l-link dw2-l-tfoot">{t('viewTrack')}<Arrow flip={isAr} /></span>
                </a>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <a className="dw2-l-link" href={`${MAIN_SITE_URL}/${locale}/careers`}>{t('tracksAll')}<Arrow flip={isAr} /></a>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
