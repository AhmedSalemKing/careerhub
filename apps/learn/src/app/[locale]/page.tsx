'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Rocket, Star } from 'lucide-react'
import { get } from '../../lib/api'
import { syncAuthUser } from '../../lib/auth-sync'
import { CHARS } from '../../lib/characters'
import { formatCoursePrice, getCountryClient } from '../../lib/market'
import { instructorDisplayName } from '../../lib/instructor'
import { useAuthStore } from '../../stores/authStore'
import { useMarket } from '../contexts/MarketContext'
import VisionBadge from '../../components/VisionBadge'
import { LearnHomeTourLauncher } from '@/components/LearnHomeTour'

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
          </span>
        ))}
      </div>
      {/* one row for the country pills so they sit side by side instead of overlapping */}
      <div className="duo-flags">
        {Array.from(new Set(ids.map((id) => (id.startsWith('sa') ? 'sa' : 'eg')))).map((c) => (
          <Fragment key={c}>
            <em className={`duo-flag ${c}`}>{c === 'sa' ? ksa : eg}</em>{' '}
          </Fragment>
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
  coverImage: string | null
  coursesCount: number
  weeks: number
  vision: string[]
}

function safeCount(raw: unknown, fallback?: number): number {
  try {
    const c = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Array.isArray(c) ? c.length : Number(fallback) || 0
  } catch { return Number(fallback) || 0 }
}

function parseVision(raw: unknown): string[] {
  try {
    const v = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch { return [] }
}

const PAGE_SIZE = 6
const PERSONA_CAST: string[][] = [['sa2', 'eg1'], ['eg2', 'sa3'], ['sa1', 'eg3']]
const TILE_ICONS: (keyof typeof ICON)[] = ['compass', 'eye', 'route', 'mentor']

export default function HomePage() {
  const t = useTranslations('learnHome')
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const authUser = useAuthStore((s) => s.user)
  const authToken = useAuthStore((s) => s.token)
  const { market } = useMarket()

  const [tracks, setTracks] = useState<TrackCard[]>([])
  const [tracksLoaded, setTracksLoaded] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [current, setCurrent] = useState<{ title: string; progress: number; courseId: string } | null>(null)
  const [allCourses, setAllCourses] = useState<any[] | null>(null)
  const [allLoading, setAllLoading] = useState(false)
  const [wantAll, setWantAll] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [sortBy, setSortBy] = useState<'all' | 'newest' | 'popular' | 'price-asc' | 'price-desc'>('all')
  const [enrolledCount, setEnrolledCount] = useState(0)
  const [enrollLoaded, setEnrollLoaded] = useState(false)

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

  // Featured tracks: first 6 from the admin-managed tracks API (same endpoint as the main site)
  useEffect(() => {
    let cancelled = false
    const country = getCountryClient() === 'EG' ? 'EG' : 'KSA'
    get('/tracks', { params: { country, lang: isAr ? 'ar' : 'en' } })
      .then((res: any) => {
        const d = res?.data?.data ?? res?.data
        const arr: any[] = Array.isArray(d) ? d : []
        const list: TrackCard[] = arr
          .filter((tr) => tr && tr.isActive !== false)
          .slice(0, 6)
          .map((tr) => ({
            id: tr.id,
            slug: tr.slug,
            title: tr.name || (isAr ? tr.nameAr : tr.nameEn) || '',
            description: tr.description || (isAr ? tr.descAr : tr.descEn) || '',
            roles: (Array.isArray(tr.jobs) ? tr.jobs : []).slice(0, 3).map((j: any) => j?.title).filter(Boolean),
            coverImage: tr.coverImage ?? null,
            coursesCount: safeCount(tr.courses, tr.courseCount),
            weeks: Number(tr.weeks) || 0,
            vision: parseVision(tr.vision2030),
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

  // A sort tab other than "all" ranks every recorded course, not just the 6 shown on the homepage
  useEffect(() => {
    if ((sortBy === 'all' && !wantAll) || allCourses) return
    let cancelled = false
    setAllLoading(true)
    get('/courses', { params: { limit: 100, type: 'recorded' } })
      .then((res: any) => {
        const d = res?.data?.data?.courses ?? res?.data?.data ?? res?.data?.courses ?? []
        if (!cancelled) setAllCourses(Array.isArray(d) ? d : [])
      })
      .catch(() => {
        if (!cancelled) setAllCourses(courses)
      })
      .finally(() => {
        if (!cancelled) setAllLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, wantAll])

  // A new tab starts again from the first page
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [sortBy])

  // Signed-in learners see their own progress in the hero card
  useEffect(() => {
    if (!authUser) {
      setCurrent(null)
      setEnrolledCount(0)
      setEnrollLoaded(false)
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
        if (!cancelled) setEnrolledCount(list.length)
        if (!first || !course) return
        const title = (isAr ? course.titleAr : course.titleEn) || course.titleAr || course.titleEn || course.title || ''
        // The stored enrollment.progress is only refreshed when a lesson is completed, so derive the value
        // from the lesson counts the endpoint also returns, and fall back to the stored one.
        const done = Number(first.completedLessons)
        const total = Number(first.totalLessons)
        const raw = total > 0 && Number.isFinite(done) ? (done / total) * 100 : Number(first.progress ?? 0)
        const progress = Math.max(0, Math.min(100, Math.round(raw || 0)))
        if (!cancelled) setCurrent({ title, progress, courseId: String(course.id ?? first.courseId ?? '') })
      })
      .catch(() => {
        if (!cancelled) setCurrent(null)
      })
      .finally(() => {
        if (!cancelled) setEnrollLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [authUser, isAr])

  // Never flash the new-user hero at a returning learner: wait for the session and the enrollments.
  const heroLoading = (!!authToken && !authUser) || (!!authUser && !enrollLoaded)
  const isEnrolled = enrolledCount > 0
  const firstName = (authUser as { profile?: { firstName?: string } } | null)?.profile?.firstName ?? ''

  const sortedCourses = useMemo(() => {
    const list = [...(allCourses ?? courses)]
    const stamp = (c: any) => (c.createdAt ? new Date(c.createdAt).getTime() : 0)
    const enrolls = (c: any) => c._count?.enrollments ?? c.enrollmentCount ?? c.studentsCount ?? 0
    switch (sortBy) {
      case 'newest': return list.sort((a, b) => stamp(b) - stamp(a))
      case 'popular': return list.sort((a, b) => enrolls(b) - enrolls(a))
      case 'price-asc': return list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
      case 'price-desc': return list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
      default: return list
    }
  }, [courses, allCourses, sortBy])
  const displayedCourses = sortedCourses.slice(0, visibleCount)
  // On "all" the homepage only preloads 6, so there may be more on the server than are loaded yet
  const hasMore = visibleCount < sortedCourses.length || (sortBy === 'all' && !allCourses && courses.length >= PAGE_SIZE)
  const handleLoadMore = () => {
    if (sortBy === 'all') setWantAll(true)
    setVisibleCount((n) => n + PAGE_SIZE)
  }
  const sortTabs: { value: typeof sortBy; label: string }[] = isAr
    ? [
        { value: 'all', label: 'الكل' }, { value: 'newest', label: 'الأحدث' }, { value: 'popular', label: 'الأكثر اشتراكًا' },
        { value: 'price-asc', label: 'الأقل سعرًا' }, { value: 'price-desc', label: 'الأعلى سعرًا' },
      ]
    : [
        { value: 'all', label: 'All' }, { value: 'newest', label: 'Newest' }, { value: 'popular', label: 'Most Enrolled' },
        { value: 'price-asc', label: 'Lowest Price' }, { value: 'price-desc', label: 'Highest Price' },
      ]

  const ksa = t('flagKsa')
  const eg = t('flagEg')
  const tiles = [1, 2, 3, 4].map((n) => ({ t: t(`tile${n}t`), d: t(`tile${n}d`) }))
  const personas = [1, 2, 3].map((n) => ({ t: t(`persona${n}t`), d: t(`persona${n}d`) }))

  return (
    <main className="dw2-learn overflow-x-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      <LearnHomeTourLauncher />
      {/* HERO */}
      <section className="phero" data-tour="learn-hero">
        <div className="hero-bg">
          <span className="dots" />
          <span className="b1" />
          <span className="b2" />
        </div>
        <div className="wrap phero-grid">
          <div className="phero-copy">
            <span className="eyebrow">{t('eyebrow')}</span>
            {heroLoading ? (
              <div aria-busy="true" aria-label="loading">
                <div style={{ height: 40, width: '70%', borderRadius: 'var(--radius)', background: 'var(--line)', opacity: 0.6 }} />
                <div style={{ height: 18, width: '90%', margin: '16px 0 24px', borderRadius: 'var(--radius)', background: 'var(--line)', opacity: 0.4 }} />
                <div style={{ height: 44, width: 200, borderRadius: 'var(--radius)', background: 'var(--line)', opacity: 0.5 }} />
              </div>
            ) : isEnrolled ? (
              <>
                <h1>{t('welcomeBack', { name: firstName || (isAr ? 'متعلّمنا' : 'learner') })}</h1>
                {current?.title && <p className="lede">{t('continueLine', { title: current.title })}</p>}
                <div className="hero-ctas" data-tour="learn-continue">
                  <a className="btn btn-primary" href={current?.courseId ? `/${locale}/courses/${current.courseId}/learn` : `/${locale}/my-courses`}>
                    {t('continueCta')}
                    <Icon name="arrow" className="go" flip={isAr} />
                  </a>
                  <a className="btn btn-ghost" href={`/${locale}/my-courses`}>{t('ctaLearning')}</a>
                </div>
              </>
            ) : (
              <>
                <h1>{t('title')}</h1>
                <p className="lede">{t('valueProp')}</p>
                <div className="hero-ctas" data-tour="learn-rashid">
                  <a className="btn btn-primary" href={assessmentHref}>
                    {t('ctaAssessment')}
                    <Icon name="arrow" className="go" flip={isAr} />
                  </a>
                  <a className="btn btn-ghost" href={`/${locale}/my-courses`}>{t('ctaLearning')}</a>
                </div>
              </>
            )}
          </div>
          <div className="phero-media">
            <Scene ids={['sa4', 'eg1']} label={t('title')} ksa={ksa} eg={eg} />
            {!heroLoading && isEnrolled && current && current.progress > 0 && (
              <div className="float f-fit">
                <Ring pct={current.progress} />
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
      <section className="sec sec-alt" data-tour="learn-tracks">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">{t('tracksEyebrow')}</span>
            <h2 className="h2">{t('tracksTitle')}</h2>
          </div>
          {tracks.length > 0 ? (
            <div className="tracks-grid">
              {tracks.map((p) => (
                <article
                  key={p.id}
                  className="tcard"
                  onClick={() => { window.location.href = `${MAIN_SITE_URL}/${locale}/careers/${p.slug}` }}
                >
                  <div className="t-media">
                    {p.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="t-cover" src={p.coverImage} alt="" loading="lazy" />
                    )}
                    <span className="t-badge"><Rocket size={18} aria-hidden="true" /></span>
                    {(p.coursesCount > 0 || p.weeks > 0) && (
                      <span className="t-count">
                        <Star size={13} aria-hidden="true" />
                        {isAr ? `${p.coursesCount} دورات · ${p.weeks} أسبوعًا` : `${p.coursesCount} courses · ${p.weeks} weeks`}
                      </span>
                    )}
                  </div>
                  <div className="t-body">
                    <h3><a href={`${MAIN_SITE_URL}/${locale}/careers/${p.slug}`} onClick={(e) => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>{p.title}</a></h3>
                    {p.description && <p className="t-desc">{p.description}</p>}
                    {p.roles.length > 0 && (
                      <div className="roles">
                        {p.roles.map((r) => <Fragment key={r}><span>{r}</span>{' '}</Fragment>)}
                      </div>
                    )}
                    {/* Only the selected market's Vision 2030 badge, never both */}
                    {p.vision.includes(market) && (
                      <div className="dw-vision-badges">
                        <VisionBadge compact />
                      </div>
                    )}
                    <div className="t-foot">
                      <button type="button" className="t-btn">{isAr ? 'تفاصيل' : 'Details'}</button>
                    </div>
                  </div>
                </article>
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
        <section className="dw2-home-courses" data-tour="learn-courses-section">
          <div className="dw2-wrap">
            <div className="dw2-sec-head">
              <div>
                <span className="dw2-eyebrow">{t('coursesEyebrow')}</span>
                <h2>{t('coursesTitle')}</h2>
                <p className="dw2-sec-sub">{t('coursesSub')}</p>
              </div>
              <a href={`/${locale}/courses`} className="dw2-view-all">{t('coursesAllArrow')}</a>
            </div>
            <div className="course-filter-tabs" role="tablist" aria-label={isAr ? 'ترتيب الدورات' : 'Sort courses'}>
              {sortTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={sortBy === tab.value}
                  className={`filter-tab${sortBy === tab.value ? ' active' : ''}`}
                  onClick={() => setSortBy(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="dw2-courses-grid">
              {displayedCourses.map((course: any, index: number) => {
                const title = (isAr ? course.titleAr || course.titleEn : course.titleEn || course.titleAr) || course.title || ''
                const instructor = instructorDisplayName(course.instructor, '')
                const students = course._count?.enrollments ?? course.studentsCount ?? 0
                return (
                  <div key={course.id} className="dw2-course-card" {...(index === 0 ? { 'data-tour': 'learn-course-card' } : {})}>
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
            {allLoading && (
              <p className="dw2-sec-sub" style={{ textAlign: 'center', marginTop: 16 }} aria-live="polite">
                {isAr ? 'جارٍ التحميل...' : 'Loading...'}
              </p>
            )}
            {hasMore && !allLoading && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button type="button" className="load-more-btn" onClick={handleLoadMore}>
                  {isAr
                    ? (allCourses ? `عرض المزيد (${sortedCourses.length - visibleCount} كورس)` : 'عرض المزيد')
                    : (allCourses ? `Show more (${sortedCourses.length - visibleCount} courses)` : 'Show more')}
                </button>
              </div>
            )}
            {sortBy === 'all' && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <a href={`/${locale}/courses`} className="dw2-btn-outline">{t('coursesAll')}</a>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  )
}
