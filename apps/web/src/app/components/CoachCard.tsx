'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export type CoachCardCoach = {
  id: string
  name?: string | null
  avatarUrl?: string | null
  rating?: number | null
  hourlyRate?: number | null
  specialties?: string[] | null
}

export function CoachCard({ coach }: { coach: CoachCardCoach }) {
  const t = useTranslations('coaches')
  const c = useTranslations('common')

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-[color:var(--surface-2)]">
          {coach.avatarUrl ? (
            <Image src={coach.avatarUrl} alt={coach.name || ''} fill className="object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-[color:var(--muted)]">CH</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-extrabold text-foreground">{coach.name || c('empty')}</div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[color:var(--muted)]">
            <span>
              {t('rating')}: {typeof coach.rating === 'number' ? coach.rating.toFixed(1) : '-'}
            </span>
            <span>
              {typeof coach.hourlyRate === 'number' ? coach.hourlyRate : '-'} {t('per_hour')}
            </span>
          </div>
        </div>
      </div>

      {coach.specialties?.length ? (
        <div className="mt-4">
          <div className="text-xs font-semibold text-foreground">{t('specializations')}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {coach.specialties.slice(0, 4).map((s) => (
              <span key={s} className="rounded-full bg-[color:var(--surface-2)] px-2 py-1 text-xs text-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3">
        <Link href={`/coaches/${coach.id}`} className="text-xs font-semibold text-primary hover:underline">
          {c('view')}
        </Link>
        <Link
          href={`/dashboard/coaching/book?coachId=${encodeURIComponent(coach.id)}`}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90"
        >
          {t('book_session')}
        </Link>
      </div>
    </div>
  )
}

