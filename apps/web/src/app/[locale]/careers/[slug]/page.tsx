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

/** Shape the page renders, whether it came from the API or from the sample data. */
type ViewJob = { title: string; description?: string; salaryText?: string | null; vision2030?: boolean }
type ViewCourse = { key: string; href?: string; title: string; type?: string; meta: string[]; priceText?: string }
type View = {
  title: string
  description: string
  coursesCount: number
  durationText?: string | null
  level?: string | null
  demand?: string | null
  languages?: string[]
  vision2030?: boolean
  totalPrice: number
  skills: string[]
  jobs: ViewJob[]
  courses: ViewCourse[]
  salaryText?: string | null
}

// TEMPORARY sample data, shown only while the API has no such path. Delete once real paths exist.
const MOCK_PATH = {
  id: 'mock',
  slug: 'frontend-developer',
  title: 'مطور واجهات',
  description: 'تعلّم بناء واجهات ويب تفاعلية باستخدام أحدث التقنيات. مبني حول الأدوات الأكثر طلبًا في سوق العمل.',
  coursesCount: 4,
  durationWeeks: 20,
  level: 'مبتدئ ← متوسط',
  languages: ['العربية', 'الإنجليزية'],
  vision2030: true,
  price: 2900,
  skills: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript'],
  jobs: [
    { title: 'مطور واجهات', description: 'بناء واجهات ويب تفاعلية', salaryMin: 8, salaryMax: 25, vision2030: true },
    { title: 'مطور React', description: 'تطوير تطبيقات بـ React', salaryMin: 10, salaryMax: 28, vision2030: false },
    { title: 'مهندس UI', description: 'تصميم وتطوير واجهات المستخدم', salaryMin: 9, salaryMax: 22, vision2030: true },
  ],
  courses: [
    { order: 1, title: 'أساسيات HTML و CSS', type: 'ذاتي التعلّم', weeks: 4, provider: 'أكاديمية بوصلة', language: 'العربية' },
    { order: 2, title: 'JavaScript الحديث', type: 'دفعة مباشرة', weeks: 6, provider: 'مختبر ميزان للمهارات', language: 'العربية · الإنجليزية' },
    { order: 3, title: 'React وإدارة الحالة', type: 'مدمج', weeks: 6, provider: 'مدرسة دلتا للبرمجة', language: 'الإنجليزية' },
    { order: 4, title: 'TypeScript وأدوات الإنتاج', type: 'ذاتي التعلّم', weeks: 4, provider: 'أكاديمية بوصلة', language: 'العربية' },
  ],
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
      try {
        const res = await get(`/career/paths/${encodeURIComponent(slug)}`, { params: { language: isAr ? 'ar' : 'en' } })
        console.log('[career-path-detail] slug:', slug, 'status:', res?.status, 'body:', res?.data)
        const d = (res?.data as any)?.data?.careerPath ?? (res?.data as any)?.data
        // Empty / malformed body counts as "no such path" -> sample data
        return d && typeof d === 'object' && d.id ? (d as PathDetail) : null
      } catch (e: any) {
        console.log('[career-path-detail] slug:', slug, 'error status:', e?.response?.status, 'body:', e?.response?.data ?? e?.message)
        if (e?.response?.status === 404) return null
        throw e
      }
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

  const nf = isAr ? 'ar-EG' : 'en-US'
  const isMock = !isLoading && !isError && !path

  const view: View | null = (() => {
    if (isLoading || isError) return null
    if (!path) {
      const m = MOCK_PATH
      return {
        title: m.title,
        description: m.description,
        coursesCount: m.coursesCount,
        durationText: `${m.durationWeeks.toLocaleString(nf)} ${isAr ? 'أسبوعًا' : 'weeks'}`,
        level: m.level,
        languages: m.languages,
        vision2030: m.vision2030,
        totalPrice: m.price,
        skills: m.skills,
        jobs: m.jobs.map((j) => ({
          title: j.title,
          description: j.description,
          salaryText: `${j.salaryMin.toLocaleString(nf)} – ${j.salaryMax.toLocaleString(nf)} ${isAr ? 'ألف ر.س / شهريًا' : 'k SAR / month'}`,
          vision2030: j.vision2030,
        })),
        courses: m.courses.map((c) => ({
          key: `mock-${c.order}`,
          title: c.title,
          type: c.type,
          meta: [`${c.weeks.toLocaleString(nf)} ${isAr ? 'أسبوع' : 'wk'}`, c.provider, c.language],
          priceText: isAr ? 'مشمولة في المسار' : 'Included in the path',
        })),
      }
    }

    const catalogue = CAREER_PATHS.flatMap((c) => c.paths).find((p) => p.id === slug)
    const courses: PathCourse[] = path.courses ?? []
    const totalMinutes = courses.reduce((s, c) => s + (c.duration ?? 0), 0)
    const sal = path.salaryRange
    const salaryText =
      sal?.min != null && sal?.max != null
        ? `${Number(sal.min).toLocaleString(nf)} – ${Number(sal.max).toLocaleString(nf)} ${sal.currency ?? ''}${isAr ? ' / شهريًا' : ' / month'}`
        : null
    const jobTitles: string[] = (isAr ? listEntry?.jobTitlesAr : listEntry?.jobTitlesEn) ?? path.jobTitles ?? []
    return {
      title: path.title || (isAr ? catalogue?.titleAr : catalogue?.title) || '',
      description: path.description || (isAr ? catalogue?.descriptionAr : catalogue?.descriptionEn) || '',
      coursesCount: courses.length,
      durationText: totalMinutes > 0 ? formatMinutes(totalMinutes, isAr) : null,
      level: catalogue?.level,
      demand: path.demandLevel ? (isAr ? DEMAND_AR[path.demandLevel] ?? path.demandLevel : path.demandLevel) : null,
      totalPrice: courses.reduce((s, c) => s + (c.price ?? 0), 0),
      skills: path.skills ?? catalogue?.skills ?? [],
      salaryText,
      jobs: jobTitles.slice(0, 6).map((j) => ({ title: j, salaryText })),
      courses: courses.map((c) => ({
        key: c.id,
        href: learnCourseLink(c.id, locale),
        title: c.title ?? '',
        meta: [c.level ? (isAr ? LEVELS_AR[c.level] ?? c.level : c.level) : '', c.duration ? formatMinutes(c.duration, isAr) : ''].filter(Boolean),
        priceText: c.price ? formatMoney(c.price, c.priceDisplay) : (isAr ? 'مجاني' : 'Free'),
      })),
    }
  })()

  const sessionPrices = (consultants as any[])
    .map((c: any) => ({ price: Number(c.profile?.sessionPrice ?? c.hourlyRate ?? 0) || 0, minutes: Number(c.profile?.sessionDuration ?? 60) || 60 }))
    .filter((x) => x.price > 0)
    .sort((a, b) => a.price - b.price)
  const cheapest = sessionPrices[0]

  const canEnroll = !!path?.id && !isMock
  const enroll = async () => {
    if (!path?.id || isMock || enrolling) return
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
          <h2 className="dw2-section-title">{isAr ? 'تعذر تحميل المسار المهني' : 'Failed to load this career path'}</h2>
          <p className="dw2-section-sub">{isAr ? 'تحقق من اتصالك بالإنترنت ثم أعد المحاولة.' : 'Check your connection and try again.'}</p>
          <div className="dw2-cta-row" style={{ justifyContent: 'center' }}>
            <button type="button" className="dw2-btn primary" onClick={() => refetch()}>{isAr ? 'إعادة المحاولة' : 'Retry'}</button>
            <Link href={`/${locale}/careers`} className="dw2-btn ghost">{isAr ? 'كل المسارات' : 'All paths'}</Link>
          </div>
        </div>
      </div>
    )
  }

  const enrollBtn = (block?: boolean) => (
    <button
      type="button"
      className={`dw2-btn primary${block ? ' block' : ''}`}
      onClick={enroll}
      disabled={enrolling || isLoading || !canEnroll}
      title={isMock ? (isAr ? 'بيانات تجريبية: التسجيل غير متاح' : 'Sample data: enrollment unavailable') : undefined}
    >
      {enrolling ? (isAr ? 'جارٍ التسجيل...' : 'Enrolling...') : (isAr ? 'سجّل في المسار الكامل' : 'Enroll in the full path')}
    </button>
  )

  return (
    <div className="dw2-path" dir={dir}>
      {/* 1 — breadcrumb + header */}
      <nav className="dw2-crumbs" aria-label="breadcrumb">
        <Link href={`/${locale}/careers`}>{isAr ? 'كل المسارات' : 'All paths'}</Link>
        <span aria-hidden="true">{isAr ? '‹' : '›'}</span>
        <span>{view?.title}</span>
      </nav>

      <header className="dw2-path-hero">
        {!view ? (
          <>
            <Skeleton className="h-10 w-80" />
            <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
          </>
        ) : (
          <>
            <h1>
              {view.title}
              {isMock && (
                <span className="dw2-stat-pill" style={{ marginInlineStart: 12, fontSize: 12, verticalAlign: 'middle', color: 'var(--purple)' }}>
                  {isAr ? 'بيانات تجريبية' : 'Sample data'}
                </span>
              )}
            </h1>
            {view.description && <p className="dw2-lede">{view.description}</p>}
            <div className="dw2-stats">
              <span className="dw2-stat-pill">{isAr ? `${view.coursesCount.toLocaleString(nf)} دورات` : `${view.coursesCount} courses`}</span>
              {view.durationText && <span className="dw2-stat-pill">{view.durationText}</span>}
              {view.level && <span className="dw2-stat-pill">{isAr ? 'المستوى' : 'Level'}: {view.level}</span>}
              {view.demand && <span className="dw2-stat-pill">{view.demand}</span>}
              {view.languages && view.languages.length > 0 && <span className="dw2-stat-pill">{view.languages.join(' · ')}</span>}
              {view.vision2030 && (
                <span className="dw2-stat-pill" style={{ color: 'var(--success)', borderColor: 'var(--success)' }}>
                  🇸🇦 {isAr ? 'متوافق مع رؤية 2030' : 'Vision 2030 aligned'}
                </span>
              )}
            </div>
            <div className="dw2-cta-row">
              {enrollBtn()}
              <Link href={`/${locale}/dashboard/assessment`} className="dw2-btn ghost">{isAr ? 'ابدأ التقييم المجاني' : 'Start the free assessment'}</Link>
            </div>
            {enrollError && <p className="dw2-error" role="alert" style={{ marginTop: 10 }}>{enrollError}</p>}
          </>
        )}
      </header>

      {view && (
        <>
          {/* 2 — jobs */}
          {view.jobs.length > 0 && (
            <section className="dw2-section">
              <h2 className="dw2-section-title">{isAr ? 'وظائف يؤهلك لها هذا المسار' : 'Jobs this path qualifies you for'}</h2>
              <div className="dw2-jobs" style={{ marginTop: 20 }}>
                {view.jobs.map((j) => (
                  <div key={j.title} className="dw2-job-card">
                    <h3>{j.title}</h3>
                    {j.description && <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>{j.description}</p>}
                    {j.salaryText && <div className="dw2-salary">{j.salaryText}</div>}
                    {j.vision2030 && (
                      <span className="dw2-stat-pill" style={{ alignSelf: 'flex-start', color: 'var(--success)', borderColor: 'var(--success)' }}>
                        🇸🇦 {isAr ? 'رؤية 2030' : 'Vision 2030'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {view.salaryText && !isMock && (
                <p className="dw2-muted">{isAr ? 'نطاق الراتب المعروض هو النطاق الشهري العام لهذا المسار المهني.' : 'The salary shown is the general monthly range for this career path.'}</p>
              )}
            </section>
          )}

          {/* 3 — vision 2030 (sample data only; the API has no such field) */}
          {view.vision2030 && (
            <section className="dw2-section">
              <h2 className="dw2-section-title">{isAr ? 'التوافق مع رؤية 2030' : 'Vision 2030 alignment'}</h2>
              <p className="dw2-section-sub">{isAr ? 'كيف يرتبط هذا المسار المهني بالأولويات الوطنية في السعودية ومصر.' : 'How this career path relates to national priorities in Saudi Arabia and Egypt.'}</p>
              <div className="dw2-job-card">
                <h3>🇸🇦 {isAr ? 'رؤية السعودية 2030' : 'Saudi Vision 2030'}</h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>
                  {isAr ? 'التحول الرقمي ممكّن أساسي لرؤية 2030، ويحتاج إلى مطوري واجهات قادرين على بناء الخدمات الرقمية.' : 'Digital transformation is a key enabler of Vision 2030 and needs developers able to build digital services.'}
                </p>
              </div>
              <p className="dw2-muted">{isAr ? 'يعكس التوافق قراءة DeveWay للأولويات الوطنية المعلنة، وليس اعتمادًا رسميًا.' : 'Alignment reflects DeveWay’s reading of announced national priorities, not an official endorsement.'}</p>
            </section>
          )}

          {/* 4 — skills */}
          {view.skills.length > 0 && (
            <section className="dw2-section">
              <h2 className="dw2-section-title">{isAr ? 'المهارات التي ستبنيها' : "Skills you'll build"}</h2>
              <div className="dw2-skills" style={{ marginTop: 20 }}>
                {view.skills.map((s) => <span key={s} className="dw2-skill-tag">{s}</span>)}
              </div>
            </section>
          )}

          {/* 5 — course plan */}
          <section className="dw2-section">
            <h2 className="dw2-section-title">{isAr ? 'خطة تعلّمك' : 'Your learning plan'}</h2>
            <p className="dw2-section-sub">{isAr ? 'الدورات بالترتيب الذي نوصي به.' : 'Courses in the order we recommend.'}</p>
            {view.courses.length === 0 ? (
              <p className="dw2-section-sub">{isAr ? 'لا توجد كورسات مرتبطة بهذا المسار بعد' : 'No courses linked to this path yet'}</p>
            ) : (
              <ol className="dw2-plan">
                {view.courses.map((c, i) => {
                  const inner = (
                    <>
                      <span className="dw2-course-num">{i + 1}</span>
                      <span className="dw2-course-info">
                        <b>{c.title}</b>
                        <small>{c.meta.filter(Boolean).join(' · ')}</small>
                      </span>
                      {c.type && <span className="dw2-stat-pill">{c.type}</span>}
                      {c.priceText && <span className="dw2-course-price">{c.priceText}</span>}
                    </>
                  )
                  return (
                    <li key={c.key}>
                      {c.href ? <a href={c.href} className="dw2-course-row">{inner}</a> : <div className="dw2-course-row">{inner}</div>}
                    </li>
                  )
                })}
              </ol>
            )}
          </section>

          {/* 6 — pricing */}
          <section className="dw2-section">
            <div className="dw2-price-grid">
              <div className="dw2-price-card featured">
                <h3>{isAr ? 'المسار الكامل' : 'Full path'}</h3>
                <div className="dw2-big-price">{view.totalPrice > 0 ? formatMoney(view.totalPrice) : (isAr ? 'مجاني' : 'Free')}</div>
                <p>{isMock ? (isAr ? 'سعر واحد للمسار كاملًا.' : 'One price for the whole path.') : (isAr ? 'مجموع أسعار دورات المسار.' : 'Total of the path course prices.')}</p>
                <ul className="dw2-checklist">
                  <li>{isAr ? `${view.coursesCount.toLocaleString(nf)} دورات في الخطة` : `${view.coursesCount} courses in the plan`}</li>
                  {view.durationText && <li>{view.durationText}</li>}
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
          {(view.description || view.demand || view.salaryText) && (
            <section className="dw2-section">
              <h2 className="dw2-section-title">{isAr ? 'لماذا هذا المسار' : 'Why this path'}</h2>
              {view.description && <p className="dw2-section-sub" style={{ marginBottom: 12 }}>{view.description}</p>}
              <ul className="dw2-checklist">
                {view.demand && <li>{view.demand}</li>}
                {view.salaryText && !isMock && <li>{isAr ? 'نطاق الراتب الشهري' : 'Monthly salary range'}: {view.salaryText}</li>}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
