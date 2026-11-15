'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useQueries } from '@tanstack/react-query'
import {
  Star, CheckCircle, Briefcase, BookOpen, Wrench, Award, ArrowLeft, ArrowRight, RotateCcw, TrendingUp, Info, Sparkles,
} from 'lucide-react'
import { RasheedAvatar } from '@/app/components/CharacterDuo'
import { useAuthStore } from '@/stores/authStore'
import { LEARN_URL } from '@/lib/constants'
import { useMarket } from '@/app/contexts/MarketContext'
import { MARKET_CONFIG, toLang } from '@/lib/marketConfig'
import { formatCurrency } from '@/lib/formatCurrency'
import { useTracks, fetchTrack } from '@/lib/tracks'
import { AssessmentResultTourLauncher } from '@/components/AssessmentResultTour'

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

/** The model sometimes repeats the user's name ("Ahmed، يا أهلاً بيك يا Ahmed"): the greeting shows it once. */
function cleanGreeting(name: string, note: string): string {
  let text = note.trim()
  const n = name.trim()
  if (n) {
    // The page already prefixes "name، ": drop a leading copy and a trailing "يا name" vocative.
    for (const sep of ['،', ',']) {
      if (text.startsWith(`${n}${sep}`)) text = text.slice(n.length + 1).trim()
    }
    text = text.split(` يا ${n}`).join('')
  }
  return text
}

const fmtK = (n: number, nf: string) => (n / 1000).toLocaleString(nf, { maximumFractionDigits: 1 })

function MatchRing({ value, index, nf, pctSign }: { value: number; index: number; nf: string; pctSign: string }) {
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
      <b>{pct.toLocaleString(nf)}{pctSign}</b>
    </span>
  )
}

export default function AssessmentResultPage() {
  const router = useRouter()
  const locale = useLocale()
  const user = useAuthStore((s) => s.user)
  const { market, config } = useMarket()
  const lang = toLang(locale)
  const isAr = locale === 'ar'
  const nf = isAr ? 'ar-EG' : 'en-US'
  const Arrow = isAr ? ArrowLeft : ArrowRight

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
  const { data: platformTracks = [] } = useTracks(locale)
  const careers = stored?.result?.topCareers ?? []
  const matched = useMemo(
    () => careers.map((c) =>
      platformTracks.find((t) => t.slug === c.trackSlug) ??
      platformTracks.find((t) => t.slug === (c.nameEn ?? '').toLowerCase().replace(/\s+/g, '-')) ??
      platformTracks.find((t) => t.name === c.name) ??
      // Loose match: the AI sometimes words a career slightly differently from the track name
      platformTracks.find((t) => !!c.name && c.name.length > 3 && (t.name.includes(c.name) || c.name.includes(t.name)))),
    [careers, platformTracks],
  )
  const details = useQueries({
    queries: matched.map((tk) => ({
      queryKey: ['track', tk?.slug ?? 'none', locale],
      queryFn: () => fetchTrack(tk!.slug, locale),
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
      const vision = tk && tk.vision2030.includes(market) ? market : null
      return {
        rank: i + 1,
        trackName: tk?.name ?? c.name ?? '',
        trackDescription: tk?.description ?? c.nameEn ?? '',
        matchPercentage: Number(c.match) || 0,
        reasons: [c.reason, ...(c.strengths ?? [])].filter((x): x is string => !!x),
        jobs: (tk?.jobs ?? []).slice(0, 3).map((j) => {
          const sal = market === 'EG' ? j.salaryEG : j.salaryKSA
          return { title: (isAr ? j.titleAr : '') || j.title, description: j.desc, salaryMin: sal.min, salaryMax: sal.max, vision2030: j.vision.includes(market) }
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
      <div dir={isAr ? 'rtl' : 'ltr'} className="dw-result">
        <div className="rs-empty">
          <Info size={28} aria-hidden="true" />
          <h2>{isAr ? 'لم يتم العثور على نتائج' : 'No results found'}</h2>
          <p>{isAr ? 'لا توجد نتيجة تقييم محفوظة في هذه الجلسة.' : 'There is no saved assessment result in this session.'}</p>
          <Link className="btn btn-primary" href={`/${locale}/dashboard/assessment`}>
            {isAr ? 'العودة إلى التقييم' : 'Back to the assessment'} <Arrow size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    )
  }

  const lowHours = data.weeklyHours != null && data.weeklyHours <= 5

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="dw-result">
      <AssessmentResultTourLauncher locale={locale} />
      <div className="rs-wrap">
        {/* Hero */}
        <header className="rs-hero">
          <span className="rs-saved"><Sparkles size={13} aria-hidden="true" /> {isAr ? 'حُفظت في «تعلّمي»' : 'Saved to "My Learning"'}</span>
          <h1>{isAr ? 'ترشيحات رشيد لك' : 'Recommendations from Rashid for you'}</h1>
          <p>{isAr ? 'بناءً على إجاباتك. هذه اقتراحات تساعدك على القرار، وليست ضمانًا.' : 'Based on your answers. These suggestions help you decide; they are not a guarantee.'}</p>
        </header>

        {/* Rasheed */}
        <section className="rs-rasheed" data-tour="result-rasheed">
          <span className="rs-avatar"><RasheedAvatar size={72} /></span>
          <div>
            <p className="rs-who"><b>{isAr ? 'رشيد' : 'Rashid'}</b> · {isAr ? 'مرشد DeveWay المهني بالذكاء الاصطناعي' : 'DeveWay AI career guide'}</p>
            <p className="rs-sub">{isAr ? 'هذا ما توصّلت إليه. كل اقتراح مصحوب بأسبابي، لتقرّر أنت ما يناسبك.' : 'This is what I found. Every suggestion comes with my reasons, so you can decide what suits you.'}</p>
            {data.personalityNote && <p className="rs-note">{data.userName ? `${data.userName}${isAr ? '،' : ','} ` : ''}{cleanGreeting(data.userName, data.personalityNote)}</p>}
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
              <article key={`${t.rank}-${t.trackName}`} className={`rs-card${featured ? ' featured' : ''}`} {...(featured ? { 'data-tour': 'result-top-card' } : i === 1 ? { 'data-tour': 'result-alt-cards' } : {})} style={{ animationDelay: `${i * 140}ms` }}>
                {featured && <span className="rs-best"><Star size={13} aria-hidden="true" /> {isAr ? 'الأنسب لك' : 'Best match'}</span>}

                <header className="rs-head">
                  <div className="rs-head-text">
                    {!featured && <span className="rs-rank">{isAr ? 'الخيار' : 'Option'} {t.rank.toLocaleString(nf)}</span>}
                    <h2>{t.trackName}</h2>
                    {t.trackDescription && <p>{t.trackDescription}</p>}
                  </div>
                  <div className="rs-match">
                    <MatchRing value={t.matchPercentage} index={i} nf={nf} pctSign={isAr ? '٪' : '%'} />
                    <small>{isAr ? 'توافق' : 'Match'}</small>
                  </div>
                </header>

                {t.reasons.length > 0 && (
                  <section className="rs-sec">
                    <h3><CheckCircle size={14} aria-hidden="true" /> {isAr ? 'لماذا يناسبك' : 'Why it suits you'}</h3>
                    <ul className="rs-reasons">
                      {t.reasons.map((r) => (
                        <li key={r}><CheckCircle size={14} aria-hidden="true" /><span>{r}</span></li>
                      ))}
                    </ul>
                  </section>
                )}

                {t.jobs.length > 0 && (
                  <section className="rs-sec">
                    <h3><Briefcase size={14} aria-hidden="true" /> {isAr ? 'الوظائف ذات الصلة' : 'Related jobs'}</h3>
                    <ul className="rs-jobs">
                      {t.jobs.map((j) => (
                        <li key={j.title}>
                          <span className="rs-job-name">{j.title}</span>
                          {j.description && <span className="rs-job-desc">{j.description}</span>}
                          <span className="rs-job-meta">
                            {(j.salaryMin != null || j.salaryMax != null) && (
                              <span className="rs-sal">
                                <TrendingUp size={13} aria-hidden="true" />
                                <b>{j.salaryMin != null && j.salaryMax != null ? `${fmtK(j.salaryMin, nf)} – ${fmtK(j.salaryMax, nf)}` : fmtK((j.salaryMin ?? j.salaryMax) as number, nf)} {isAr ? 'ألف' : 'K'} {config.currencySymbol[lang]}</b>
                                <small>/ {config.salaryUnit[lang]}</small>
                              </span>
                            )}
                            {j.vision2030 && <span className="rs-v2030">{isAr ? 'رؤية 2030' : 'Vision 2030'}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {t.courses.length > 0 && (
                  <section className="rs-sec">
                    <h3><BookOpen size={14} aria-hidden="true" /> {isAr ? 'الدورات المشمولة' : 'Included courses'} <span className="rs-count">{t.courses.length.toLocaleString(nf)}</span></h3>
                    <ol className="rs-courses">
                      {t.courses.map((c, n) => (
                        <li key={`${n}-${c.name}`}>
                          <span className="rs-n">{(n + 1).toLocaleString(nf)}</span>
                          <b>{c.name}</b>
                          {c.weeks > 0 && <small>{c.weeks.toLocaleString(nf)} {isAr ? 'أسبوع' : (c.weeks === 1 ? 'week' : 'weeks')}</small>}
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {t.skills.length > 0 && (
                  <section className="rs-sec">
                    <h3><Wrench size={14} aria-hidden="true" /> {isAr ? 'المهارات التي ستبنيها' : 'Skills you will build'}</h3>
                    <div className="rs-skills">{t.skills.map((s) => <span key={s}>{s}</span>)}</div>
                  </section>
                )}

                {t.vision && (
                  <section className="rs-vision">
                    <span className="rs-vlogo"><img src={VISION_LOGO[t.vision]} alt={MARKET_CONFIG[t.vision].vision.name[lang]} /></span>
                    <div>
                      <p className="rs-vname"><Award size={13} aria-hidden="true" /> {isAr ? 'متوافق مع' : 'Aligned with'} {MARKET_CONFIG[t.vision].vision.name[lang]}</p>
                      {t.vision2030Text && <p>{t.vision2030Text}</p>}
                    </div>
                  </section>
                )}

                <footer className="rs-foot">
                  {t.price != null && (
                    <span className="rs-price">
                      <small>{isAr ? 'سعر واحد شامل' : 'One all-inclusive price'}</small>
                      <b>{formatCurrency(packagePrice(t.price, market), market, locale)}</b>
                      <span className="rs-sample">{isAr ? 'نموذج' : 'Sample'}</span>
                    </span>
                  )}
                  <span className="rs-actions">
                    {hasSlug ? (
                      <Link className={`btn ${featured ? 'btn-primary' : 'btn-ghost'} btn-sm`} href={href}>
                        {featured ? (isAr ? 'ابدأ هذا المسار' : 'Start this path') : (isAr ? 'عرض المسار' : 'View path')} <Arrow size={15} aria-hidden="true" />
                      </Link>
                    ) : (
                      // No matching platform track yet: send the user to the full list instead of a dead button
                      <Link className={`btn ${featured ? 'btn-primary' : 'btn-ghost'} btn-sm`} href={`/${locale}/careers`}>
                        {isAr ? 'تصفّح المسارات المتاحة' : 'Browse available paths'} <Arrow size={15} aria-hidden="true" />
                      </Link>
                    )}
                  </span>
                </footer>
              </article>
            )
          })}
        </div>

        {/* Next step */}
        <div className="rs-next" data-tour="result-next">
          <p>{isAr ? 'خطوتك القادمة' : 'Your next step'}</p>
          <h3>{isAr ? 'اختر مسارك وابدأ أول كورس' : 'Choose your path and start your first course'}</h3>
          <Link href={`/${locale}/careers`}>{isAr ? 'تصفّح المسارات المهنية' : 'Browse career paths'}</Link>
        </div>

        {/* Footer */}
        {lowHours && (
          <p className="rs-info">
            <Info size={15} aria-hidden="true" />
            <span>{isAr ? `مع أقل من ${(data.weeklyHours as number).toLocaleString(nf)} ساعات أسبوعيًا، نقترح دورة واحدة في كل مرة.` : `With under ${(data.weeklyHours as number).toLocaleString(nf)} hours a week, we suggest one course at a time.`}</span>
          </p>
        )}
        <p className="rs-fine">
          {isAr ? 'تعرض الرواتب النطاق الشهري الإجمالي المعتاد في السوق الذي اخترته، بجميع مستويات الخبرة. يبدأ المنضمون الجدد عادةً قرب الحد الأدنى.' : 'Salaries show the typical total monthly range in the market you chose, across all experience levels. New joiners usually start near the lower end.'}
        </p>
        <p className="rs-fine">
          {isAr ? 'تتبع شارات رؤية 2030 السوق الذي اخترته أعلى الصفحة. يعكس التوافق قراءة DeveWay للأولويات الوطنية المعلنة، وليس اعتمادًا رسميًا.' : 'Vision 2030 badges follow the market you chose at the top of the page. Alignment reflects the DeveWay reading of the stated national priorities, not an official endorsement.'}
        </p>
        <div className="rs-cta">
          <button type="button" className="btn btn-ghost" onClick={retake} data-tour="result-retake"><RotateCcw size={16} aria-hidden="true" /> {isAr ? 'أعد التقييم' : 'Retake the assessment'}</button>
          <a className="btn btn-primary" href={`${LEARN_URL.replace(/[/]+$/, '')}/${locale}`}>{isAr ? 'افتح «تعلّمي»' : 'Open "My Learning"'} <Arrow size={16} aria-hidden="true" /></a>
        </div>
      </div>
    </div>
  )
}
