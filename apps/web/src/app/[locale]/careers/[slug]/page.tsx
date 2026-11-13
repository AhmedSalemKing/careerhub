'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get, post } from '../../../../lib/api'
import { learnCourseLink } from '../../../../lib/learn-link'
import { formatMoney } from '../../../../lib/market'
import { useMarket } from '../../../contexts/MarketContext'
import { CAREER_PATHS } from '../../../../lib/career-paths'
import { Skeleton } from '../../../components/ui/Skeleton'
import { learnUrlWithToken } from '../../../../lib/learn-link'
import { fetchTrack, formatSalaryRange, type TrackConsultant, type TrackCourse, type TrackPackageInfo } from '../../../../lib/tracks'
import { VisionBadges, VisionBox } from '../../../components/VisionBadge'
import { EnrollConfirmModal } from '../../../../components/careers/EnrollConfirmModal'
import { formatCurrency } from '../../../../lib/formatCurrency'
import { toMarketAmount } from '../../../../lib/marketConfig'

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
type ViewJob = { title: string; description?: string; salaryText?: string | null; vision2030?: boolean; visionList?: string[] }
type ViewCourse = { track?: TrackCourse; key: string; href?: string; title: string; type?: string; meta: string[]; priceText?: string; included?: boolean }
type View = {
  title: string
  description: string
  coursesCount: number
  durationText?: string | null
  level?: string | null
  demand?: string | null
  languages?: string[]
  vision2030?: boolean
  trackVision?: string[]
  trackVisionDesc?: { KSA?: string | null; EG?: string | null }
  trackConsultants?: TrackConsultant[]
  trackPackage?: TrackPackageInfo | null
  trackSessionPrice?: number | null
  trackNote?: string
  freeItems?: string[]
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
  description: 'تعلّم بناء واجهات ويب تفاعلية باستخدام أحدث التقنيات. مبني حول الأدوات الأكثر طلبًا في سوق العمل السعودي والمصري.',
  coursesCount: 4,
  durationWeeks: 20,
  level: 'مبتدئ ← متوسط',
  languages: ['العربية', 'الإنجليزية'],
  vision2030SA: true,
  vision2030EG: false,
  price: 2900,
  skills: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript'],
  jobs: [
    { title: 'مطور واجهات', description: 'بناء واجهات ويب تفاعلية وتطبيقات متجاوبة', salaryMin: 8, salaryMax: 25, vision2030: true },
    { title: 'مطور React', description: 'تطوير تطبيقات SPA باستخدام React وحالاتها', salaryMin: 10, salaryMax: 28, vision2030: false },
    { title: 'مهندس UI', description: 'تصميم وتطوير مكونات واجهة المستخدم', salaryMin: 9, salaryMax: 22, vision2030: true },
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
  const { config: mkt, market } = useMarket()
  // Package, session and path prices are stored in SAR; EG shows the approximate EGP equivalent.
  const money = (sar: number) => formatCurrency(toMarketAmount(sar, market), market, locale)
  const lang = isAr ? 'ar' : 'en'
  const router = useRouter()
  const [enrollModalOpen, setEnrollModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<TrackCourse | null>(null)

  const { data: track, isLoading: trackLoading } = useQuery({
    queryKey: ['career-track', slug, locale],
    queryFn: () => fetchTrack(slug, locale),
    staleTime: 60000,
    retry: 0,
  })

  const { data: path, isLoading: pathLoading, isError, refetch } = useQuery({
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
        if (e?.response?.status === 404 || e?.response?.status === 500) return null
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

  // The package stores platform course ids. When the track's curated course list does not cover them
  // (or is empty), load the package courses by id so the plan is never empty while the package says N courses.
  const pkgCourseIds: string[] = track?.package?.courseIds ?? []
  const { data: pkgCourses = [], isLoading: pkgCoursesLoading } = useQuery({
    queryKey: ['career-package-courses', track?.package?.id, pkgCourseIds.join(',')],
    queryFn: async () => {
      const rows = await Promise.all(
        pkgCourseIds.map(async (id) => {
          try {
            const res = await get(`/courses/${encodeURIComponent(id)}`, { params: { language: isAr ? 'ar' : 'en' } })
            const c = (res?.data as any)?.data?.course
            return c && c.id ? c : null
          } catch { return null }
        }),
      )
      return rows.filter(Boolean) as any[]
    },
    enabled: pkgCourseIds.length > 0,
    staleTime: 60000,
    retry: 0,
  })

  // Recommended courses for this path, used when the plan itself has no courses yet
  const { data: recommended = [], isLoading: recLoading } = useQuery({
    queryKey: ['career-detail-recommended', slug, locale],
    queryFn: async () => {
      const res = await get('/courses', { params: { page: 1, limit: 5, language: isAr ? 'ar' : 'en', careerPath: slug } })
      const d = (res?.data as any)
      const arr = d?.data?.courses ?? d?.data ?? d ?? []
      return Array.isArray(arr) ? arr : []
    },
    staleTime: 60000,
    retry: 0,
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

  const isLoading = pathLoading || trackLoading
  const nf = isAr ? 'ar-EG' : 'en-US'
  const isMock = !isLoading && !isError && !path && !track

  const view: View | null = (() => {
    if (isLoading) return null
    if (track) {
      const pkgIds = track.package?.courseIds ?? []
      const inPackage = pkgIds.length ? track.courses.filter((c) => c.courseId && pkgIds.includes(c.courseId)) : []
      const shownCourses = (inPackage.length ? inPackage : track.courses).slice().sort((a, b) => (a.order || 0) - (b.order || 0))
      const fromPackage = shownCourses.length === 0 && pkgCourses.length > 0
      // Only the selected market's salary range, in that market's currency.
      const salaryLine = (j: (typeof track.jobs)[number]) => {
        const r = market === 'EG' ? j.salaryEG : j.salaryKSA
        const txt = formatSalaryRange(r.min, r.max, market === 'EG' ? 'EGP' : 'SAR', locale)
        return txt ? `${txt}${isAr ? ' / شهريًا' : ' / month'}` : null
      }
      return {
        title: track.name,
        description: track.description,
        coursesCount: fromPackage ? pkgCourses.length : shownCourses.length,
        durationText: `${track.weeks.toLocaleString(nf)} ${isAr ? 'أسبوعًا' : 'weeks'}`,
        level: track.level,
        languages: track.languages ? [track.languages] : [],
        trackVision: track.vision2030,
        trackVisionDesc: { KSA: track.visionDescKSA, EG: track.visionDescEG },
        trackConsultants: track.consultants,
        trackPackage: track.package,
        trackSessionPrice: track.sessionPrice,
        freeItems: track.freeItems,
        totalPrice: 0,
        skills: track.skills,
        jobs: track.jobs.map((j) => ({
          title: j.title,
          description: j.desc,
          salaryText: salaryLine(j),
        })),
        courses: fromPackage ? pkgCourses.map((c: any) => ({
          key: `pkg-${c.id}`,
          href: learnCourseLink(c.id, locale),
          title: (isAr ? (c.titleAr || c.title) : (c.titleEn || c.title)) || '',
          meta: [c.duration ? formatMinutes(Number(c.duration), isAr) : '', c.level ? (isAr ? LEVELS_AR[c.level] ?? c.level : c.level) : ''].filter(Boolean),
          included: true,
        })) : shownCourses.map((c) => ({
          key: `track-${c.order}-${c.title}`,
          track: c,
          title: c.title,
          type: c.type,
          meta: [`${c.weeks.toLocaleString(nf)} ${isAr ? 'أسبوع' : 'wk'}`, c.provider, c.language].filter(Boolean),
          included: !!track.package,
        })),
      }
    }
    if (isError) return null
    if (!path) {
      const m = { ...MOCK_PATH, slug }
      return {
        title: m.title,
        description: m.description,
        coursesCount: m.coursesCount,
        durationText: `${m.durationWeeks.toLocaleString(nf)} ${isAr ? 'أسبوعًا' : 'weeks'}`,
        level: m.level,
        languages: m.languages,
        vision2030: m.vision2030SA || m.vision2030EG,
        totalPrice: m.price,
        skills: m.skills,
        jobs: m.jobs.map((j) => ({
          title: j.title,
          description: j.description,
          salaryText: `${j.salaryMin.toLocaleString(nf)} – ${j.salaryMax.toLocaleString(nf)} ${isAr ? 'ألف' : 'k'} ${mkt.currencySymbol[lang]} / ${mkt.salaryUnit[lang]}`,
          vision2030: j.vision2030,
        })),
        courses: m.courses.map((c) => ({
          key: `mock-${c.order}`,
          title: c.title,
          type: c.type,
          meta: [`${c.weeks.toLocaleString(nf)} ${isAr ? 'أسبوع' : 'wk'}`, c.provider, c.language],
          included: true,
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

  // Free enrollment never depends on a career path: any track (or the path itself) can be joined
  const enrollId = path?.id || track?.id || ''
  // Free enrollment in a career path (no package). Called from the confirmation popup, which shows any error.
  const enrollInPath = async () => {
    if (!enrollId) return
    try {
      await post(`/career/paths/add/${enrollId}`, {}, { params: { source: 'MANUAL' } })
      router.push(`/${locale}/dashboard`)
    } catch (e: any) {
      if (e?.response?.status === 401) {
        router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/careers/${slug}`)}`)
        return
      }
      const m = e?.response?.data?.message
      throw new Error((Array.isArray(m) ? m.join(' - ') : m) || (isAr ? 'تعذر التسجيل في المسار' : 'Could not enroll in this path'))
    }
  }

  const dir = isAr ? 'rtl' : 'ltr'

  if (isError) {
    return (
      <div className="dw2-page" dir={dir}>
        <div className="dw2-hero" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <h2>{isAr ? 'تعذر تحميل المسار المهني' : 'Failed to load this career path'}</h2>
          <p className="dw2-sub" style={{ margin: '8px 0 16px' }}>{isAr ? 'تحقق من اتصالك بالإنترنت ثم أعد المحاولة.' : 'Check your connection and try again.'}</p>
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
      onClick={() => setEnrollModalOpen(true)}
      disabled={isLoading}
    >
      {isAr ? 'ابدأ المسار' : 'Start the path'}
    </button>
  )

  // Buying a track package goes through the learn app's payment page, which creates the Stripe checkout.
  const paymentUrl = (() => {
    const pk = view?.trackPackage
    if (!track || !pk || !view) return ''
    const params = new URLSearchParams({
      packageId: pk.id,
      amount: String(pk.price),
      amountDisplay: money(pk.price),
      title: `${isAr ? 'باكدج' : 'Package'} ${view.title}`,
      type: 'package',
      returnUrl: `/${locale}/careers/${track.slug}`,
    })
    return learnUrlWithToken(`/${locale}/payment/enroll?${params.toString()}`)
  })()

  const typeClass = (t?: string) => (t?.includes('ذاتي') ? 'self' : t?.includes('دفعة') ? 'cohort' : 'blended')
  const visionJobs = (view?.jobs ?? []).filter((j) => j.vision2030).map((j) => j.title)
  const showFullPricing = !!view && !track && (isMock || view.totalPrice > 0)

  return (
    <div className="dw2-page" dir={dir}>
      {/* HERO */}
      <section
        className={'dw2-hero' + (track ? ' cover' : '')}
        style={track?.coverImage ? { backgroundImage: `linear-gradient(180deg, color-mix(in srgb, var(--night, var(--ink)) 55%, transparent), color-mix(in srgb, var(--night, var(--ink)) 88%, transparent)), url("${encodeURI(track.coverImage)}")` } : undefined}
      >
        <nav className="dw2-crumbs" aria-label="breadcrumb">
          <Link href={`/${locale}/careers`}>{isAr ? 'كل المسارات' : 'All paths'}</Link>
          <span aria-hidden="true">{isAr ? '‹' : '›'}</span>
          <span>{view?.title}</span>
        </nav>

        {!view ? (
          <>
            <Skeleton className="h-8 w-72" />
            <Skeleton className="mt-3 h-4 w-full max-w-xl" />
          </>
        ) : (
          <>
            <h1>{view.title}</h1>
            {view.description && <p className="dw2-lede">{view.description}</p>}
            <div className="dw2-stats">
              {isMock && <span className="dw2-stat-pill dw2-pill-yellow">{isAr ? 'بيانات تجريبية' : 'Sample data'}</span>}
              <span className="dw2-stat-pill">{isAr ? `${view.coursesCount.toLocaleString(nf)} دورات` : `${view.coursesCount} courses`}</span>
              {view.durationText && <span className="dw2-stat-pill">{view.durationText}</span>}
              {view.level && <span className="dw2-stat-pill">{isAr ? 'المستوى' : 'Level'}: {view.level}</span>}
              {view.demand && <span className="dw2-stat-pill">{view.demand}</span>}
              {view.languages && view.languages.length > 0 && <span className="dw2-stat-pill">{view.languages.join(' · ')}</span>}
              {view.vision2030 && <span className="dw2-stat-pill dw2-pill-green">{mkt.flag} {isAr ? 'متوافق مع ' : 'Aligned with '}{mkt.vision.name[lang]}</span>}
              {view.trackVision && view.trackVision.length > 0 && <VisionBadges vision={view.trackVision} locale={locale} compact />}
            </div>
            <div className="dw2-cta-row">
              {enrollBtn()}
              <Link href={`/${locale}/dashboard/assessment`} className="dw2-btn ghost">{isAr ? 'ابدأ التقييم المجاني' : 'Start the free assessment'}</Link>
            </div>
          </>
        )}
      </section>

      {view && (
        <div className="dw2-path-body">
          {/* MAIN */}
          <div className="dw2-path-main">
            {view.jobs.length > 0 && (
              <section>
                <h2>{isAr ? 'وظائف يؤهلك لها هذا المسار' : 'Jobs this path qualifies you for'}</h2>
                <div className="dw2-jobs">
                  {view.jobs.map((j) => (
                    <div key={j.title} className="dw2-job-card">
                      <div className="dw2-job-body">
                        <h3>{j.title}</h3>
                        {j.description && <span className="dw2-job-desc">{j.description}</span>}
                        {j.salaryText && <span className="dw2-salary">{j.salaryText}</span>}
                      </div>
                      {j.vision2030 && <span className="dw2-stat-pill dw2-pill-green">{mkt.flag} {mkt.vision.name[lang]}</span>}
                      {j.visionList && j.visionList.length > 0 && <VisionBadges vision={j.visionList} locale={locale} compact />}
                    </div>
                  ))}
                </div>
                {view.salaryText && !isMock && (
                  <p className="dw2-note">{isAr ? 'نطاق الراتب المعروض هو النطاق الشهري العام لهذا المسار المهني.' : 'The salary shown is the general monthly range for this career path.'}</p>
                )}
              </section>
            )}

            {view.trackVision && view.trackVision.length > 0 && (
              <VisionBox
                vision={view.trackVision}
                descKSA={view.trackVisionDesc?.KSA}
                descEG={view.trackVisionDesc?.EG}
                jobTitles={view.jobs.map((j) => j.title)}
                locale={locale}
              />
            )}

            {view.vision2030 && (
              <section>
                <h2>{isAr ? 'التوافق مع رؤية 2030' : 'Vision 2030 alignment'}</h2>
                <p className="dw2-sub">{isAr ? 'كيف يرتبط هذا المسار المهني بالأولويات الوطنية في السعودية ومصر.' : 'How this career path relates to national priorities in Saudi Arabia and Egypt.'}</p>
                <div className="dw2-vision">
                  <span className="dw2-vision-title">{mkt.flag} {mkt.vision.name[lang]}</span>
                  <p>{isAr ? 'التحول الرقمي ممكّن أساسي لرؤية 2030، ويحتاج إلى مطورين قادرين على بناء الخدمات الرقمية.' : 'Digital transformation is a key enabler of Vision 2030 and needs developers able to build digital services.'}</p>
                  {visionJobs.length > 0 && <span className="dw2-jobs-label">{isAr ? 'الوظائف المتوافقة:' : 'Aligned jobs:'} {visionJobs.join(isAr ? '، ' : ', ')}</span>}
                  <span className="dw2-disclaimer">{isAr ? 'تتبع شارات رؤية 2030 السوق الذي اخترته.' : 'Vision 2030 badges follow the market you selected.'}</span>
                  <span className="dw2-disclaimer">{isAr ? 'يعكس التوافق قراءة DeveWay للأولويات الوطنية المعلنة، وليس اعتمادًا رسميًا.' : 'Alignment reflects DeveWay’s reading of announced national priorities, not an official endorsement.'}</span>
                </div>
              </section>
            )}

            {track && view.jobs.length === 0 && (
              <section>
                <h2>{isAr ? 'وظائف يؤهلك لها هذا المسار' : 'Jobs this path qualifies you for'}</h2>
                <p className="dw2-sub">{isAr ? 'لا توجد وظائف مرتبطة بهذا المسار بعد' : 'No jobs linked to this track yet'}</p>
              </section>
            )}

            {view.skills.length > 0 && (
              <section>
                <h2>{isAr ? 'المهارات التي ستبنيها' : "Skills you'll build"}</h2>
                <div className="dw2-skills">
                  {view.skills.map((s) => <span key={s} className="dw2-skill-tag">{s}</span>)}
                </div>
              </section>
            )}

            <section>
              <h2>{isAr ? 'خطة تعلّمك' : 'Your learning plan'}</h2>
              {track && view.trackPackage ? (
                <p className="dw2-sub" style={{ color: 'var(--brand)', fontWeight: 600 }}>{isAr ? `${Math.max(view.courses.length, view.trackPackage.courseCount).toLocaleString(nf)} دورة مشمولة في الباكدج` : `${Math.max(view.courses.length, view.trackPackage.courseCount)} courses included in the package`}</p>
              ) : (
                <p className="dw2-sub">{isAr ? 'الدورات بالترتيب الذي نوصي به.' : 'Courses in the order we recommend.'}</p>
              )}
              {view.courses.length === 0 ? (
                recLoading || pkgCoursesLoading ? (
                  <div className="space-y-2" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="skeleton-shimmer h-14 rounded-xl" />)}</div>
                ) : recommended.length === 0 ? (
                  <p className="dw2-sub">{isAr ? 'سنضيف كورسات لهذا المسار قريبًا.' : 'Courses for this path are coming soon.'}</p>
                ) : (
                  <>
                    <p className="dw2-sub" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                      <b style={{ color: 'var(--brand)' }}>{isAr ? 'كورسات مقترحة لهذا المسار' : 'Recommended courses for this path'}</b>
                      <span className="dw2-badge">{isAr ? 'قريباً - باكدج متكامل' : 'Coming soon - full package'}</span>
                    </p>
                    <ol className="dw2-plan">
                      {recommended.map((c: any, i: number) => {
                        const title = (isAr ? (c.titleAr || c.title) : (c.titleEn || c.title)) || ''
                        const meta = [c.duration ? formatMinutes(Number(c.duration), isAr) : '', c.level ? (isAr ? LEVELS_AR[c.level] ?? c.level : c.level) : ''].filter(Boolean)
                        return (
                          <li key={c.id ?? i}>
                            <a href={learnCourseLink(c.id, locale)} className="dw2-course-row">
                              <span className="dw2-course-num">{i + 1}</span>
                              <span className="dw2-course-title">
                                <b>{title}</b>
                                <span className="dw2-course-meta">{meta.map((m) => <span key={m}>{m}</span>)}</span>
                              </span>
                              <span className="dw2-course-price">{isAr ? 'استكشف' : 'Explore'}</span>
                            </a>
                          </li>
                        )
                      })}
                    </ol>
                  </>
                )
              ) : (
                <ol className="dw2-plan">
                  {view.courses.map((c, i) => {
                    const inner = (
                      <>
                        <span className="dw2-course-num">{i + 1}</span>
                        <span className="dw2-course-title">
                          <b>{c.title}</b>
                          <span className="dw2-course-meta">
                            {c.type && <span className={`dw2-type ${typeClass(c.type)}`}>{c.type}</span>}
                            {c.meta.filter(Boolean).map((m) => <span key={m}>{m}</span>)}
                          </span>
                        </span>
                        {c.included && <span className="dw2-included">{isAr ? 'مشمولة في المسار' : 'Included in the path'}</span>}
                        {c.priceText && <span className="dw2-course-price">{c.priceText}</span>}
                      </>
                    )
                    return (
                      <li key={c.key}>
                        {c.track ? (
                          <button type="button" className="dw2-course-row dw2-course-btn" onClick={() => setSelectedCourse(c.track!)} aria-haspopup="dialog">{inner}</button>
                        ) : c.href ? <a href={c.href} className="dw2-course-row">{inner}</a> : <div className="dw2-course-row">{inner}</div>}
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>
          </div>

          {/* SIDEBAR (sticky) */}
          <aside className="dw2-path-sidebar">
            {track && view.trackPackage && (
              <div className="dw2-pcard featured">
                <div className="dw2-card-top"><span>{isAr ? 'سعر واحد للمسار كاملًا' : 'One price for the whole track'}</span></div>
                <div className="dw2-big-price">{money(view.trackPackage.price)}</div>
                {view.trackPackage.originalPrice != null && view.trackPackage.discountPct != null && (
                  <p className="dw2-card-sub"><s>{money(view.trackPackage.originalPrice)}</s> · {isAr ? `خصم ${view.trackPackage.discountPct.toLocaleString(nf)}%` : `${view.trackPackage.discountPct}% off`}</p>
                )}
                <ul className="dw2-checklist">
                  <li>{isAr ? `${view.coursesCount.toLocaleString(nf)} دورات في الخطة` : `${view.coursesCount} courses in the plan`}</li>
                  {view.durationText && <li>{view.durationText}</li>}
                  <li>{isAr ? 'متابعة تقدّمك في مكان واحد' : 'Track your progress in one place'}</li>
                </ul>
                <a href={paymentUrl} className="dw2-btn primary block">{isAr ? 'سجّل في المسار الكامل' : 'Enroll in the full track'}</a>
              </div>
            )}

            {track && !view.trackPackage && (
              <div className="dw2-pcard featured">
                <div className="dw2-card-top">
                  <span>{isAr ? 'سعر واحد للمسار كاملًا' : 'One price for the whole track'}</span>
                  <span className="dw2-badge">{isAr ? 'قريباً' : 'Coming soon'}</span>
                </div>
                <p className="dw2-card-sub">{isAr ? 'سيتوفر التسجيل في المسار الكامل قريبًا. يمكنك البدء بالتقييم المجاني الآن.' : 'Enrollment in the full track opens soon. You can start with the free assessment now.'}</p>
                <Link href={`/${locale}/dashboard/assessment`} className="dw2-btn ghost block">{isAr ? 'ابدأ التقييم المجاني' : 'Start the free assessment'}</Link>
              </div>
            )}

            {showFullPricing && (
              <div className="dw2-pcard featured">
                <div className="dw2-card-top">
                  <span>{isAr ? 'سعر واحد شامل' : 'One all-inclusive price'}</span>
                  {isMock && <span className="dw2-badge">{isAr ? 'نموذج' : 'Sample'}</span>}
                </div>
                <div className="dw2-big-price">{money(view.totalPrice)}</div>
                <p className="dw2-card-sub">{isMock ? (isAr ? 'سعر واحد للمسار كاملًا.' : 'One price for the whole path.') : (isAr ? 'مجموع أسعار دورات المسار.' : 'Total of the path course prices.')}</p>
                <ul className="dw2-checklist">
                  <li>{isAr ? `${view.coursesCount.toLocaleString(nf)} دورات في الخطة` : `${view.coursesCount} courses in the plan`}</li>
                  {view.durationText && <li>{view.durationText}</li>}
                  <li>{isAr ? 'متابعة تقدّمك في مكان واحد' : 'Track your progress in one place'}</li>
                </ul>
                {enrollBtn(true)}
              </div>
            )}

            {(!track || (view.trackConsultants?.length ?? 0) > 0) && (
            <div className="dw2-pcard">
              <span className="dw2-pay-badge">{isAr ? 'ادفع حسب الاستخدام' : 'Pay as you go'}</span>
              <h3>{isAr ? 'إرشاد فردي' : 'One-to-one mentoring'}</h3>
              <p className="dw2-card-sub" style={{ marginBottom: 0 }}>{isAr ? 'احجز جلسة مع مرشد في هذا المجال متى احتجت، دون الحاجة للتسجيل في المسار.' : 'Book a session with a mentor whenever you need, no path enrollment required.'}</p>
              {track && view.trackConsultants && view.trackConsultants.length > 0 && (
                <div className="consultants-row">
                  {view.trackConsultants.map((c) => (
                    <div key={c.id} className="consultant-avatar" title={c.name}>
                      {c.avatar ? <img src={c.avatar} alt={c.name} loading="lazy" /> : <span aria-hidden="true">{(c.name || '?').trim().charAt(0)}</span>}
                      <span className="consultant-name">{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {track ? (
                view.trackSessionPrice != null && view.trackSessionPrice > 0 && (
                  <div className="dw2-price-row">
                    <span className="dw2-mid-price">{money(view.trackSessionPrice)}</span>
                    <small>{isAr ? '/ جلسة (يبدأ من)' : '/ session (from)'}</small>
                  </div>
                )
              ) : (
                cheapest && (
                  <div className="dw2-price-row">
                    <span className="dw2-mid-price">{money(cheapest.price)}</span>
                    <small>{isAr ? `/ جلسة ${cheapest.minutes} دقيقة (تبدأ من)` : `/ ${cheapest.minutes}-min session (from)`}</small>
                  </div>
                )
              )}
              <Link href={`/${locale}/coaching`} className="dw2-btn ghost block">{isAr ? 'احجز جلسة مدفوعة' : 'Book a paid session'}</Link>
            </div>
            )}

            <div className="dw2-pcard">
              <div className="dw2-free-title"><span>✦ {isAr ? 'ما هو مجاني' : "What's free"}</span></div>
              <ul className="dw2-checklist">
                {view.freeItems && view.freeItems.length > 0 ? (
                  view.freeItems.map((f) => <li key={f}>{f}</li>)
                ) : (
                  <>
                    <li><Link href={`/${locale}/dashboard/assessment`}>{isAr ? 'التقييم المهني بالذكاء الاصطناعي' : 'AI career assessment'}</Link></li>
                    <li>{isAr ? 'خطة المسار وتفاصيل كل دورة قبل التسجيل' : 'The path plan and course details before you enroll'}</li>
                  </>
                )}
              </ul>
            </div>
          </aside>
        </div>
      )}

      <EnrollConfirmModal
        isOpen={enrollModalOpen}
        onClose={() => setEnrollModalOpen(false)}
        trackName={view?.title ?? ''}
        coursesCount={view?.coursesCount ?? 0}
        price={track?.package?.price ?? (!track && view && view.totalPrice > 0 ? view.totalPrice : null)}
        paymentUrl={paymentUrl}
        onEnroll={enrollInPath}
      />

      {selectedCourse && (
        <div className="dw2-cm-overlay" onClick={() => setSelectedCourse(null)}>
          <div className="dw2-cm" role="dialog" aria-modal="true" aria-label={selectedCourse.title} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="dw2-cm-x" onClick={() => setSelectedCourse(null)} aria-label={isAr ? 'إغلاق' : 'Close'}>×</button>
            {selectedCourse.provider && <div className="dw2-cm-sub">{selectedCourse.provider}</div>}
            <h3>{selectedCourse.title}</h3>
            <div className="dw2-cm-grid">
              {selectedCourse.type && <div><small>{isAr ? 'النمط' : 'Format'}</small><b>{selectedCourse.type}</b></div>}
              {selectedCourse.weeks > 0 && <div><small>{isAr ? 'المدة' : 'Duration'}</small><b>{isAr ? `${selectedCourse.weeks.toLocaleString(nf)} أسبوع` : `${selectedCourse.weeks} weeks`}</b></div>}
              <div><small>{isAr ? 'اللغة' : 'Language'}</small><b>{selectedCourse.language || (isAr ? 'العربية · الإنجليزية' : 'Arabic · English')}</b></div>
              {track?.package && <div><small>{isAr ? 'السعر' : 'Price'}</small><b className="dw2-cm-in">{isAr ? 'مشمولة في المسار' : 'Included in the track'}</b></div>}
            </div>
            {track?.package ? (
              <div className="dw2-cm-note">{isAr ? 'ابدأ في أي وقت. تُفتح في مشغّل جهة التدريب بتسجيل دخولك في DeveWay.' : "Start any time. It opens in the provider's player with your DeveWay sign-in."}</div>
            ) : (
              <div className="dw2-cm-note">{isAr ? 'لا تُباع الدورات بشكل منفصل في المسار المجمّع.' : 'Courses are not sold separately inside the bundled track.'}</div>
            )}
            {selectedCourse.courseId && (
              <a className="dw2-btn ghost block" href={learnCourseLink(selectedCourse.courseId, locale)}>{isAr ? 'عرض الدورة' : 'View course'}</a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
