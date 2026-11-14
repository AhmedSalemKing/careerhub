'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useQueries } from '@tanstack/react-query'
import { X, Package, Settings2 } from 'lucide-react'
import { fetchTrack } from '@/lib/tracks'
import { toLang } from '@/lib/marketConfig'

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
  /** Kept for callers that still pass it; the overview is intentionally compact. */
  reasons?: string[]
  /** Where "continue" goes. Defaults to the dashboard. */
  continueHref?: string
}

/**
 * Compact overview of the user's tracks: name, progress, a few roles, continue.
 * Detail (courses, skills, vision) belongs on the track page, not here.
 */
export function CareerPathModal({ isOpen, onClose, tracks, enrolledProgress = {}, continueHref }: Props) {
  const locale = useLocale()
  const lang = toLang(locale)
  const isAr = lang === 'ar'
  const tr = (ar: string, en: string) => (isAr ? ar : en)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [isOpen, onClose])

  // Track detail (course ids + package) for progress; cached and fetched in parallel
  const details = useQueries({
    queries: tracks.map((t) => ({
      queryKey: ['career-track', t.slug, locale],
      queryFn: () => fetchTrack(t.slug, locale),
      enabled: isOpen && !!t.slug,
      staleTime: 60_000,
      retry: 0,
    })),
  })

  if (!isOpen) return null

  const rows = tracks.map((t, i) => {
    const d = details[i]?.data
    const ids = Array.from(new Set([...(d?.package?.courseIds ?? []), ...((d?.courses ?? []).map((c) => c.courseId).filter(Boolean) as string[])]))
    const pct = ids.length ? Math.round(ids.reduce((n, id) => n + (enrolledProgress[id] ?? 0), 0) / ids.length) : 0
    return { t, pct: Math.min(100, pct), hasPackage: !!d?.package }
  })
  const done = rows.filter((r) => r.pct >= 100).length
  const dashHref = continueHref ?? `/${locale}/dashboard`

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={tr('مساراتك المهنية', 'Your career paths')}
    >
      <aside
        dir={isAr ? 'rtl' : 'ltr'}
        className="cpm-panel flex h-full w-full max-w-[400px] flex-col"
        style={{ position: 'absolute', top: 0, right: 0, background: 'var(--surface)', color: 'var(--ink)', borderInlineStart: '1px solid var(--line)' }}
      >
        <header className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--line)' }}>
          <h2 className="flex-1 text-base font-bold">{tr('مساراتك المهنية', 'Your career paths')}</h2>
          {tracks.length > 0 && (
            <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: 'var(--wash)', color: 'var(--brand)' }}>
              {isAr ? `${done}/${tracks.length} مكتملة` : `${done}/${tracks.length} done`}
            </span>
          )}
          <button type="button" onClick={onClose} aria-label={tr('إغلاق', 'Close')} className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--ink-3)' }}>{tr('لم تنضم لأي مسار بعد.', 'You have not joined a path yet.')}</p>
          ) : rows.map(({ t, pct, hasPackage }) => (
            <div key={t.id} className="rounded-xl p-4" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
              <div className="flex items-center gap-2">
                <b className="flex-1 truncate text-sm">{t.name}</b>
                {hasPackage && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'var(--wash)', color: 'var(--brand)' }}>
                    <Package size={11} aria-hidden="true" />{tr('باكدج', 'Package')}
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--line)' }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--brand)', transition: 'width .3s' }} />
                </div>
                <span className="text-xs font-bold" style={{ color: 'var(--ink-2)' }}>{pct}%</span>
              </div>
              {t.roles.length > 0 && (
                <p className="mt-2 truncate text-xs" style={{ color: 'var(--ink-3)' }}>{t.roles.slice(0, 3).join(' · ')}</p>
              )}
              <Link href={dashHref} onClick={onClose} className="mt-3 inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: 'var(--brand)', color: '#fff' }}>
                {tr('تابع', 'Continue')}
              </Link>
            </div>
          ))}
        </div>

        <footer className="p-4" style={{ borderTop: '1px solid var(--line)' }}>
          <Link href={`/${locale}/careers`} onClick={onClose} className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ border: '1px solid var(--line)', color: 'var(--ink)' }}>
            <Settings2 size={15} aria-hidden="true" />
            {tr('إدارة مساراتي', 'Manage my paths')}
          </Link>
        </footer>
      </aside>
      <style>{`@keyframes cpm-in{from{transform:translateX(100%)}to{transform:none}}.cpm-panel{animation:cpm-in .22s ease-out}`}</style>
    </div>
  )
}
