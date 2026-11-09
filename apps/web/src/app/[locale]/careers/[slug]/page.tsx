'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get, post } from '../../../../lib/api'
import { learnCourseLink } from '../../../../lib/learn-link'
import { formatMoney } from '../../../../lib/market'
import { CAREER_PATHS } from '../../../../lib/career-paths'
import { Skeleton } from '../../../components/ui/Skeleton'

type PathCourse = {
  id: string
  title?: string | null
  price?: number | null
  priceDisplay?: string | null
  duration?: number | null
  level?: string | null
}

type PathDetail = {
  id: string
  slug: string
  title?: string | null
  description?: string | null
  skills?: string[] | null
  salaryRange?: { min?: number; max?: number; currency?: string } | null
  jobTitles?: string[] | null
  demandLevel?: string | null
  courses?: PathCourse[] | null
}

const LEVELS_AR: Record<string, string> = { BEGINNER: 'مبتدئ', INTERMEDIATE: 'متوسط', ADVANCED: 'متقدم' }
const DEMAND_AR: Record<string, string> = { HIGH: 'طلب مرتفع', MEDIUM: 'طلب متوسط', LOW: 'طلب منخفض' }

function formatMinutes(minutes: number, isAr: boolean): string {
  if (minutes < 60) return `${minutes} ${isAr ? 'دقيقة' : 'min'}`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return isAr ? `${h} ساعة${m ? ` و${m} دقيقة` : ''}` : `${h}h${m ? ` ${m}m` : ''}`
}

export default function CareerPathDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)

  const { data: path, isLoading, isError, refetch } = useQuery({
    queryKey: ['career-path-detail', slug, locale],
    queryFn: async () => {
      const res = await get(`/career/paths/${encodeURIComponent(slug)}`, { params: { language: isAr ? 'ar' : 'en' } })
      const d = (res?.data as any)?.data?.careerPath ?? (res?.data as any)?.data
      return d as PathDetail
    },
    retry: 1,
    staleTime: 60000,
  })

  // Job titles from the list endpoint are available in Arabic as well
  const { data: listEntry } = useQuery({
    queryKey: ['career-path-list-entry', slug],
    queryFn: async () => {
      const res = await get('/career/paths')
      const d = (res?.data as any)
      const arr = d?.data?.careerPaths ?? d?.data ?? []
      return (Array.isArray(arr) ? arr : []).find((p: any) => p.slug === slug) ?? null
    },
    staleTime: 5 * 60 * 1000,
  })

  // Same endpoint /coaching uses; used only to show the real starting per-session price
  const { data: consultants = [] } = useQuery({
    queryKey: ['career-detail-consultants'],
    queryFn: async () => {
      const res = await get('/consulting/consultants', { params: { limit: 50 } })
      const d = (res?.data as any)?.data
      return Array.isArray(d) ? d : []
    },
    staleTime: 60000,
  })

  // Level lives in the catalogue entry whose id equals the slug
  const catalogue = CAREER_PATHS.flatMap((c) => c.paths).find((p) => p.id === slug)

  const courses: PathCourse[] = path?.courses ?? []
  const jobs: string[] = (isAr ? listEntry?.jobTitlesAr : listEntry?.jobTitlesEn) ?? path?.jobTitles ?? []
  const skills: string[] = path?.skills ?? catalogue?.skills ?? []
  const totalMinutes = courses.reduce((s, c) => s + (c.duration ?? 0), 0)
  const totalPrice = courses.reduce((s, c) => s + (c.price ?? 0), 0)
  const sal = path?.salaryRange
  const title = path?.title || (isAr ? catalogue?.titleAr : catalogue?.title) || ''
  const description = path?.description || (isAr ? catalogue?.descriptionAr : catalogue?.descriptionEn) || ''
  const level = catalogue?.level
  const demand = path?.demandLevel ? (isAr ? DEMAND_AR[path.demandLevel] ?? path.demandLevel : path.demandLevel) : null
  const nf = isAr ? 'ar-EG' : 'en-US'
  const salaryText =
    sal?.min != null && sal?.max != null
      ? `${Number(sal.min).toLocaleString(nf)} – ${Number(sal.max).toLocaleString(nf)} ${sal.currency ?? ''}${isAr ? ' / شهريًا' : ' / month'}`
      : null

  const sessionPrices = (consultants as any[])
    .map((c: any) => ({ price: Number(c.profile?.sessionPrice ?? c.hourlyRate ?? 0) || 0, minutes: Number(c.profile?.sessionDuration ?? 60) || 60 }))
    .filter((x) => x.price > 0)
    .sort((a, b) => a.price - b.price)
  const cheapest = sessionPrices[0]

  const enroll = async () => {
    if (!path?.id || enrolling) return
    setEnrolling(true)
    setEnrollError(null)
    try {
      await post(`/career/paths/add/${path.id}`, {}, { params: { source: 'MANUAL' } })
      router.push(`/${locale}/dashboard/career-path`)
    } catch (e: any) {
      if (e?.response?.status === 401) {
        router.push(`/${locale}/login`)
        return
      }
      const m = e?.response?.data?.message
      setEnrollError((Array.isArray(m) ? m.join(' - ') : m) || (isAr ? 'تعذر التسجيل في المسار' : 'Could not enroll in this path'))
    } finally {
      setEnrolling(false)
    }
  }

  const dir = isAr ? 'rtl' : 'ltr'

  if (isError) {
    return (
      <div className="dw2-path" dir={dir}>
        <div className="dw2-section" style={{ textAlign: 'center' }}>
          <p className="dw2-section-sub">{isAr ? 'تعذر تحميل المسار المهني' : 'Failed to load this career path'}</p>
          <button type="button" className="dw2-btn primary" onClick={() => refetch()}>{isAr ? 'إعادة المحاولة' : 'Retry'}</button>
          <p style={{ marginTop: 14 }}>
            <Link href={`/${locale}/careers`} style={{ color: 'var(--purple)', fontSize: 13 }}>{isAr ? 'كل المسارات' : 'All paths'}</Link>
          </p>
        </div>
      </div>
    )
  }

  const enrollBtn = (block?: boolean) => (
    <button type="button" className={`dw2-btn primary${block ? ' block' : ''}`} onClick={enroll} disabled={enrolling || isLoading || !path?.id}>
      {enrolling ? (isAr ? 'جارٍ التسجيل...' : 'Enrolling...') : (isAr ? 'سجّل في المسار الكامل' : 'Enroll in the full path')}
    </button>
  )

  return (
    <div className="dw2-path" dir={dir}>
      {/* 1 — breadcrumb + header */}
      <nav className="dw2-crumbs" aria-label="breadcrumb">
        <Link href={`/${locale}/careers`}>{isAr ? 'كل المسارات' : 'All paths'}</Link>
        <span aria-hidden="true">{isAr ? '‹' : '›'}</span>
        <span>{title}</span>
      </nav>

      <header className="dw2-path-hero">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-80" />
            <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
          </>
        ) : (
          <>
            <h1>{title}</h1>
            {description && <p className="dw2-lede">{description}</p>}
            <div className="dw2-stats">
              <span className="dw2-stat-pill">{isAr ? `${courses.length} دورات` : `${courses.length} courses`}</span>
              {totalMinutes > 0 && <span className="dw2-stat-pill">{formatMinutes(totalMinutes, isAr)}</span>}
              {level && <span className="dw2-stat-pill">{isAr ? 'المستوى' : 'Level'}: {level}</span>}
              {demand && <span className="dw2-stat-pill">{demand}</span>}
            </div>
            <div className="dw2-cta-row">
              {enrollBtn()}
              <Link href={`/${locale}/dashboard/assessment`} className="dw2-btn ghost">{isAr ? 'ابدأ التقييم المجاني' : 'Start the free assessment'}</Link>
            </div>
            {enrollError && <p className="dw2-error" role="alert" style={{ marginTop: 10 }}>{enrollError}</p>}
          </>
        )}
      </header>

      {/* 2 — jobs */}
      {jobs.length > 0 && (
        <section className="dw2-section">
          <h2 className="dw2-section-title">{isAr ? 'وظائف يؤهلك لها هذا المسار' : 'Jobs this path qualifies you for'}</h2>
          <div className="dw2-jobs" style={{ marginTop: 20 }}>
            {jobs.slice(0, 6).map((j) => (
              <div key={j} className="dw2-job-card">
                <h3>{j}</h3>
                {salaryText && <div className="dw2-salary">{salaryText}</div>}
              </div>
            ))}
          </div>
          {salaryText && (
            <p className="dw2-muted">{isAr ? 'نطاق الراتب المعروض هو النطاق الشهري العام لهذا المسار المهني.' : 'The salary shown is the general monthly range for this career path.'}</p>
          )}
        </section>
      )}

      {/* 4 — skills */}
      {skills.length > 0 && (
        <section className="dw2-section">
          <h2 className="dw2-section-title">{isAr ? 'المهارات التي ستبنيها' : "Skills you'll build"}</h2>
          <div className="dw2-skills" style={{ marginTop: 20 }}>
            {skills.map((s) => <span key={s} className="dw2-skill-tag">{s}</span>)}
          </div>
        </section>
      )}

      {/* 5 — course plan */}
      <section className="dw2-section">
        <h2 className="dw2-section-title">{isAr ? 'خطة تعلّمك' : 'Your learning plan'}</h2>
        <p className="dw2-section-sub">{isAr ? 'الدورات بالترتيب الذي نوصي به.' : 'Courses in the order we recommend.'}</p>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : courses.length === 0 ? (
          <p className="dw2-section-sub">{isAr ? 'لا توجد كورسات مرتبطة بهذا المسار بعد' : 'No courses linked to this path yet'}</p>
        ) : (
          <ol className="dw2-plan">
            {courses.map((c, i) => (
              <li key={c.id}>
                <a href={learnCourseLink(c.id, locale)} className="dw2-course-row">
                  <span className="dw2-course-num">{i + 1}</span>
                  <span className="dw2-course-info">
                    <b>{c.title}</b>
                    <small>
                      {[c.level ? (isAr ? LEVELS_AR[c.level] ?? c.level : c.level) : null, c.duration ? formatMinutes(c.duration, isAr) : null].filter(Boolean).join(' · ')}
                    </small>
                  </span>
                  <span className="dw2-course-price">{c.price ? formatMoney(c.price, c.priceDisplay) : (isAr ? 'مجاني' : 'Free')}</span>
                </a>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* 6 — pricing */}
      <section className="dw2-section">
        <div className="dw2-price-grid">
          <div className="dw2-price-card featured">
            <h3>{isAr ? 'المسار الكامل' : 'Full path'}</h3>
            <div className="dw2-big-price">{isLoading ? <Skeleton className="h-9 w-32" /> : totalPrice > 0 ? formatMoney(totalPrice) : (isAr ? 'مجاني' : 'Free')}</div>
            <p>{isAr ? 'مجموع أسعار دورات المسار.' : 'Total of the path course prices.'}</p>
            <ul className="dw2-checklist">
              <li>{isAr ? `${courses.length} دورات في الخطة` : `${courses.length} courses in the plan`}</li>
              {totalMinutes > 0 && <li>{isAr ? `${formatMinutes(totalMinutes, true)} من المحتوى` : `${formatMinutes(totalMinutes, false)} of content`}</li>}
              <li>{isAr ? 'متابعة تقدّمك في مكان واحد' : 'Track your progress in one place'}</li>
            </ul>
            <div className="dw2-grow" />
            {enrollBtn(true)}
          </div>

          <div className="dw2-price-card">
            <h3>{isAr ? 'ادفع حسب الاستخدام' : 'Pay as you go'}</h3>
            <p>{isAr ? 'إرشاد فردي: احجز جلسة مع مرشد في هذا المجال متى احتجت، دون الحاجة للتسجيل في المسار.' : 'One-to-one mentoring: book a session with a mentor whenever you need, no path enrollment required.'}</p>
            {cheapest && (
              <p>
                <span className="dw2-big-price" style={{ fontSize: 28 }}>{formatMoney(cheapest.price)}</span>{' '}
                <small>{isAr ? `/ جلسة ${cheapest.minutes} دقيقة (تبدأ من)` : `/ ${cheapest.minutes}-min session (from)`}</small>
              </p>
            )}
            <div className="dw2-grow" />
            <Link href={`/${locale}/coaching`} className="dw2-btn ghost block">{isAr ? 'احجز جلسة مدفوعة' : 'Book a paid session'}</Link>
          </div>
        </div>
      </section>

      {/* 7 — free */}
      <section className="dw2-section">
        <h2 className="dw2-section-title">{isAr ? 'ما هو مجاني' : "What's free"}</h2>
        <ul className="dw2-checklist" style={{ marginTop: 16 }}>
          <li><Link href={`/${locale}/dashboard/assessment`}>{isAr ? 'التقييم المهني بالذكاء الاصطناعي' : 'AI career assessment'}</Link></li>
          <li>{isAr ? 'خطة المسار وتفاصيل كل دورة قبل التسجيل' : 'The path plan and course details before you enroll'}</li>
        </ul>
      </section>

      {/* 8 — why */}
      {(description || demand || salaryText) && (
        <section className="dw2-section">
          <h2 className="dw2-section-title">{isAr ? 'لماذا هذا المسار' : 'Why this path'}</h2>
          {description && <p className="dw2-section-sub" style={{ marginBottom: 12 }}>{description}</p>}
          <ul className="dw2-checklist">
            {demand && <li>{demand}</li>}
            {salaryText && <li>{isAr ? 'نطاق الراتب الشهري' : 'Monthly salary range'}: {salaryText}</li>}
          </ul>
        </section>
      )}
    </div>
  )
}
