'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { get } from '../../lib/api'
import { syncAuthUser } from '../../lib/auth-sync'
import { CHARS } from '../../lib/characters'
import { formatCoursePrice } from '../../lib/market'
import { instructorDisplayName } from '../../lib/instructor'
import { useAuthStore } from '../../stores/authStore'

const MAIN_SITE_URL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_MAIN_URL
  return envUrl && envUrl.trim() ? envUrl : 'https://deveway-teal.vercel.app'
})()

/* icon paths copied from the reference */
const ICON = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15.5 8.5l-2 5-5 2 2-5 5-2Z',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 17h7.5a3.5 3.5 0 0 0 0-7h-7a3.5 3.5 0 0 1 0-7H16',
  mentor: 'M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2 20a6 6 0 0 1 12 0M15 4h6v5h-3l-3 2V4Z',
} as const

function Icon({ name, flip, className }: { name: keyof typeof ICON; flip?: boolean; className?: string }) {
  return (
    <svg className={`icon${className ? ` ${className}` : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <path d={ICON[name]} />
    </svg>
  )
}

/* Two illustrated characters side by side (same markup as the reference `scene()`) */
function Scene({ ids, cls = '', label, ksa, eg, children }: { ids: string[]; cls?: string; label: string; ksa: string; eg: string; children?: React.ReactNode }) {
  return (
    <div className={`ph scene ${cls}`} role="img" aria-label={label}>
      <span className="sc-orb o1" />
      <span className="sc-orb o2" />
      <div className={`duo n${ids.length}`}>
        {ids.map((id, i) => (
          <span key={id} className="duo-p" style={{ ['--i' as string]: i } as React.CSSProperties}>
            <span className="char-wrap" dangerouslySetInnerHTML={{ __html: CHARS[id] ?? '' }} />
            <em className={`duo-flag ${id.startsWith('sa') ? 'sa' : 'eg'}`}>{id.startsWith('sa') ? ksa : eg}</em>
          </span>
        ))}
      </div>
      {children}
    </div>
  )
}

/* Progress ring: 56px, stroke 6 -> r = 25, circumference 157.08 */
function Ring({ pct, size = 56, stroke = 6 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const len = 2 * Math.PI * r
  return (
    <span className="ring-wrap" style={{ width: size, height: size }}>
      <svg className="ring-svg" viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--ring-a)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ring-b)' }} />
          </linearGradient>
        </defs>
        <circle className="bg" cx={size / 2} cy={size / 2} r={r} style={{ strokeWidth: stroke }} />
        <circle
          className="fg"
          cx={size / 2}
          cy={size / 2}
          r={r}
          style={{ strokeWidth: stroke, strokeDasharray: len, strokeDashoffset: len * (1 - pct / 100), ['--len' as string]: len } as React.CSSProperties}
        />
      </svg>
      <b>{pct}%</b>
    </span>
  )
}

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
    const k = (n: number) => (n / 1000).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 1 })
    return `${k(min)} – ${k(max)} ${unit}`
  } catch {
    return null
  }
}

const PERSONA_CAST: string[][] = [['sa2', 'eg1'], ['eg2', 'sa3'], ['sa1', 'eg3']]
const TILE_ICONS: (keyof typeof ICON)[] = ['compass', 'eye', 'route', 'mentor']

export default function HomePage() {
  const t = useTranslations('learnHome')
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const authUser = useAuthStore((s) => s.user)
  const authToken = useAuthStore((s) => s.token)

  const [tracks, setTracks] = useState<TrackCard[]>([])
  const [tracksLoaded, setTracksLoaded] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [current, setCurrent] = useState<{ title: string; progress: number } | null>(null)

  const assessmentHref = `${MAIN_SITE_URL}/${locale}/dashboard/assessment`

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
        const list: TrackCard[] = (Array.isArray(arr) ? arr : []).slice(0, 3).map((p: any) => ({
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
      .finally(() => {
        if (!cancelled) setTracksLoaded(true)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale])

  // Latest courses preview (same endpoint as the courses page)
  useEffect(() => {
    let cancelled = false
    get('/courses', { params: { limit: 6, type: 'recorded' } })
      .then((res: any) => {
        const d = res?.data?.data?.courses ?? res?.data?.data ?? res?.data?.courses ?? []
        if (!cancelled) setCourses(Array.isArray(d) ? d.slice(0, 6) : [])
      })
      .catch(() => {
        if (!cancelled) setCourses([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Signed-in learners see their own progress in the hero card
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

  const ksa = t('flagKsa')
  const eg = t('flagEg')
  const tiles = [1, 2, 3, 4].map((n) => ({ t: t(`tile${n}t`), d: t(`tile${n}d`) }))
  const personas = [1, 2, 3].map((n) => ({ t: t(`persona${n}t`), d: t(`persona${n}d`) }))

  return (
    <main className="dw2-learn" dir={isAr ? 'rtl' : 'ltr'}>
      {/* HERO */}
      <section className="phero">
        <div className="hero-bg">
          <span className="dots" />
          <span className="b1" />
          <span className="b2" />
        </div>
        <div className="wrap phero-grid">
          <div className="phero-copy">
            <span className="eyebrow">{t('eyebrow')}</span>
            <h1>{t('title')}</h1>
            <p className="lede">{t('lede')}</p>
            <div className="hero-ctas">
              <a className="btn btn-primary" href={assessmentHref}>
                {t('ctaAssessment')}
                <Icon name="arrow" className="go" flip={isAr} />
              </a>
              <a className="btn btn-ghost" href={`/${locale}/my-courses`}>{t('ctaLearning')}</a>
            </div>
          </div>
          <div className="phero-media">
            <Scene ids={['sa4', 'eg1']} label={t('title')} ksa={ksa} eg={eg} />
            <div className="float f-fit">
              <Ring pct={current ? current.progress : 64} />
              <div>
                <p>{t('sceneProgress')}</p>
                <strong>{current ? current.title : t('sceneTrack')}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TILES */}
      <section className="sec sec-alt">
        <div className="wrap">
          <div className="tiles t4">
            {tiles.map((x, i) => (
              <div key={i} className="tile">
                <span className="feat-ic"><Icon name={TILE_ICONS[i]} /></span>
                <h3>{x.t}</h3>
                <p>{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERSONAS */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head center">
            <span className="eyebrow">{t('personasEyebrow')}</span>
            <h2 className="h2">{t('personasTitle')}</h2>
          </div>
          <div className="personas">
            {personas.map((p, i) => (
              <a key={i} className="pcard" href={assessmentHref}>
                <Scene ids={PERSONA_CAST[i]} cls="top" label={p.t} ksa={ksa} eg={eg} />
                <div className="p-body">
                  <h3>{p.t}</h3>
                  <p>{p.d}</p>
                  <span className="p-cta">{t('startHere')}<Icon name="arrow" flip={isAr} /></span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* TRACKS (always rendered) */}
      <section className="sec sec-alt">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">{t('tracksEyebrow')}</span>
            <h2 className="h2">{t('tracksTitle')}</h2>
          </div>
          {tracks.length > 0 ? (
            <div className="tracks-grid">
              {tracks.map((p) => (
                <a key={p.id} className="tcard" href={`${MAIN_SITE_URL}/${locale}/careers/${p.slug}`}>
                  <div className="t-body">
                    <h3>{p.title}</h3>
                    {p.description && <p>{p.description}</p>}
                    {p.roles.length > 0 && (
                      <div className="roles">
                        {p.roles.map((r) => <span key={r}>{r}</span>)}
                      </div>
                    )}
                    {p.salary && (
                      <p className="t-sal">
                        <span>{t('salaryLabel')}</span>
                        <b>{p.salary}</b>
                      </p>
                    )}
                    <div className="t-foot">
                      <span className="link">{t('viewTrack')}<Icon name="arrow" flip={isAr} /></span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="muted">{tracksLoaded ? t('tracksEmpty') : t('tracksLoading')}</p>
          )}
          <div style={{ marginTop: 16 }}>
            <a className="link" href={`${MAIN_SITE_URL}/${locale}/careers`}>{t('tracksAll')}<Icon name="arrow" flip={isAr} /></a>
          </div>
        </div>
      </section>
      {/* COURSES */}
      {courses.length > 0 && (
        <section className="dw2-home-courses">
          <div className="dw2-wrap">
            <div className="dw2-sec-head">
              <div>
                <span className="dw2-eyebrow">{t('coursesEyebrow')}</span>
                <h2>{t('coursesTitle')}</h2>
                <p className="dw2-sec-sub">{t('coursesSub')}</p>
              </div>
              <a href={`/${locale}/courses`} className="dw2-view-all">{t('coursesAllArrow')}</a>
            </div>
            <div className="dw2-courses-grid">
              {courses.map((course: any) => {
                const title = (isAr ? course.titleAr || course.titleEn : course.titleEn || course.titleAr) || course.title || ''
                const instructor = instructorDisplayName(course.instructor, '')
                const students = course._count?.enrollments ?? course.studentsCount ?? 0
                return (
                  <div key={course.id} className="dw2-course-card">
                    <div className="dw2-course-thumb">
                      {course.thumbnail ? <img src={course.thumbnail} alt={title} /> : <div className="dw2-thumb-placeholder">{title.charAt(0)}</div>}
                    </div>
                    <div className="dw2-course-info">
                      <h3 className="dw2-course-title">{title}</h3>
                      <div className="dw2-course-meta">
                        {instructor && <><span>{instructor}</span><span>·</span></>}
                        <span>{students} {t('coursesStudents')}</span>
                      </div>
                      <div className="dw2-course-footer">
                        <span className="dw2-course-price">{formatCoursePrice(course)}</span>
                        <a href={`/${locale}/courses/${course.id}`} className="dw2-course-btn">{t('coursesView')}</a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <a href={`/${locale}/courses`} className="dw2-btn-outline">{t('coursesAll')}</a>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
