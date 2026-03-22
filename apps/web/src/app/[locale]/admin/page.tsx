'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../lib/unwrap'
import { AuthGate } from '../../components/AuthGate'
import { AdminShell } from '../../components/AdminShell'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../../lib/toast'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type AdminDashboard = {
  stats?: Record<string, number>
  revenueLast12Months?: Array<{ month: string; revenue: number }>
  newUsersLast30Days?: Array<{ date: string; users: number }>
} & Record<string, unknown>

export default function AdminDashboardPage() {
  const t = useTranslations('adminPage')
  const a = useTranslations('admin')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()

  const q = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const raw = (await get<ApiEnvelope<{ dashboard: AdminDashboard }>>('/api/admin/dashboard')).data
      const data = unwrapData(raw) as any
      return (data?.dashboard ?? data?.data?.dashboard ?? data) as AdminDashboard
    },
  })

  const stats = q.data?.stats ?? {}
  const revenue = q.data?.revenueLast12Months ?? []
  const users = q.data?.newUsersLast30Days ?? []

  return (
    <AuthGate>
      <AdminShell title={a('dashboard')} subtitle={t('subtitle')}>
        {q.isLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
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
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              <Stat label={t('stat_users')} value={stats.totalUsers ?? 0} />
              <Stat label={t('stat_courses')} value={stats.activeCourses ?? 0} />
              <Stat label={t('stat_revenue')} value={stats.monthlyRevenue ?? 0} />
              <Stat label={t('stat_sessions')} value={stats.pendingSessions ?? 0} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
                <div className="text-sm font-extrabold text-foreground">{t('revenue_12m')}</div>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                      <XAxis dataKey="month" tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
                <div className="text-sm font-extrabold text-foreground">{t('users_30d')}</div>
                <div className="mt-4 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={users}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                      <XAxis dataKey="date" tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'rgba(148,163,184,0.9)', fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="users" stroke="#7C3AED" fill="rgba(124,58,237,0.25)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
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
      <div className="mt-2 text-2xl font-extrabold text-foreground">{value}</div>
    </div>
  )
}

