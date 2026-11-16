'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/UserAvatar'
import { MentorStats } from '@/components/coaching/MentorStats'

export type CoachCardCoach = {
  id: string
  name?: string | null
  avatarUrl?: string | null
  rating?: number | null
  hourlyRate?: number | null
  specialties?: string[] | null
  experience?: number | null
  bio?: string | null
  completedSessionsCount?: number | null
  /** The coaching list API nests the person's details here instead of sending name / avatarUrl. */
  user?: { firstName?: string | null; lastName?: string | null; avatar?: string | null; gender?: string | null } | null
}

export function CoachCard({ coach }: { coach: CoachCardCoach }) {
  const t = useTranslations('coaches')
  const c = useTranslations('common')
  const isAr = useLocale() === 'ar'
  const name = coach.name || `${coach.user?.firstName ?? ''} ${coach.user?.lastName ?? ''}`.trim()

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <UserAvatar user={{ photo: coach.avatarUrl ?? coach.user?.avatar, gender: coach.user?.gender, name }} size={48} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-extrabold text-foreground">{name || c('empty')}</div>
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

      <div className="mt-3">
        <MentorStats years={coach.experience} completed={coach.completedSessionsCount} isAr={isAr} />
      </div>
      {coach.bio ? (
        <p
          className="mt-2 text-xs leading-6 text-[color:var(--muted)]"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {coach.bio}
        </p>
      ) : null}

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

