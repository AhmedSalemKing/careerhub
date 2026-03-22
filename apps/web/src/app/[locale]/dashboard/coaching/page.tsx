'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { DashboardShell } from '../../../components/DashboardShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../../lib/toast'
import { SessionCard, type SessionModel } from '../../../components/SessionCard'

export default function DashboardCoachingPage() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('coachingDash')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()

  const q = useQuery({
    queryKey: ['my-sessions'],
    queryFn: async () => {
      const raw = (await get<ApiEnvelope<unknown>>('/api/coaching/sessions/my-sessions')).data
      return unwrapData(raw) as any
    },
  })

  const sessions: SessionModel[] =
    (q.data?.items as SessionModel[]) ||
    (q.data?.sessions as SessionModel[]) ||
    (q.data?.data?.items as SessionModel[]) ||
    (q.data?.data?.sessions as SessionModel[]) ||
    []

  return (
    <AuthGate>
      <DashboardShell title={t('title')} subtitle={t('subtitle')}>
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-extrabold text-foreground">{t('my_sessions')}</div>
            <Link
              href={`/${locale}/dashboard/coaching/book`}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
            >
              {t('book_new')}
            </Link>
          </div>
        </div>

        {q.isLoading ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ) : q.isError ? (
          <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <div className="text-sm text-[color:var(--muted)]">{e('something_wrong')}</div>
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
        ) : sessions.length ? (
          <div className="mt-6 space-y-4">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            {t('empty')}
          </div>
        )}
      </DashboardShell>
    </AuthGate>
  )
}

