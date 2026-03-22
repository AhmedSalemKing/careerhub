'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { unwrap } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { AdminShell } from '../../../components/AdminShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { Button } from '../../../components/ui/Button'
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
  Area,
  AreaChart,
} from 'recharts'
import { Calendar } from 'lucide-react'

type Overview = {
  traffic?: Array<{ date: string; visits: number }>
  topEvents?: Array<{ name: string; count: number }>
  platformSplit?: Array<{ name: string; value: number }>
  userGrowth?: Array<{ date: string; users: number }>
  categorySplit?: Array<{ name: string; value: number }>
  sessionStats?: Array<{ type: string; count: number }>
} & Record<string, unknown>

type RevenueAnalytics = Array<{ date: string; revenue: number }>

const PIE_COLORS = ['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444']

export default function AdminAnalyticsPage() {
  const t = useTranslations('adminAnalyticsPage')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()
  const [range, setRange] = useState('30d')

  const overviewQ = useQuery({
    queryKey: ['analytics-overview', range],
    queryFn: async () => {
      const res = await get('/analytics/overview', { params: { range } })
      const data = unwrap(res) as any
      return (data?.overview ?? data?.data?.overview ?? data) as Overview
    },
    placeholderData: (previousData) => previousData,
  })

  const revenueQ = useQuery({
    queryKey: ['analytics-revenue', range],
    queryFn: async () => {
      const res = await get('/analytics/revenue/analytics', { params: { range } })
      const data = unwrap(res) as any
      return (data?.analytics ?? data?.data?.analytics ?? data) as RevenueAnalytics
    },
    placeholderData: (previousData) => previousData,
  })

  const busy = overviewQ.isLoading || revenueQ.isLoading
  const hasError = overviewQ.isError || revenueQ.isError

  const traffic = overviewQ.data?.traffic ?? []
  const userGrowth = overviewQ.data?.userGrowth ?? []
  const categorySplit = overviewQ.data?.categorySplit ?? []
  const sessionStats = overviewQ.data?.sessionStats ?? []
  const revenue = Array.isArray(revenueQ.data) ? revenueQ.data : []

  return (
    <AuthGate requireRole="ADMIN">
      <AdminShell title={t('title')} subtitle={t('subtitle')}>
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              {t('date_range')}
            </div>
            <div className="flex items-center gap-2">
              {['7d', '30d', '3m', '12m'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-xl px-4 py-1.5 text-xs font-black uppercase transition-all ${
                    range === r 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'bg-gray-100 text-[color:var(--muted)] hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {busy ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Skeleton className="h-80 rounded-2xl" />
              <Skeleton className="h-80 rounded-2xl" />
              <Skeleton className="h-80 rounded-2xl" />
              <Skeleton className="h-80 rounded-2xl" />
            </div>
          ) : hasError ? (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
              <div className="text-sm text-[color:var(--muted)]">{e('something_wrong')}</div>
              <Button className="mt-4" onClick={() => { overviewQ.refetch(); revenueQ.refetch(); }}>{c('retry')}</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Revenue Line Chart */}
              <ChartContainer title={t('revenue_over_time')}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis dataKey="date" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* User Growth Area Chart */}
              <ChartContainer title={t('user_growth')}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis dataKey="date" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="users" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* Category Split Pie Chart */}
              <ChartContainer title={t('popular_categories')}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySplit}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categorySplit.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* Session Stats Bar Chart */}
              <ChartContainer title={t('session_types')}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                    <XAxis dataKey="type" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px' }} />
                    <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}
        </div>
      </AdminShell>
    </AuthGate>
  )
}

function ChartContainer({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
      <h3 className="mb-6 text-sm font-black text-foreground uppercase tracking-widest">{title}</h3>
      <div className="h-64 w-full">
        {children}
      </div>
    </div>
  )
}
