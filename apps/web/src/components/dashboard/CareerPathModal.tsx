'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { X, Check, Briefcase, Sparkles } from 'lucide-react'
import { get } from '@/lib/api'
import { fetchTrack, type TrackDetail } from '@/lib/tracks'
import { useMarket } from '@/app/contexts/MarketContext'
import { formatCurrency } from '@/lib/formatCurrency'
import { MARKET_CONFIG, toMarketAmount, toLang } from '@/lib/marketConfig'
import { learnCourseLink } from '@/lib/learn-link'

/** One of the user's career paths, as the dashboard already has it. */
export interface UserTrack {
  id: string
  slug: string
  name: string
  description?: string
  roles: string[]
  skills: string[]
  /** Raw JSON string from the career path row: { min, max, currency }. */
  salaryRange?: string | null
  progress: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  tracks: UserTrack[]
  /** courseId -> progress (0-100) for courses the user is enrolled in. */
  enrolledProgress?: Record<string, number>
  /** Optional reasons shown under "why it fits you". */
  reasons?: string[]
  /** Where "continue" goes. Defaults to the learn app's course list. */
  continueHref?: string
}

interface PathCourse { id: string; name: string; weeks?: number }

function parseSalary(raw?: string | null): { min?: number; max?: number; currency?: string } | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw)
    return v && typeof v === 'object' ? v : null
  } catch { return null }
}

export function CareerPathModal({ isOpen, onClose, tracks, enrolledProgress = {}, reasons, continueHref }: Props) {
  const locale = useLocale()
  const lang = toLang(locale)
  const isAr = lang === 'ar'
  const { market, config } = useMarket()
  const [idx, setIdx] = useState(0)
  const track = tracks.length ? tracks[Math.min(idx, tracks.length - 1)] : undefined

  useEffect(() => { if (idx >= tracks.length) setIdx(0) }, [tracks.length, idx])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [isOpen, onClose])

  // Richer "track" record (jobs with salaries per market, vision, package price) when the slug matches one.
  const { data: detail } = useQuery<TrackDetail | null>({
    queryKey: ['cpm-track', track?.slug, locale],
    queryFn: () => fetchTrack(track!.slug, locale),
    enabled: isOpen && !!track?.slug,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  })

  const { data: courses = [] } = useQuery<PathCourse[]>({
    queryKey: ['cpm-courses', track?.slug, locale],
    queryFn: async () => {
      const res = await get('/courses', { params: { page: 1, limit: 100, language: isAr ? 'ar' : 'en', careerPath: track!.slug } })
      const d = (res?.data as any)
      const arr = d?.data?.courses ?? d?.data ?? d ?? []
      return (Array.isArray(arr) ? arr : []).map((c: any) => ({
        id: c.id,
        name: (isAr ? (c.titleAr || c.title) : (c.titleEn || c.title)) || (isAr ? 'كورس' : 'Course'),
      }))
    },
    enabled: isOpen && !!track?.slug,
    staleTime: 60000,
    retry: 1,
  })

  const money = (sar: number) => formatCurrency(toMarketAmount(sar, market), market, locale)

  const jobs = useMemo(() => {
    if (detail?.jobs?.length) {
      return detail.jobs.slice(0, 3).map((j) => {
        const sal = market === 'EG' ? j.salaryEG : j.salaryKSA
        const text = sal?.min != null && sal?.max != null
          ? `${formatCurrency(sal.min, market, locale)} – ${formatCurrency(sal.max, market, locale)}`
          : ''
        return { title: isAr ? (j.titleAr || j.title) : j.title, salary: text, vision: j.vision.includes(market) }
      })
    }
    const sal = parseSalary(track?.salaryRange)
    // Career path salaries are stored in SAR unless the row says otherwise.
    const toMkt = (n: number) => (sal?.currency === 'EGP' ? (market === 'EG' ? n : Math.round(n / MARKET_CONFIG.EG.salaryMultiplier)) : toMarketAmount(n, market))
    const text = sal?.min != null && sal?.max != null ? `${formatCurrency(toMkt(sal.min), market, locale)} – ${formatCurrency(toMkt(sal.max), market, locale)}` : ''
    return (track?.roles ?? []).slice(0, 3).map((r) => ({ title: r, salary: text, vision: false }))
  }, [detail, track, market, locale, isAr])

  if (!isOpen) return null

  const ring = 2 * Math.PI * 38
  const doneCount = courses.filter((c) => (enrolledProgress[c.id] ?? 0) >= 100).length
  const pct = Math.max(0, Math.min(100, Math.round(courses.length ? (doneCount / courses.length) * 100 : (track?.progress ?? 0))))
  const skills = (detail?.skills?.length ? detail.skills : track?.skills) ?? []
  const showVision = detail ? detail.vision2030.includes(market) : false
  const pkg = detail?.package
  const tr = (ar: string, en: string) => (isAr ? ar : en)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={tr('مساراتك المهنية', 'Your career paths')}
    >
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="mx-4 flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl"
        style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)' }}
      >
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid var(--line)' }}>
          <h2 className="text-lg font-bold">{tr('مساراتك المهنية', 'Your career paths')}</h2>
          <button type="button" onClick={onClose} aria-label={tr('إغلاق', 'Close')} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
            <X size={18} />
          </button>
        </div>

        {tracks.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-6 pt-4" role="tablist">
            {tracks.map((t, i) => {
              const on = i === idx
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setIdx(i)}
                  className="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold"
                  style={{ background: on ? 'var(--brand)' : 'var(--bg-2)', color: on ? '#fff' : 'var(--ink-2)' }}
                >
                  {t.name}
                </button>
              )
            })}
          </div>
        )}

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {!track ? (
            <div className="py-10 text-center">
              <p className="mb-4 text-sm" style={{ color: 'var(--ink-2)' }}>{tr('لم تختر مساراً بعد', "You haven't picked a career path yet")}</p>
              <Link href={`/${locale}/dashboard/assessment`} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold" style={{ background: 'var(--brand)', color: '#fff' }}>
                <Sparkles size={16} />
                {tr('اختر مسارك مع رشيد', 'Pick your path with Rasheed')}
              </Link>
            </div>
          ) : (
            <>
              {/* Header card */}
              <div className="flex items-center gap-5 rounded-2xl p-5" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
                <span className="relative inline-flex h-24 w-24 flex-none items-center justify-center">
                  <svg viewBox="0 0 88 88" className="h-24 w-24 -rotate-90" aria-hidden="true">
                    <circle cx="44" cy="44" r="38" fill="none" stroke="var(--line-2)" strokeWidth="8" />
                    <circle cx="44" cy="44" r="38" fill="none" stroke="var(--brand)" strokeWidth="8" strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring - (ring * pct) / 100} />
                  </svg>
                  <span className="absolute text-lg font-bold">{pct}%</span>
                </span>
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--brand)' }}>
                    <Briefcase size={14} />{config.jobMarketNote[lang]}
                  </div>
                  <h3 className="text-2xl font-bold">{track.name}</h3>
                  {track.description && <p className="mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>{track.description}</p>}
                  <p className="mt-1 text-xs" style={{ color: 'var(--ink-3)' }}>{pct}% {tr('اكتملت', 'complete')}</p>
                </div>
              </div>

              {reasons && reasons.length > 0 && (
                <section>
                  <h4 className="mb-2 text-sm font-bold">{tr('لماذا يناسبك', 'Why it fits you')}</h4>
                  <ul className="space-y-1.5">
                    {reasons.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm" style={{ color: 'var(--ink-2)' }}><Check size={15} className="mt-0.5 flex-none" style={{ color: 'var(--good)' }} />{r}</li>
                    ))}
                  </ul>
                </section>
              )}

              {jobs.length > 0 && (
                <section>
                  <h4 className="mb-2 text-sm font-bold">{tr('الوظائف المرتبطة', 'Related jobs')}</h4>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {jobs.map((j) => (
                      <div key={j.title} className="rounded-xl p-3" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
                        <div className="text-sm font-bold">{j.title}</div>
                        {j.salary && <div className="mt-1 text-xs" style={{ color: 'var(--ink-2)' }}>{j.salary} · {config.salaryUnit[lang]}</div>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h4 className="mb-2 text-sm font-bold">{tr('الكورسات المضمّنة', 'Included courses')}</h4>
                {courses.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--ink-3)' }}>{tr('لا توجد كورسات مرتبطة بهذا المسار بعد.', 'No courses linked to this path yet.')}</p>
                ) : (
                  <ol className="space-y-2">
                    {courses.map((c, i) => {
                      const p = enrolledProgress[c.id]
                      const done = p != null && p >= 100
                      const doing = p != null && p > 0 && !done
                      return (
                        <li key={c.id}>
                          <a href={learnCourseLink(c.id, locale)} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
                            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold" style={{ background: done ? 'var(--good-bg)' : 'var(--wash)', color: done ? 'var(--good)' : 'var(--brand)' }}>
                              {done ? <Check size={14} /> : i + 1}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{c.name}</span>
                            <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
                              {done ? tr('مكتمل', 'Completed') : doing ? `${Math.round(p!)}%` : p != null ? tr('مشترك', 'Enrolled') : ''}
                            </span>
                          </a>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </section>

              {skills.length > 0 && (
                <section>
                  <h4 className="mb-2 text-sm font-bold">{tr('مهارات ستكتسبها', "Skills you'll build")}</h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <span key={s} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--wash)', color: 'var(--brand)' }}>{s}</span>
                    ))}
                  </div>
                </section>
              )}

              {showVision && (
                <section className="flex items-center gap-3 rounded-xl p-4" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
                  <img src={market === 'KSA' ? '/images/ro2ya.png' : '/images/egypt-vision.webp'} alt="" style={{ height: 28, width: 'auto', maxWidth: 64, objectFit: 'contain' }} />
                  <div>
                    <div className="text-sm font-bold">{config.vision.name[lang]}</div>
                    <div className="text-xs" style={{ color: 'var(--ink-2)' }}>{config.vision.description[lang]}</div>
                  </div>
                </section>
              )}

              {pkg && pkg.price > 0 && (
                <section className="flex items-center justify-between gap-3 rounded-xl p-4" style={{ background: 'var(--wash)', border: '1px solid var(--line)' }}>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>{tr('سعر واحد شامل', 'One all-inclusive price')}</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--brand)' }}>{money(pkg.price)}</div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3 p-6" style={{ borderTop: '1px solid var(--line)' }}>
          <Link href={`/${locale}/careers`} className="flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold" style={{ border: '1px solid var(--line)', color: 'var(--ink)' }}>
            {tr('تصفح كل المسارات', 'Browse all paths')}
          </Link>
          {track && (
            <a href={continueHref || `/${locale}/dashboard/my-courses`} className="flex-[2] rounded-xl px-4 py-3 text-center text-sm font-bold" style={{ background: 'var(--brand)', color: '#fff' }}>
              {tr('تابع مسارك', 'Continue your path')}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
