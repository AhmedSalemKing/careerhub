'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { useToast } from '../../../../lib/toast'
import { Skeleton } from '../../../components/ui/Skeleton'
import type { CoachCardCoach } from '../../../components/CoachCard'

type CoachDetails = CoachCardCoach & {
  bioAr?: string | null
  bioEn?: string | null
  experience?: string | null
  availability?: unknown
}

export default function CoachesDetailClient() {
  const { id } = useParams<{ id: string }>()
  const t = useTranslations('coaches')
  const c = useTranslations('common')
  const { toast } = useToast()

  const q = useQuery({
    queryKey: ['coach', id],
    queryFn: async () => (await get<CoachDetails>(`/api/coaching/coaches/${encodeURIComponent(id)}`)).data,
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {q.isLoading ? <Skeleton className="h-8 w-72" /> : q.data?.name || c('empty')}
        </h1>
        <Link
          href="/coaches"
          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-foreground hover:bg-[color:var(--surface-2)]"
        >
          {c('back')}
        </Link>
      </div>

      {q.isError ? (
        <div className="mt-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
          <p className="text-sm text-[color:var(--muted)]">{c('empty')}</p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
            onClick={() => {
              toast({ title: c('loading'), description: c('loading') })
              q.refetch()
            }}
          >
            {c('retry')}
          </button>
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm lg:col-span-1">
          <div className="text-sm font-bold text-foreground">{t('rating')}</div>
          <div className="mt-2 text-sm text-[color:var(--muted)]">{typeof q.data?.rating === 'number' ? q.data.rating : '-'}</div>

          <div className="mt-6 text-sm font-bold text-foreground">{t('per_hour')}</div>
          <div className="mt-2 text-sm text-[color:var(--muted)]">{typeof q.data?.hourlyRate === 'number' ? q.data.hourlyRate : '-'}</div>

          <div className="mt-6">
            <Link
              href={`/dashboard/coaching/book?coachId=${encodeURIComponent(id)}`}
              className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90"
            >
              {t('book_now')}
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm lg:col-span-2">
          <div className="text-sm font-bold text-foreground">{t('bio')}</div>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            {q.isLoading ? <Skeleton className="h-5 w-[520px]" /> : (q.data?.bioAr || q.data?.bioEn || c('empty'))}
          </p>

          {q.data?.specialties?.length ? (
            <div className="mt-6">
              <div className="text-sm font-bold text-foreground">{t('specializations')}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {q.data.specialties.map((s) => (
                  <span key={s} className="rounded-full bg-[color:var(--surface-2)] px-2 py-1 text-xs text-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
