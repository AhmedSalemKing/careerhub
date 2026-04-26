'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../lib/api'
import { useToast } from '../../../lib/toast'
import { Skeleton } from '../../components/ui/Skeleton'
import { CoachCard, type CoachCardCoach } from '../../components/CoachCard'

export default function CoachesPage() {
  const t = useTranslations('coaches')
  const c = useTranslations('common')
  const { toast } = useToast()

  const q = useQuery({
    queryKey: ['coaches'],
    queryFn: async () => (await get<CoachCardCoach[]>('/coaching/coaches')).data,
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{t('title')}</h1>
      </div>

      {q.isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </div>
      ) : q.isError ? (
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
      ) : q.data?.length ? (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {q.data.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
          {c('empty')}
        </div>
      )}
    </div>
  )
}

