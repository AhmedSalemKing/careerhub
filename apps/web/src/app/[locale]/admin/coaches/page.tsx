'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { AdminShell } from '../../../components/AdminShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../../lib/toast'

type AdminCoach = {
  id: string
  name?: string | null
  hourlyRate?: number | null
  rating?: number | null
  specialties?: string[] | null
} & Record<string, unknown>

export default function AdminCoachesPage() {
  const t = useTranslations('adminCoaches')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()
  const [page, setPage] = useState(1)

  const q = useQuery({
    queryKey: ['admin-coaches', page],
    queryFn: async () => {
      const raw = (await get<ApiEnvelope<unknown>>('/coaching/admin/all', { params: { page, limit: 20 } })).data
      return unwrapData(raw) as any
    },
  })

  const data = (q.data ?? null) as any
  const items: AdminCoach[] = data?.items || data?.coaches || data?.data?.items || data?.data?.coaches || []

  return (
    <AuthGate>
      <AdminShell title={t('title')} subtitle={t('subtitle')}>
        {q.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-12 rounded-2xl" />
          </div>
        ) : q.isError ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
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
          <>
            <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--surface-2)] text-[color:var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 text-right font-semibold">{t('th_name')}</th>
                    <th className="px-4 py-3 text-right font-semibold">{t('th_rate')}</th>
                    <th className="px-4 py-3 text-right font-semibold">{t('th_rating')}</th>
                    <th className="px-4 py-3 text-right font-semibold">{t('th_specialties')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((coach) => (
                    <tr key={coach.id} className="border-t border-[color:var(--border)]">
                      <td className="px-4 py-3 font-semibold text-foreground">{coach.name || '-'}</td>
                      <td className="px-4 py-3 text-[color:var(--muted)]">{coach.hourlyRate ?? '-'}</td>
                      <td className="px-4 py-3 text-[color:var(--muted)]">{coach.rating ?? '-'}</td>
                      <td className="px-4 py-3 text-[color:var(--muted)]">
                        {(coach.specialties ?? []).slice(0, 3).join('، ') || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                {c('previous')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={items.length < 20}>
                {c('next')}
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            {c('empty')}
          </div>
        )}
      </AdminShell>
    </AuthGate>
  )
}

