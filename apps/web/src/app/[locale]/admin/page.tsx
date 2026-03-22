'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../lib/api'
import { unwrap } from '../../../lib/unwrap'
import { AuthGate } from '../../components/AuthGate'
import { AdminShell } from '../../components/AdminShell'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../../lib/toast'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Users, BookOpen, DollarSign, Calendar, ArrowUpRight } from 'lucide-react'

type AdminDashboard = {
  stats?: {
    totalUsers: number
    activeCourses: number
    monthlyRevenue: number
    pendingSessions: number
  }
  revenueLast12Months?: Array<{ month: string; revenue: number }>
  newUsersLast30Days?: Array<{ date: string; users: number }>
  recentUsers?: any[]
  recentPayments?: any[]
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
      const res = await get('/admin/dashboard')
      const data = unwrap(res) as any
      return (data?.dashboard ?? data?.data?.dashboard ?? data) as AdminDashboard
    },
    placeholderData: (previousData) => previousData,
  })

  const stats = q.data?.stats ?? { totalUsers: 0, activeCourses: 0, monthlyRevenue: 0, pendingSessions: 0 }
  const revenue = q.data?.revenueLast12Months ?? []
  const users = q.data?.newUsersLast30Days ?? []
  const recentUsers = q.data?.recentUsers ?? []
  const recentPayments = q.data?.recentPayments ?? []

  return (
    <AuthGate requireRole="ADMIN">
      <AdminShell title={a('dashboard')} subtitle={t('subtitle')}>
        {q.isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Skeleton className="h-80 rounded-2xl" />
              <Skeleton className="h-80 rounded-2xl" />
            </div>
          </div>
        ) : q.isError ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <div className="text-sm text-[color:var(--muted)]">{e('something_wrong')}</div>
            <button
              type="button"
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
              onClick={() => q.refetch()}
            >
              {c('retry')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              <Stat label={t('stat_users')} value={stats.totalUsers} icon={<Users className="h-5 w-5" />} color="blue" />
              <Stat label={t('stat_courses')} value={stats.activeCourses} icon={<BookOpen className="h-5 w-5" />} color="green" />
              <Stat label={t('stat_revenue')} value={`${stats.monthlyRevenue} EGP`} icon={<DollarSign className="h-5 w-5" />} color="amber" />
              <Stat label={t('stat_sessions')} value={stats.pendingSessions} icon={<Calendar className="h-5 w-5" />} color="purple" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-extrabold text-foreground">{t('revenue_12m')}</div>
                </div>
                <div className="mt-6 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                      <XAxis dataKey="month" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px' }}
                        itemStyle={{ color: 'var(--foreground)', fontSize: '12px' }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-extrabold text-foreground">{t('users_30d')}</div>
                </div>
                <div className="mt-6 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={users}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(148,163,184,0.7)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px' }}
                        itemStyle={{ color: 'var(--foreground)', fontSize: '12px' }}
                      />
                      <Bar dataKey="users" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
                <div className="flex items-center justify-between border-b border-[color:var(--border)] p-5">
                  <h3 className="text-sm font-extrabold text-foreground">{t('recent_users')}</h3>
                  <ArrowUpRight className="h-4 w-4 text-[color:var(--muted)]" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left rtl:text-right">
                    <thead className="bg-gray-50/50 text-xs font-bold uppercase text-[color:var(--muted)] dark:bg-gray-800/50">
                      <tr>
                        <th className="px-5 py-3">{c('name')}</th>
                        <th className="px-5 py-3">{c('email')}</th>
                        <th className="px-5 py-3">{c('date')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--border)]">
                      {recentUsers.length > 0 ? recentUsers.map((u: any) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                          <td className="px-5 py-3 text-sm font-medium text-foreground">
                            {u.profile?.firstName} {u.profile?.lastName}
                          </td>
                          <td className="px-5 py-3 text-sm text-[color:var(--muted)]">{u.email}</td>
                          <td className="px-5 py-3 text-sm text-[color:var(--muted)]">{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={3} className="px-5 py-10 text-center text-sm text-[color:var(--muted)]">{c('empty')}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
                <div className="flex items-center justify-between border-b border-[color:var(--border)] p-5">
                  <h3 className="text-sm font-extrabold text-foreground">{t('recent_payments')}</h3>
                  <ArrowUpRight className="h-4 w-4 text-[color:var(--muted)]" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left rtl:text-right">
                    <thead className="bg-gray-50/50 text-xs font-bold uppercase text-[color:var(--muted)] dark:bg-gray-800/50">
                      <tr>
                        <th className="px-5 py-3">{c('user')}</th>
                        <th className="px-5 py-3">{c('amount')}</th>
                        <th className="px-5 py-3">{c('status')}</th>
                        <th className="px-5 py-3">{c('date')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--border)]">
                      {recentPayments.length > 0 ? recentPayments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                          <td className="px-5 py-3 text-sm font-medium text-foreground">
                            {p.user?.profile?.firstName} {p.user?.profile?.lastName}
                          </td>
                          <td className="px-5 py-3 text-sm font-bold text-foreground">{p.amount} {p.currency}</td>
                          <td className="px-5 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                              p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                              'bg-red-100 text-red-700'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-[color:var(--muted)]">{new Date(p.createdAt).toLocaleDateString()}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-[color:var(--muted)]">{c('empty')}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminShell>
    </AuthGate>
  )
}

function Stat({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: 'blue' | 'green' | 'amber' | 'purple' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <div className="text-xs font-bold text-[color:var(--muted)] uppercase tracking-wider">{label}</div>
          <div className="mt-1 text-2xl font-black text-foreground">{value}</div>
        </div>
      </div>
    </div>
  )
}
