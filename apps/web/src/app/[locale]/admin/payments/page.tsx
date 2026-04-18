'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { AdminShell } from '../../../components/AdminShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../../lib/toast'

type AdminPayment = {
  id: string
  amount?: number | null
  currency?: string | null
  status?: string | null
  createdAt?: string | null
  userId?: string | null
} & Record<string, unknown>

export default function AdminPaymentsPage() {
  const t = useTranslations('adminPayments')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()
  const [page, setPage] = useState(1)

  const q = useQuery({
    queryKey: ['admin-payments', page],
    queryFn: async () => {
      const raw = (await get<ApiEnvelope<unknown>>('/payments/admin/all', { params: { page, limit: 20 } })).data
      return unwrapData(raw) as any
    },
  })

  const data = (q.data ?? null) as any
  const items: AdminPayment[] = data?.items || data?.payments || data?.data?.items || data?.data?.payments || []

  const sums = useMemo(() => {
    let egp = 0
    let sar = 0
    for (const p of items) {
      const amount = typeof p.amount === 'number' ? p.amount : 0
      const cur = String(p.currency ?? '').toUpperCase()
      if (cur === 'EGP') egp += amount
      if (cur === 'SAR') sar += amount
    }
    return { egp, sar }
  }, [items])

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
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Stat label={t('egp_total')} value={sums.egp} />
              <Stat label={t('sar_total')} value={sums.sar} />
            </div>

            {items.length ? (
              <>
                <div className="mt-6 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[color:var(--surface-2)] text-[color:var(--muted)]">
                      <tr>
                        <th className="px-4 py-3 text-right font-semibold">{t('th_id')}</th>
                        <th className="px-4 py-3 text-right font-semibold">{t('th_amount')}</th>
                        <th className="px-4 py-3 text-right font-semibold">{t('th_status')}</th>
                        <th className="px-4 py-3 text-right font-semibold">{t('th_user')}</th>
                        <th className="px-4 py-3 text-right font-semibold">{t('th_time')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((p) => (
                        <tr key={p.id} className="border-t border-[color:var(--border)]">
                          <td className="px-4 py-3 font-semibold text-foreground">{p.id}</td>
                          <td className="px-4 py-3 text-[color:var(--muted)]">
                            {p.amount ?? '-'} {p.currency ?? ''}
                          </td>
                          <td className="px-4 py-3 text-[color:var(--muted)]">{p.status ?? '-'}</td>
                          <td className="px-4 py-3 text-[color:var(--muted)]">{p.userId ?? '-'}</td>
                          <td className="px-4 py-3 text-[color:var(--muted)]">{p.createdAt ?? '-'}</td>
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
              <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
                {c('empty')}
              </div>
            )}
          </>
        )}
      </AdminShell>
    </AuthGate>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm">
      <div className="text-xs font-semibold text-[color:var(--muted)]">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-foreground">{Math.round(value)}</div>
    </div>
  )
}

