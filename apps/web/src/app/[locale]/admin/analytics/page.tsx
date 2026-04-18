'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { AdminShell } from '../../../components/AdminShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../../lib/toast'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts'

type Overview = {
  traffic?: Array<{ date: string; visits: number }>
  topEvents?: Array<{ name: string; count: number }>
  platformSplit?: Array<{ name: string; value: number }>
} & Record<string, unknown>

type RevenueAnalytics = Array<{ date: string; revenue: number }>

const PIE_COLORS = ['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444']

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
                overviewQ.refetch()
                revenueQ.refetch()
              }}
            >
              {c('retry')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
              <div className="text-sm font-extrabold text-foreground">{t('traffic')}</div>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={traffic}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="date" tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="visits" stroke="#2563EB" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
              <div className="text-sm font-extrabold text-foreground">{t('platform_split')}</div>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Pie data={split} dataKey="value" nameKey="name" outerRadius={110}>
                      {split.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm lg:col-span-2">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="text-sm font-extrabold text-foreground">{t('revenue')}</div>
                <div className="text-xs text-[color:var(--muted)]">{t('revenue_hint')}</div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="h-72">
                  <div className="mb-2 text-xs font-semibold text-[color:var(--muted)]">{t('top_events')}</div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topEvents}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                      <XAxis dataKey="name" tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#7C3AED" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                      <XAxis dataKey="date" tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminShell>
    </AuthGate>
  )
}

