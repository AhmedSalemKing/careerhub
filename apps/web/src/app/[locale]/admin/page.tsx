'use client'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { api } from '../../../lib/api'
import {
  Users, BookOpen, DollarSign, TrendingUp, AlertCircle,
  PlusCircle, CheckCircle, ClipboardList, BarChart2,
  ArrowLeft, UserPlus,
} from 'lucide-react'

type RecentUser = {
  id: string
  email: string
  accountType: string
  status: string
  createdAt: string
  profile?: { firstName: string; lastName: string; avatar?: string }
}

type StatsData = {
  totalUsers: number
  totalCourses: number
  publishedCourses: number
  pendingUsers: number
  totalRevenue: number
  monthlyRevenue: number
  todayRevenue: number
  recentUsers: RecentUser[]
  monthlyChart: { month: string; revenue: number }[]
}

const formatPrice = (amount: number) => {
  if (!amount || amount === 0) return 'مجاني'
  return `${amount.toLocaleString('ar-SA')} ر.س`
}

export default function AdminOverviewPage() {
  const locale = useLocale()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then((res) => {
        const d = res?.data?.data ?? res?.data
        setStats(d)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: '#5120c8', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  const totalUsers = stats?.totalUsers ?? 0
  const publishedCourses = stats?.publishedCourses ?? stats?.totalCourses ?? 0
  const monthlyRevenue = stats?.monthlyRevenue ?? 0
  const totalRevenue = stats?.totalRevenue ?? 0
  const todayRevenue = stats?.todayRevenue ?? 0
  const pendingCount = stats?.pendingUsers ?? 0
  const recentUsers = stats?.recentUsers ?? []
  const monthlyChart = stats?.monthlyChart ?? []
  const maxRevenue = Math.max(...monthlyChart.map((m) => m.revenue), 1)

  const accountTypeLabel = (t: string) => {
    const map: Record<string, string> = { STUDENT: 'طالب', INSTRUCTOR: 'محاضر', CONSULTANT: 'مستشار', ADMIN: 'مدير', SUPER_ADMIN: 'مدير أعلى' }
    return map[t] ?? t
  }

  const accountTypeColor = (t: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      STUDENT:     { bg: isDark ? 'rgba(81,32,200,0.15)' : 'rgba(81,32,200,0.08)', text: '#5120c8' },
      INSTRUCTOR:  { bg: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)', text: isDark ? '#34d399' : '#059669' },
      CONSULTANT:  { bg: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)', text: isDark ? '#fbbf24' : '#d97706' },
      ADMIN:       { bg: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)', text: isDark ? '#f87171' : '#dc2626' },
      SUPER_ADMIN: { bg: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)', text: isDark ? '#f87171' : '#dc2626' },
    }
    return map[t] ?? map.STUDENT
  }

  return (
    <div dir="rtl" className="space-y-6">

      {/* ─── Header ─── */}
      <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
        نظرة عامة على المنصة
      </h1>

      {/* ─── Pending Alert ─── */}
      {pendingCount > 0 && (
        <Link href={`/${locale}/admin/approvals`}>
          <div
            className="flex items-center gap-3 p-4 rounded-xl transition-all border"
            style={{
              background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.05)',
              borderColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)',
            }}
          >
            <div
              className="p-2 rounded-lg"
              style={{ background: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)' }}
            >
              <AlertCircle size={18} style={{ color: isDark ? '#fbbf24' : '#d97706' }} />
            </div>
            <span className="text-sm font-medium" style={{ color: isDark ? '#fcd34d' : '#92400e' }}>
              {pendingCount} طلب{pendingCount !== 1 ? 'ات' : ''} تنتظر الموافقة — انقر للمراجعة
            </span>
          </div>
        </Link>
      )}

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المستخدمين', value: totalUsers, sub: `${pendingCount} طلب معلق`, icon: Users, color: '#3b82f6' },
          { label: 'الكورسات المنشورة', value: publishedCourses, sub: 'كورس نشط', icon: BookOpen, color: '#10b981' },
          { label: 'إيرادات الشهر', value: formatPrice(monthlyRevenue), sub: `اليوم: ${formatPrice(todayRevenue)}`, icon: TrendingUp, color: '#f59e0b' },
          { label: 'إجمالي الإيرادات', value: formatPrice(totalRevenue), sub: 'منذ الإطلاق', icon: DollarSign, color: '#5120c8' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div
              key={i}
              className="rounded-xl p-5 border transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{s.label}</span>
                <div
                  className="p-2.5 rounded-xl"
                  style={{ background: isDark ? `${s.color}20` : `${s.color}10` }}
                >
                  <Icon size={16} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>{s.value}</p>
              {s.sub && <p className="text-xs" style={{ color: 'var(--muted)' }}>{s.sub}</p>}
            </div>
          )
        })}
      </div>

      {/* ─── Quick Actions ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'إضافة كورس', href: `/${locale}/admin/create-course`, icon: PlusCircle, color: '#5120c8' },
          { label: 'مراجعة الطلبات', href: `/${locale}/admin/approvals`, icon: ClipboardList, color: '#f59e0b' },
          { label: 'إدارة المستخدمين', href: `/${locale}/admin/users`, icon: UserPlus, color: '#3b82f6' },
          { label: 'تقرير الإيرادات', href: `/${locale}/admin/revenue`, icon: BarChart2, color: '#10b981' },
        ].map((a, i) => {
          const Icon = a.icon
          return (
            <Link key={i} href={a.href}>
              <div
                className="rounded-xl p-4 border transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer flex items-center gap-3"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div
                  className="p-2 rounded-lg shrink-0"
                  style={{ background: isDark ? `${a.color}15` : `${a.color}08` }}
                >
                  <Icon size={18} style={{ color: a.color }} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{a.label}</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ─── Revenue Chart ─── */}
      <div
        className="rounded-xl p-6 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 size={18} style={{ color: '#5120c8' }} />
          <h2 className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
            الإيرادات — آخر ١٢ شهر
          </h2>
        </div>
        {monthlyChart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <BarChart2 size={40} style={{ color: 'var(--muted)', opacity: 0.3 }} />
            <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>لا توجد بيانات إيرادات بعد</p>
          </div>
        ) : (
          <div className="flex items-end gap-2 h-40 w-full">
            {monthlyChart.map((m) => {
              const heightPct = Math.round((m.revenue / maxRevenue) * 100)
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full">
                    <div
                      className="w-full rounded-t transition-all duration-300"
                      style={{
                        height: `${heightPct}%`,
                        minHeight: m.revenue > 0 ? '4px' : '0',
                        background: isDark
                          ? 'linear-gradient(to top, #5120c8, #8b5cf6)'
                          : 'linear-gradient(to top, #5120c8, #a78bfa)',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>{m.month}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Recent Users ─── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Users size={16} style={{ color: '#5120c8' }} />
            أحدث المستخدمين
          </h2>
          <Link
            href={`/${locale}/admin/users`}
            className="text-xs font-medium flex items-center gap-1 transition-colors"
            style={{ color: '#5120c8' }}
          >
            عرض الكل
            <ArrowLeft size={12} />
          </Link>
        </div>

        {recentUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} style={{ color: 'var(--muted)', opacity: 0.3, margin: '0 auto 12px' }} />
            <p className="font-medium" style={{ color: 'var(--muted)' }}>لا يوجد مستخدمون بعد</p>
          </div>
        ) : (
          <div>
            {recentUsers.map((u) => {
              const colors = accountTypeColor(u.accountType)
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{
                      background: isDark ? 'rgba(81,32,200,0.15)' : 'rgba(81,32,200,0.08)',
                      color: '#5120c8',
                    }}
                  >
                    {u.profile?.firstName?.[0] ?? u.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                      {u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {accountTypeLabel(u.accountType)}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
