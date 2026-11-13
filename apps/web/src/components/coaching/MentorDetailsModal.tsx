'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'
import { X, Star, Briefcase, Languages as LanguagesIcon, CalendarDays } from 'lucide-react'
import { UserAvatar } from '@/components/avatars/UserAvatar'
import { useMarket } from '@/app/contexts/MarketContext'
import { formatCurrency } from '@/lib/formatCurrency'
import { toMarketAmount } from '@/lib/marketConfig'

export interface MentorForModal {
  id: string
  hourlyRate?: number | string | null
  profile?: {
    firstName?: string | null
    lastName?: string | null
    avatar?: string | null
    gender?: string | null
    bio?: string | null
    speciality?: string | null
    yearsExperience?: number | null
    sessionPrice?: number | string | null
    sessionDuration?: number | null
    rating?: number | null
    languages?: string[] | null
  } | null
}

const DURATIONS = [30, 60, 90]

export function MentorDetailsModal({ mentor, onClose }: { mentor: MentorForModal | null; onClose: () => void }) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const { market } = useMarket()

  useEffect(() => {
    if (!mentor) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [mentor, onClose])

  if (!mentor) return null

  const p = mentor.profile ?? {}
  const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || (isAr ? 'مرشد' : 'Mentor')
  const years = Number(p.yearsExperience) || 0
  const base = Number(p.sessionPrice ?? mentor.hourlyRate ?? 0) || 0
  const baseMins = Number(p.sessionDuration) || 60
  const money = (sar: number) => formatCurrency(toMarketAmount(sar, market), market, locale)
  const langs = p.languages ?? []
  const bookHref = `/${locale}/coaching/${mentor.id}/book`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={name}
    >
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6"
        style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={isAr ? 'إغلاق' : 'Close'}
          className="absolute top-4 flex h-9 w-9 items-center justify-center rounded-full"
          style={{ insetInlineEnd: '1rem', background: 'var(--bg-2)', color: 'var(--ink)', border: '1px solid var(--line)' }}
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center gap-2 pt-2 text-center">
          <UserAvatar user={{ avatar: p.avatar, gender: p.gender, name }} size={96} />
          <h2 className="mt-2 text-2xl font-bold">{name}</h2>
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'var(--wash)', color: 'var(--brand)' }}>
            {p.speciality || (isAr ? 'إرشاد مهني' : 'Career mentoring')}
          </span>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-4 text-sm" style={{ color: 'var(--ink-2)' }}>
            {years > 0 && (
              <span className="inline-flex items-center gap-1.5"><Briefcase size={15} />{isAr ? `${years} سنة خبرة` : `${years} years experience`}</span>
            )}
            {typeof p.rating === 'number' && (
              <span className="inline-flex items-center gap-1.5"><Star size={15} fill="currentColor" />{p.rating.toFixed(1)}</span>
            )}
            {langs.length > 0 && (
              <span className="inline-flex items-center gap-1.5"><LanguagesIcon size={15} />{langs.join(' · ')}</span>
            )}
          </div>
        </div>

        {p.bio && (
          <p className="mt-5 text-sm leading-7" style={{ color: 'var(--ink-2)' }}>{p.bio}</p>
        )}

        {base > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-bold">{isAr ? 'أسعار الجلسات' : 'Session prices'}</h3>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map((d) => (
                <div key={d} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
                  <div className="text-xs" style={{ color: 'var(--ink-3)' }}>{d} {isAr ? 'دقيقة' : 'min'}</div>
                  <div className="mt-1 text-sm font-bold" style={{ color: 'var(--brand)' }}>{money(Math.round((base * d) / baseMins))}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)' }}
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
          <a
            href={bookHref}
            className="flex flex-[2] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold"
            style={{ background: 'var(--brand)', color: '#fff' }}
          >
            <CalendarDays size={16} />
            {isAr ? 'احجز الآن' : 'Book now'}
          </a>
        </div>
      </div>
    </div>
  )
}
