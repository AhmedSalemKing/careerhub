'use client'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { api } from '../../../lib/api'
import {
  Users,
  BookOpen,
  DollarSign,
  AlertCircle,
  TrendingUp,
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
  pendingUsers: number
  totalRevenue: number
  monthlyRevenue: number
  todayRevenue: number
  recentUsers: RecentUser[]
  monthlyChart: { month: string; revenue: number }[]
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: string // Should be a Tailwind class like 'bg-blue-600'
}) {
  return (
    <div 
      className="rounded-2xl p-5 border relative overflow-hidden group"
      style={{ 
        background: '#141414', // لون الكرت الداكن ليبرز
        borderColor: 'rgba(255,255,255,0.05)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}
    >
      {/* Subtle inner glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />

      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
        <div className={`p-2.5 rounded-xl shadow-lg ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold mb-1 relative z-10" style={{ color: '#ffffff' }}>{value}</p>
      {sub && <p className="text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>}
    </div>
  )
}

export default function AdminOverviewPage() {
  const locale = useLocale()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => {
        const d = res?.data?.data ?? res?.data
        setStats(d)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        جاري التحميل...
      </div>
    )
  }

  const maxRevenue = Math.max(...(stats?.monthlyChart?.map(m => m.revenue) ?? [1]), 1)
  const pendingCount = stats?.pendingUsers ?? 0
  const recentUsers = stats?.recentUsers ?? []

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#ffffff', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>نظرة عامة على المنصة</h1>
      </div>

      {/* Pending approval alert */}
      {pendingCount > 0 && (
        <Link href={`/${locale}/admin/approvals`}>
          <div className="flex items-center gap-3 p-4 rounded-xl transition-all duration-300 border border-amber-500/20 hover:border-amber-500/40" 
               style={{ background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)' }}>
            <div className="p-2 rounded-lg bg-amber-500/20">
              <AlertCircle size={18} className="text-amber-400 shrink-0" />
            </div>
            <span className="text-amber-200 text-sm font-medium">
              {pendingCount} طلب{pendingCount !== 1 ? 'ات' : ''} تنتظر الموافقة — انقر للمراجعة
            </span>
          </div>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="إجمالي المستخدمين"
          value={stats?.totalUsers ?? 0}
          sub={`${pendingCount} طلب معلق`}
          icon={Users}
          color="bg-blue-600"
        />
        <StatCard
          label="الكورسات المنشورة"
          value={stats?.totalCourses ?? 0}
          sub="كورس نشط"
          icon={BookOpen}
          color="bg-emerald-500"
        />
        <StatCard
          label="إيرادات الشهر"
          value={`${(stats?.monthlyRevenue ?? 0).toLocaleString()} ر.س`}
          sub={`اليوم: ${(stats?.todayRevenue ?? 0).toLocaleString()} ر.س`}
          icon={TrendingUp}
          color="bg-amber-500"
        />
        <StatCard
          label="إجمالي الإيرادات"
          value={`${(stats?.totalRevenue ?? 0).toLocaleString()} ر.س`}
          sub="منذ الإطلاق"
          icon={DollarSign}
          color="bg-purple-600"
        />
      </div>

      {/* Revenue chart */}
      <div 
        className="rounded-2xl p-6 border relative overflow-hidden"
        style={{ 
          background: '#141414', 
          borderColor: 'rgba(255,255,255,0.05)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
      >
        <div className="flex items-center gap-2 mb-6 relative z-10">
          <div className="p-1.5 rounded-lg bg-blue-500/20">
            <TrendingUp size={16} className="text-blue-400" />
          </div>
          <h2 className="text-sm font-semibold" style={{ color: '#ffffff', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            الإيرادات — آخر 12 شهر
          </h2>
        </div>
        <div className="flex items-end gap-2 h-40 w-full relative z-10">
          {(stats?.monthlyChart ?? []).map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
              <div
                className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm transition-all duration-300 group-hover:from-blue-500 group-hover:to-blue-300"
                style={{
                  height: `${Math.round((m.revenue / maxRevenue) * 100)}%`,
                  minHeight: m.revenue > 0 ? '4px' : '0',
                  boxShadow: '0 0 10px rgba(37, 99, 235, 0.2)'
                }}
              />
              <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{m.month}</span>
            </div>
          ))}
          {(!stats?.monthlyChart || stats.monthlyChart.length === 0) && (
            <div className="w-full flex items-center justify-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              لا توجد بيانات إيرادات بعد
            </div>
          )}
        </div>
      </div>

      {/* Recent users */}
      <div 
        className="rounded-2xl p-6 border relative overflow-hidden"
        style={{ 
          background: '#141414', 
          borderColor: 'rgba(255,255,255,0.05)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
      >
        <div className="flex items-center justify-between mb-4 relative z-10">
          <h2 className="text-sm font-semibold" style={{ color: '#ffffff', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            أحدث المستخدمين
          </h2>
          <Link href={`/${locale}/admin/users`} className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
            عرض الكل ←
          </Link>
        </div>
        <div className="space-y-1 relative z-10">
          {recentUsers.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'rgba(255,255,255,0.5)' }}>لا يوجد مستخدمون بعد</p>
          ) : (
            recentUsers.map(u => (
              <div key={u.id} className="flex items-center gap-4 py-3 last:border-0 transition-colors hover:bg-white/[0.02] px-2 -mx-2 rounded-lg" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: '50%',
                  background: '#5120c8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                  flexShrink: 0, boxShadow: '0 0 10px rgba(81,32,200,0.3)',
                }}>
                  {u.profile?.firstName?.[0] ?? u.email[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="text-sm font-semibold truncate" style={{ color: '#ffffff', margin: 0 }}>
                    {u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    padding: '3px 10px', borderRadius: 100,
                    background: u.accountType === 'INSTRUCTOR' ? 'rgba(16, 185, 129, 0.15)' :
                                u.accountType === 'CONSULTANT' ? 'rgba(245, 166, 35, 0.15)' :
                                'rgba(81, 32, 200, 0.15)',
                    color: u.accountType === 'INSTRUCTOR' ? '#10B981' :
                           u.accountType === 'CONSULTANT' ? '#F59E0B' : '#A78BFA',
                  }}>
                    {u.accountType === 'STUDENT' ? 'طالب' :
                     u.accountType === 'INSTRUCTOR' ? 'محاضر' :
                     u.accountType === 'CONSULTANT' ? 'مستشار' : u.accountType}
                  </span>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {new Date(u.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}