'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useQueries } from '@tanstack/react-query'
import {
  Star, CheckCircle, Briefcase, BookOpen, Wrench, Award, ArrowLeft, RotateCcw, TrendingUp, Info, Sparkles,
} from 'lucide-react'
import { RasheedAvatar } from '@/app/components/CharacterDuo'
import { useAuthStore } from '@/stores/authStore'
import { useMarket } from '@/app/contexts/MarketContext'
import { MARKET_CONFIG, toLang } from '@/lib/marketConfig'
import { formatCurrency } from '@/lib/formatCurrency'
import { useTracks, fetchTrack } from '@/lib/tracks'

/* ── Display shape ───────────────────────────────────────── */
interface ResultJob { title: string; description: string; salaryMin: number | null; salaryMax: number | null; vision2030: boolean }
interface ResultTrack {
  rank: number
  trackName: string
  trackDescription: string
  matchPercentage: number
  reasons: string[]
  jobs: ResultJob[]
  courses: { name: string; weeks: number }[]
  skills: string[]
  vision2030Text: string
  vision: 'KSA' | 'EG' | null
  price: number | null
  trackSlug: string | null
}
interface ResultData {
  userName: string
  personalityNote: string
  motivationalNote: string
  tracks: ResultTrack[]
  weeklyHours: number | null
}

/* What the assessment stores in sessionStorage('assessmentResult'). */
interface StoredAiCareer {
  name?: string; nameEn?: string; trackSlug?: string; match?: number
  reason?: string; strengths?: string[]; skillsToLearn?: string[]; nextStep?: string
}
interface Stored {
  result?: { summary?: string; personalNote?: string; topCareers?: StoredAiCareer[] }
  answers?: Record<string, string>
  timestamp?: number
  // Already in display shape
  tracks?: ResultTrack[]
  userName?: string
  personalityNote?: string
  motivationalNote?: string
  weeklyHours?: number
}

const VISION_LOGO = { KSA: '/images/ro2ya.png', EG: '/images/egypt-vision.webp' } as const

/** Package prices are stored in SAR (base currency); EG shows the approximate EGP equivalent. */
const packagePrice = (sar: number, market: 'KSA' | 'EG') => Math.round(sar * MARKET_CONFIG[market].salaryMultiplier)

/** Readiness question p6q1: the first two options mean under 5 study hours a week. */
const HOURS_BY_OPTION: Record<string, number> = {
  'أقل من 3 ساعات': 3,
  'من 3 إلى 5 ساعات': 5,
  'من 6 إلى 10 ساعات': 10,
  'أكثر من 10 ساعات': 11,
}

const fmtK = (n: number) => (n / 1000).toLocaleString('ar-EG', { maximumFractionDigits: 1 })

function MatchRing({ value, index }: { value: number; index: number }) {
  const r = 27
  const len = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, value))
  const [on, setOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setOn(true), 60); return () => clearTimeout(t) }, [])
  return (
    <span className="rs-ring">
      <svg width="64" height="64" viewBox="0 0 60 60" aria-hidden="true">
        <defs>
          <linearGradient id={`rs-rg-${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--lavender)" />
          </linearGradient>
        </defs>
        <circle className="rs-ring-bg" cx="30" cy="30" r={r} strokeWidth="6" />
        <circle
          className="rs-ring-fg"
          cx="30" cy="30" r={r} strokeWidth="6"
          stroke={`url(#rs-rg-${index})`}
          strokeDasharray={len}
          strokeDashoffset={on ? len * (1 - pct / 100) : len}
        />
      </svg>
      <b>{pct.toLocaleString('ar-EG')}٪</b>
    </span>
  )
}

export default function AssessmentResultPage() {
  const router = useRouter()
  const locale = useLocale()
  const user = useAuthStore((s) => s.user)
  const { market, config } = useMarket()
  const lang = toLang(locale)

  const [stored, setStored] = useState<Stored | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('assessmentResult')
      const parsed = raw ? (JSON.parse(raw) as Stored) : null
      if (parsed && (parsed.tracks?.length || parsed.result?.topCareers?.length)) setStored(parsed)
    } catch { /* shows the empty state */ }
    setChecked(true)
  }, [])

  // Real tracks (admin-managed): jobs, courses, vision text and the package price come from here.
  const { data: platformTracks = [] } = useTracks('ar')
  const careers = stored?.result?.topCareers ?? []
  const matched = useMemo(
    () => careers.map((c) =>
      platformTracks.find((t) => t.slug === c.trackSlug) ??
      platformTracks.find((t) => t.slug === (c.nameEn ?? '').toLowerCase().replace(/\s+/g, '-')) ??
      platformTracks.find((t) => t.name === c.name)),
    [careers, platformTracks],
  )
  const details = useQueries({
    queries: matched.map((tk) => ({
      queryKey: ['track', tk?.slug ?? 'none', 'ar'],
      queryFn: () => fetchTrack(tk!.slug, 'ar'),
      enabled: !!tk,
      staleTime: 60_000,
    })),
  })

  const data: ResultData | null = useMemo(() => {
    if (!stored) return null
    const first = (user as { profile?: { firstName?: string } } | null)?.profile?.firstName ?? ''

    if (stored.tracks?.length) {
      return {
        userName: stored.userName ?? first,
        personalityNote: stored.personalityNote ?? '',
        motivationalNote: stored.motivationalNote ?? '',
        tracks: stored.tracks.map((t, i) => ({ ...t, rank: t.rank ?? i + 1, vision: t.vision ?? (t.vision2030Text ? market : null) })),
        weeklyHours: stored.weeklyHours ?? null,
      }
    }

    const tracks: ResultTrack[] = careers.slice(0, 3).map((c, i) => {
      const tk = matched[i]
      const td = details[i]?.data ?? null
      const pkg = td?.package ?? null
      const all = (tk?.courses ?? []).slice().sort((a, b) => (a.order || 0) - (b.order || 0))
      const pkgIds = pkg?.courseIds ?? []
      const inPkg = pkgIds.length ? all.filter((x) => x.courseId && pkgIds.includes(x.courseId)) : []
      const vision = tk ? (tk.vision2030.includes(market) ? market : (tk.vision2030[0] ?? null)) : null
      return {
        rank: i + 1,
        trackName: tk?.name ?? c.name ?? '',
        trackDescription: tk?.description ?? c.nameEn ?? '',
        matchPercentage: Number(c.match) || 0,
        reasons: [c.reason, ...(c.strengths ?? [])].filter((x): x is string => !!x),
        jobs: (tk?.jobs ?? []).slice(0, 3).map((j) => {
          const sal = market === 'EG' ? j.salaryEG : j.salaryKSA
          return { title: j.titleAr || j.title, description: j.desc, salaryMin: sal.min, salaryMax: sal.max, vision2030: j.vision.includes(market) }
        }),
        courses: (inPkg.length ? inPkg : all).map((x) => ({ name: x.title, weeks: x.weeks })),
        skills: tk?.skills?.length ? tk.skills : (c.skillsToLearn ?? []),
        vision2030Text: (vision === 'KSA' ? td?.visionDescKSA : vision === 'EG' ? td?.visionDescEG : null) ?? '',
        vision,
        price: pkg?.price ?? null,
        trackSlug: tk?.slug ?? null,
      }
    })

    const hours = HOURS_BY_OPTION[stored.answers?.p6q1 ?? '']
    return {
      userName: first,
      personalityNote: stored.result?.summary ?? '',
      motivationalNote: stored.result?.personalNote ?? '',
      tracks,
      weeklyHours: hours ?? null,
    }
  }, [stored, careers, matched, details, user, market])

  const retake = () => { sessionStorage.removeItem('assessmentResult'); router.push(`/${locale}/dashboard/assessment`) }

  if (!checked) return null

  if (!data) {
    return (
      <div dir="rtl" className="dw-result">
        <div className="rs-empty">
          <Info size={28} aria-hidden="true" />
          <h2>لم يتم العثور على نتائج</h2>
          <p>لا توجد نتيجة تقييم محفوظة في هذه الجلسة.</p>
          <Link className="btn btn-primary" href={`/${locale}/dashboard/assessment`}>
            العودة إلى التقييم <ArrowLeft size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    )
  }

  const lowHours = data.weeklyHours != null && data.weeklyHours <= 5

  return (
    <div dir="rtl" className="dw-result">
      <div className="rs-wrap">
        {/* Hero */}
        <header className="rs-hero">
          <span className="rs-saved"><Sparkles size={13} aria-hidden="true" /> حُفظت في «تعلّمي»</span>
          <h1>ترشيحات رشيد لك</h1>
          <p>بناءً على إجاباتك. هذه اقتراحات تساعدك على القرار، وليست ضمانًا.</p>
        </header>

        {/* Rasheed */}
        <section className="rs-rasheed">
          <span className="rs-avatar"><RasheedAvatar size={72} /></span>
          <div>
            <p className="rs-who"><b>رشيد</b> · مرشد DeveWay المهني بالذكاء الاصطناعي</p>
            <p className="rs-sub">هذا ما توصّلت إليه. كل اقتراح مصحوب بأسبابي، لتقرّر أنت ما يناسبك.</p>
            {data.personalityNote && <p className="rs-note">{data.userName ? `${data.userName}، ` : ''}{data.personalityNote}</p>}
            {data.motivationalNote && <p className="rs-motive">{data.motivationalNote}</p>}
          </div>
        </section>

        {/* Tracks */}
        <div className="rs-grid">
          {data.tracks.map((t, i) => {
            const featured = t.rank === 1
            const hasSlug = !!t.trackSlug
            const href = `/${locale}/careers/${t.trackSlug}`
            return (
              <article key={`${t.rank}-${t.trackName}`} className={`rs-card${featured ? ' featured' : ''}`} style={{ animationDelay: `${i * 140}ms` }}>
                {featured && <span className="rs-best"><Star size={13} aria-hidden="true" /> الأنسب لك</span>}

                <header className="rs-head">
                  <div className="rs-head-text">
                    {!featured && <span className="rs-rank">الخيار {t.rank.toLocaleString('ar-EG')}</span>}
                    <h2>{t.trackName}</h2>
                    {t.trackDescription && <p>{t.trackDescription}</p>}
                  </div>
                  <div className="rs-match">
                    <MatchRing value={t.matchPercentage} index={i} />
                    <small>توافق</small>
                  </div>
                </header>

                {t.reasons.length > 0 && (
                  <section className="rs-sec">
                    <h3><CheckCircle size={14} aria-hidden="true" /> لماذا يناسبك</h3>
                    <ul className="rs-reasons">
                      {t.reasons.map((r) => (
                        <li key={r}><CheckCircle size={14} aria-hidden="true" /><span>{r}</span></li>
                      ))}
                    </ul>
                  </section>
                )}

                {t.jobs.length > 0 && (
                  <section className="rs-sec">
                    <h3><Briefcase size={14} aria-hidden="true" /> الوظائف ذات الصلة</h3>
                    <ul className="rs-jobs">
                      {t.jobs.map((j) => (
                        <li key={j.title}>
                          <span className="rs-job-name">{j.title}</span>
                          {j.description && <span className="rs-job-desc">{j.description}</span>}
                          <span className="rs-job-meta">
                            {(j.salaryMin != null || j.salaryMax != null) && (
                              <span className="rs-sal">
                                <TrendingUp size={13} aria-hidden="true" />
                                <b>{j.salaryMin != null && j.salaryMax != null ? `${fmtK(j.salaryMin)} – ${fmtK(j.salaryMax)}` : fmtK((j.salaryMin ?? j.salaryMax) as number)} ألف {config.currencySymbol[lang]}</b>
                                <small>/ {config.salaryUnit[lang]}</small>
                              </span>
                            )}
                            {j.vision2030 && <span className="rs-v2030">رؤية 2030</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {t.courses.length > 0 && (
                  <section className="rs-sec">
                    <h3><BookOpen size={14} aria-hidden="true" /> الدورات المشمولة <span className="rs-count">{t.courses.length.toLocaleString('ar-EG')}</span></h3>
                    <ol className="rs-courses">
                      {t.courses.map((c, n) => (
                        <li key={`${n}-${c.name}`}>
                          <span className="rs-n">{(n + 1).toLocaleString('ar-EG')}</span>
                          <b>{c.name}</b>
                          {c.weeks > 0 && <small>{c.weeks.toLocaleString('ar-EG')} أسبوع</small>}
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {t.skills.length > 0 && (
                  <section className="rs-sec">
                    <h3><Wrench size={14} aria-hidden="true" /> المهارات التي ستبنيها</h3>
                    <div className="rs-skills">{t.skills.map((s) => <span key={s}>{s}</span>)}</div>
                  </section>
                )}

                {t.vision && (
                  <section className="rs-vision">
                    <span className="rs-vlogo"><img src={VISION_LOGO[t.vision]} alt={MARKET_CONFIG[t.vision].vision.name[lang]} /></span>
                    <div>
                      <p className="rs-vname"><Award size={13} aria-hidden="true" /> متوافق مع {MARKET_CONFIG[t.vision].vision.name[lang]}</p>
                      {t.vision2030Text && <p>{t.vision2030Text}</p>}
                    </div>
                  </section>
                )}

                <footer className="rs-foot">
                  {t.price != null && (
                    <span className="rs-price">
                      <small>سعر واحد شامل</small>
                      <b>{formatCurrency(packagePrice(t.price, market), market, locale)}</b>
                      <span className="rs-sample">نموذج</span>
                    </span>
                  )}
                  <span className="rs-actions">
                    {hasSlug ? (
                      <Link className="btn btn-ghost btn-sm" href={href}>عرض المسار</Link>
                    ) : (
                      <button type="button" className="btn btn-ghost btn-sm" disabled>عرض المسار</button>
                    )}
                    {hasSlug ? (
                      <Link className={`btn ${featured ? 'btn-primary' : 'btn-ghost'} btn-sm`} href={href}>
                        ابدأ هذا المسار <ArrowLeft size={15} aria-hidden="true" />
                      </Link>
                    ) : (
                      <button type="button" className={`btn ${featured ? 'btn-primary' : 'btn-ghost'} btn-sm`} disabled>
                        ابدأ هذا المسار <ArrowLeft size={15} aria-hidden="true" />
                      </button>
                    )}
                  </span>
                </footer>
              </article>
            )
          })}
        </div>

        {/* Footer */}
        {lowHours && (
          <p className="rs-info">
            <Info size={15} aria-hidden="true" />
            <span>مع أقل من {(data.weeklyHours as number).toLocaleString('ar-EG')} ساعات أسبوعيًا، نقترح دورة واحدة في كل مرة.</span>
          </p>
        )}
        <p className="rs-fine">
          تعرض الرواتب النطاق الشهري الإجمالي المعتاد في السوق الذي اخترته، بجميع مستويات الخبرة. يبدأ المنضمون الجدد عادةً قرب الحد الأدنى.
        </p>
        <p className="rs-fine">
          تتبع شارات رؤية 2030 السوق الذي اخترته (السعودية أو مصر) أعلى الصفحة. يعكس التوافق قراءة DeveWay للأولويات الوطنية المعلنة، وليس اعتمادًا رسميًا.
        </p>
        <div className="rs-cta">
          <button type="button" className="btn btn-ghost" onClick={retake}><RotateCcw size={16} aria-hidden="true" /> أعد التقييم</button>
          <Link className="btn btn-primary" href={`/${locale}/dashboard/my-courses`}>افتح «تعلّمي» <ArrowLeft size={16} aria-hidden="true" /></Link>
        </div>
      </div>
    </div>
  )
}
