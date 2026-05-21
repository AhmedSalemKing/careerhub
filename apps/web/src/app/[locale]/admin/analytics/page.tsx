'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { AdminShell } from '../../../components/AdminShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../../lib/toast'

const AnalyticsCharts = dynamic(() => import('../../../components/AnalyticsCharts').then(m => ({ default: m.AnalyticsCharts })), {
  loading: () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="h-80 rounded-2xl" style={{ background: 'var(--surface)' }} />
      <div className="h-80 rounded-2xl" style={{ background: 'var(--surface)' }} />
      <div className="h-80 rounded-2xl lg:col-span-2" style={{ background: 'var(--surface)' }} />
    </div>
  ),
  ssr: false,
})

type Overview = {
  traffic?: Array<{ date: string; visits: number }>
  topEvents?: Array<{ name: string; count: number }>
  platformSplit?: Array<{ name: string; value: number }>
} & Record<string, unknown>

type RevenueAnalytics = Array<{ date: string; revenue: number }>

export default function AdminAnalyticsPage() {
  const t = useTranslations('adminAnalyticsPage')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()

  const overviewQ = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const raw = (await get<ApiEnvelope<{ overview: Overview }>>('/analytics/overview')).data
      const data = unwrapData(raw) as any
      return (data?.overview ?? data?.data?.overview ?? data) as Overview
    },
  })

  const revenueQ = useQuery({
    queryKey: ['analytics-revenue'],
    queryFn: async () => {
      const raw = (await get<ApiEnvelope<{ analytics: RevenueAnalytics }>>('/analytics/revenue/analytics')).data
      const data = unwrapData(raw) as any
      return (data?.analytics ?? data?.data?.analytics ?? data) as RevenueAnalytics
    },
  })

  const busy = overviewQ.isLoading || revenueQ.isLoading
  const hasError = overviewQ.isError || revenueQ.isError

  const traffic = overviewQ.data?.traffic ?? []
  const topEvents = overviewQ.data?.topEvents ?? []
  const split = overviewQ.data?.platformSplit ?? []
  const revenue = Array.isArray(revenueQ.data) ? revenueQ.data : []

  return (
    <AuthGate>
      <AdminShell title={t('title')} subtitle={t('subtitle')}>
        {busy ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          </div>
        ) : hasError ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <div className="text-sm text-[color:var(--muted)]">{e('something_wrong')}</div>
            <button
              type="button"
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
              onClick={() => {
                toast({ title: c('loading'), description: c('loading') })
                overviewQ.refetch().catch(() => {})
                revenueQ.refetch().catch(() => {})
              }}
            >
              {c('retry')}
            </button>
          </div>
        ) : (
          <AnalyticsCharts traffic={traffic} split={split} topEvents={topEvents} revenue={revenue} t={t} />
        )}
      </AdminShell>
    </AuthGate>
  )
}

