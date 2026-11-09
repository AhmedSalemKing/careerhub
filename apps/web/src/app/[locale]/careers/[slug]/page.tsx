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
  stats?: { totalCourses?: number } | null
}

const LEVELS_AR: Record<string, string> = { BEGINNER: 'مبتدئ', INTERMEDIATE: 'متوسط', ADVANCED: 'متقدم' }
const DEMAND_AR: Record<string, string> = { HIGH: 'طلب مرتفع', MEDIUM: 'طلب متوسط', LOW: 'طلب منخفض' }

function formatMinutes(minutes: number, isAr: boolean): string {
  if (minutes < 60) return `${minutes} ${isAr ? 'دقيقة' : 'min'}`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return isAr ? `${h} ساعة${m ? ` و${m} دقيقة` : ''}` : `${h}h${m ? ` ${m}m` : ''}`
}

function card(extra?: React.CSSProperties): React.CSSProperties {
  return { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, ...extra }
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

  // Level / vision metadata that lives in the catalogue entry with the same id as the slug
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

  const chip: React.CSSProperties = { padding: '4px 12px', borderRadius: 999, fontSize: 12, background: 'var(--surface-2)', color: 'var(--foreground)' }

  if (isError) {
    return (
      <div dir={isAr ? 'rtl' : 'ltr'} style={{ maxWidth: 720, margin: '60px auto', padding: 16 }}>
        <div style={card({ textAlign: 'center' })}>
          <p style={{ color: 'var(--muted)', margin: '0 0 16px' }}>{isAr ? 'تعذر تحميل المسار المهني' : 'Failed to load this career path'}</p>
          <button type="button" onClick={() => refetch()} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer' }}>
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
          <div style={{ marginTop: 12 }}>
            <Link href={`/${locale}/careers`} style={{ color: 'var(--primary)', fontSize: 13 }}>{isAr ? 'كل المسارات' : 'All paths'}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(16px,3vw,32px)', color: 'var(--foreground)' }}>
      <Link href={`/${locale}/careers`} style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>
        {isAr ? '← كل المسارات المهنية' : '← All career paths'}
      </Link>

      {/* Header */}
      <header style={{ margin: '16px 0 24px' }}>
        {isLoading ? (
          <>
            <Skeleton className="h-9 w-72" />
            <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 'clamp(24px,4vw,34px)', fontWeight: 900, margin: '0 0 8px' }}>{title}</h1>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 15, lineHeight: 1.8, maxWidth: 760 }}>{description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {totalMinutes > 0 && <span style={chip}>{isAr ? 'المدة' : 'Duration'}: {formatMinutes(totalMinutes, isAr)}</span>}
              {level && <span style={chip}>{isAr ? 'المستوى' : 'Level'}: {level}</span>}
              {demand && <span style={chip}>{demand}</span>}
              <span style={chip}>{isAr ? 'اللغة: العربية' : 'Language: Arabic'}</span>
            </div>
          </>
        )}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24, alignItems: 'start' }} className="cpd-grid">
        <style>{`@media (max-width: 900px) { .cpd-grid { grid-template-columns: 1fr !important; } }`}</style>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {/* Jobs */}
          <section style={card()}>
            <h2 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 800 }}>{isAr ? 'الوظائف التي يؤهلك لها المسار' : 'Jobs this path qualifies you for'}</h2>
            {jobs.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>{isAr ? 'لا توجد بيانات' : 'No data available'}</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {jobs.map((j) => (
                  <li key={j} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14 }}>{j}</li>
                ))}
              </ul>
            )}
            {sal?.min != null && sal?.max != null && (
              <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                {isAr ? 'نطاق الراتب الشهري' : 'Monthly salary range'}:{' '}
                <b style={{ color: 'var(--foreground)' }}>
                  {Number(sal.min).toLocaleString(isAr ? 'ar-EG' : 'en-US')} – {Number(sal.max).toLocaleString(isAr ? 'ar-EG' : 'en-US')} {sal.currency ?? ''}
                </b>
              </p>
            )}
          </section>

          {/* Skills */}
          <section style={card()}>
            <h2 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 800 }}>{isAr ? 'المهارات التي ستبنيها' : "Skills you'll build"}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {skills.length === 0 && <span style={{ color: 'var(--muted)', fontSize: 13 }}>{isAr ? 'لا توجد بيانات' : 'No data available'}</span>}
              {skills.map((s) => <span key={s} style={chip}>{s}</span>)}
            </div>
          </section>

          {/* Course plan */}
          <section style={card()}>
            <h2 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 800 }}>{isAr ? 'خطة الكورسات' : 'Course plan'}</h2>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : courses.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>{isAr ? 'لا توجد كورسات مرتبطة بهذا المسار بعد' : 'No courses linked to this path yet'}</p>
            ) : (
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {courses.map((c, i) => (
                  <li key={c.id}>
                    <a href={learnCourseLink(c.id, locale)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 12, textDecoration: 'none', color: 'inherit' }}>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 13, fontWeight: 700 }}>{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ display: 'block', fontSize: 14 }}>{c.title}</b>
                        <small style={{ color: 'var(--muted)', fontSize: 12 }}>
                          {[c.level ? (isAr ? LEVELS_AR[c.level] ?? c.level : c.level) : null, c.duration ? formatMinutes(c.duration, isAr) : null].filter(Boolean).join(' · ')}
                        </small>
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{c.price ? formatMoney(c.price, c.priceDisplay) : (isAr ? 'مجاني' : 'Free')}</span>
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Pricing */}
        <aside style={card({ position: 'sticky', top: 16 })}>
          <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800 }}>{isAr ? 'المسار الكامل' : 'Full path'}</h2>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--muted)' }}>
            {isAr ? `${courses.length} كورسات في الخطة` : `${courses.length} courses in the plan`}
          </p>
          <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 14 }}>
            {isLoading ? <Skeleton className="h-8 w-32" /> : totalPrice > 0 ? formatMoney(totalPrice) : (isAr ? 'مجاني' : 'Free')}
          </div>
          <button
            type="button"
            onClick={enroll}
            disabled={enrolling || isLoading || !path?.id}
            style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 700, fontSize: 14, cursor: enrolling ? 'wait' : 'pointer', opacity: enrolling || isLoading || !path?.id ? 0.6 : 1 }}
          >
            {enrolling ? (isAr ? 'جارٍ التسجيل...' : 'Enrolling...') : (isAr ? 'سجّل في المسار' : 'Enroll in path')}
          </button>
          {enrollError && <p role="alert" style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--error)' }}>{enrollError}</p>}

          <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0 12px' }} />
          <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--muted)' }}>
            {isAr ? 'تفضّل الدفع لكل جلسة؟ احجز جلسة مع مرشد في هذا المجال.' : 'Prefer to pay per session? Book a session with a mentor in this field.'}
          </p>
          <Link href={`/${locale}/coaching`} style={{ display: 'block', textAlign: 'center', padding: '10px 0', borderRadius: 10, border: '1px solid var(--border)', color: 'var(--foreground)', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            {isAr ? 'احجز جلسة بالدفع لكل جلسة' : 'Book a pay-per-session mentor'}
          </Link>
        </aside>
      </div>
    </div>
  )
}
