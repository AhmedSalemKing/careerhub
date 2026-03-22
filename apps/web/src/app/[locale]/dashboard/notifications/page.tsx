'use client'

import { useTranslations } from 'next-intl'
import { useMutation, useQuery } from '@tanstack/react-query'
import { get, patch } from '../../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { DashboardShell } from '../../../components/DashboardShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../../lib/toast'
import { Button } from '../../../components/ui/Button'

type NotificationItem = {
  id: string
  titleAr?: string | null
  titleEn?: string | null
  contentAr?: string | null
  contentEn?: string | null
  isRead?: boolean | null
  createdAt?: string | null
} & Record<string, unknown>

export default function DashboardNotificationsPage() {
  const t = useTranslations('notificationsPage')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()

  const q = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const raw = (await get<ApiEnvelope<unknown>>('/api/notifications')).data
      return unwrapData(raw) as any
    },
  })

  const items: NotificationItem[] =
    (q.data?.items as NotificationItem[]) ||
    (q.data?.notifications as NotificationItem[]) ||
    (q.data?.data?.items as NotificationItem[]) ||
    (q.data?.data?.notifications as NotificationItem[]) ||
    []

  const markRead = useMutation({
    mutationFn: async (id: string) => (await patch(`/api/notifications/${encodeURIComponent(id)}/read`)).data,
    onSuccess: () => q.refetch(),
    onError: () => toast({ variant: 'danger', title: t('title'), description: e('something_wrong') }),
  })

  const markAll = useMutation({
    mutationFn: async () => (await patch('/api/notifications/mark-all-read')).data,
    onSuccess: () => q.refetch(),
    onError: () => toast({ variant: 'danger', title: t('title'), description: e('something_wrong') }),
  })

  return (
    <AuthGate>
      <DashboardShell title={t('title')} subtitle={t('subtitle')}>
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-extrabold text-foreground">{t('inbox')}</div>
            <Button type="button" variant="secondary" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              {markAll.isPending ? c('loading') : t('mark_all')}
            </Button>
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
        ) : items.length ? (
          <div className="mt-6 space-y-4">
            {items.map((n) => (
              <div
                key={n.id}
                className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-foreground">{n.titleAr || n.titleEn || '-'}</div>
                    <div className="mt-2 text-sm text-[color:var(--muted)]">{n.contentAr || n.contentEn || '-'}</div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">{n.createdAt || '-'}</div>
                  </div>
                  {!n.isRead ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => markRead.mutate(n.id)}
                      disabled={markRead.isPending}
                    >
                      {t('mark_read')}
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold text-[color:var(--muted)]">{t('read')}</span>
                  )}
                </div>
              </div>
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

