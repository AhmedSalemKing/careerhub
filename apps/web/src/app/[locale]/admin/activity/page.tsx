'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { get } from '../../../../lib/api'
import {
  Activity, Users, Eye, Clock, TrendingUp, RefreshCw,
  Search, Monitor, LogIn, ShoppingCart, BookOpen,
  MessageSquare, ClipboardList, Upload, UserPlus, Settings,
} from 'lucide-react'

const getActionConfig = (isAr: boolean): Record<string, { label: string; icon: any; color: string }> => ({
  LOGIN:         { label: isAr ? 'سجل دخول' : 'Login',              icon: LogIn,         color: '#2BBFA3' },
  REGISTER:      { label: isAr ? 'تسجيل جديد' : 'Registration',     icon: UserPlus,      color: '#10B981' },
  VIEW_COURSES:  { label: isAr ? 'تصفح الكورسات' : 'View Courses',  icon: Eye,           color: '#5120c8' },
  PAYMENT:       { label: isAr ? 'عملية دفع' : 'Payment',           icon: ShoppingCart,   color: '#F5A623' },
  UPLOAD:        { label: isAr ? 'رفع ملف' : 'Upload',              icon: Upload,        color: '#EF4444' },
  BOOK_SESSION:  { label: isAr ? 'حجز جلسة' : 'Book Session',       icon: BookOpen,      color: '#8B5CF6' },
  AI_CHAT:       { label: isAr ? 'محادثة ذكية' : 'AI Chat',         icon: MessageSquare, color: '#06B6D4' },
  ASSESSMENT:    { label: isAr ? 'اختبار تقييم' : 'Assessment',     icon: ClipboardList, color: '#F59E0B' },
  ADMIN_ACTION:  { label: isAr ? 'إجراء إداري' : 'Admin Action',    icon: Settings,      color: '#EF4444' },
  CREATE_COURSE: { label: isAr ? 'إنشاء كورس' : 'Create Course',    icon: BookOpen,      color: '#2BBFA3' },
})

function timeAgo(dateStr: string, isAr: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return isAr ? 'الآن' : 'now'
  if (mins < 60) return isAr ? `منذ ${mins} د` : `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return isAr ? `منذ ${hours} س` : `${hours}h ago`
  const days = Math.floor(hours / 24)
  return isAr ? `منذ ${days} ي` : `${days}d ago`
}

export default function ActivityMonitor() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const ACTION_CONFIG = getActionConfig(isAr)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('')

  const { data: rawData = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: async () => {
      const res = await get('/admin/activity/live?limit=100')
      return (res as any).data?.data ?? []
    },
    refetchInterval: 10000,
  })

  const { data: stats } = useQuery({
    queryKey: ['admin-activity-stats'],
    queryFn: async () => {
      const res = await get('/admin/activity/stats')
      return (res as any).data?.data ?? {}
    },
    refetchInterval: 30000,
  })

  const activities = (rawData as any[]).filter((a: any) => {
    const name = `${a.user?.profile?.firstName ?? ''} ${a.user?.profile?.lastName ?? ''} ${a.user?.email ?? ''}`.toLowerCase()
    return (!search || name.includes(search.toLowerCase())) &&
           (!filterAction || a.action === filterAction)
  })

  const uniqueActions = Array.from(new Set((rawData as any[]).map((a: any) => a.action as string)))

  // Extract active users (unique users from recent activity)
  const activeUsersMap = new Map<string, any>()
  for (const act of (rawData as any[]).slice(0, 50)) {
    if (act.user?.id && !activeUsersMap.has(act.user.id)) {
      activeUsersMap.set(act.user.id, {
        id: act.user.id,
        name: act.user.profile?.firstName
          ? `${act.user.profile.firstName} ${act.user.profile.lastName}`
          : act.user.email?.split('@')[0] ?? '?',
        initial: (act.user.profile?.firstName?.[0] || act.user.email?.[0] || '?').toUpperCase(),
        email: act.user.email,
        lastAction: act.action,
        lastSeen: act.createdAt,
        accountType: act.user.accountType,
      })
    }
  }
  const activeUsers = Array.from(activeUsersMap.values()).slice(0, 12)

  // Action counts for chart-like display
  const actionCounts: Record<string, number> = {}
  for (const act of rawData as any[]) {
    actionCounts[act.action] = (actionCounts[act.action] || 0) + 1
  }
  const topActions = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const maxCount = topActions.length > 0 ? topActions[0][1] : 1

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ─── Header ─── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
            <Activity style={{ color: '#5120c8' }} />
            {isAr ? 'مراقب النشاط المباشر' : 'Live Activity Monitor'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {isAr ? 'تتبع مباشر لنشاط المستخدمين — يتحدث كل ١٠ ثوانٍ' : 'Real-time user activity tracking — refreshes every 10 seconds'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: isDark ? 'rgba(81,32,200,0.1)' : 'rgba(81,32,200,0.06)',
            color: '#5120c8',
            border: '1px solid rgba(81,32,200,0.2)',
          }}
        >
          <RefreshCw size={14} />
          {isAr ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: isAr ? 'المستخدمون النشطون' : 'Active Users', value: (stats as any)?.onlineUsers ?? 0, icon: Users, color: '#2BBFA3' },
          { label: isAr ? 'نشاط اليوم' : "Today's Activity", value: (stats as any)?.todayActivity ?? 0, icon: TrendingUp, color: '#5120c8' },
          { label: isAr ? 'إجمالي الأحداث' : 'Total Events', value: (stats as any)?.totalActivities ?? 0, icon: Activity, color: '#F5A623' },
          { label: isAr ? 'مستخدمون فريدون' : 'Unique Users', value: activeUsersMap.size, icon: Monitor, color: '#8b5cf6' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div
              key={i}
              className="rounded-xl border p-4 transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon size={18} style={{ color: s.color }} />
                <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* ─── Live Users ─── */}
      {activeUsers.length > 0 && (
        <div
          className="rounded-xl border p-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="font-bold mb-4 flex items-center gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
            <Users size={16} style={{ color: '#2BBFA3' }} />
            {isAr ? 'المستخدمون النشطون' : 'Active Users'}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${isAr ? 'mr-2' : 'ml-2'}`}
              style={{
                background: isDark ? 'rgba(43,191,163,0.12)' : 'rgba(43,191,163,0.08)',
                color: isDark ? '#2BBFA3' : '#0d9488',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#2BBFA3' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#2BBFA3' }} />
              </span>
              {isAr ? 'مباشر' : 'Live'}
            </span>
          </h2>
          <div className="flex flex-wrap gap-3">
            {activeUsers.map((u) => {
              const actionConf = ACTION_CONFIG[u.lastAction]
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors cursor-default"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {/* Pulsing avatar */}
                  <div className="relative">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: isDark ? 'rgba(81,32,200,0.15)' : 'rgba(81,32,200,0.08)',
                        color: '#5120c8',
                      }}
                    >
                      {u.initial}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#2BBFA3' }} />
                      <span className="relative inline-flex rounded-full h-3 w-3 border-2" style={{ background: '#2BBFA3', borderColor: 'var(--surface)' }} />
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{u.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--muted)' }}>
                      {actionConf?.label ?? u.lastAction} · {timeAgo(u.lastSeen, isAr)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Two Column: Activity Feed + Action Chart ─── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Activity Feed (2/3) */}
        <div
          className="lg:col-span-2 rounded-xl border overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {/* Search + Filter */}
          <div
            className="p-4 flex gap-2 flex-wrap"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} style={{ color: 'var(--muted)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم أو الإيميل...' : 'Search by name or email...'}
                className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 rounded-lg text-sm`}
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <option value="">{isAr ? 'كل الأفعال' : 'All Actions'}</option>
              {uniqueActions.map((a) => (
                <option key={a} value={a}>{ACTION_CONFIG[a]?.label ?? a}</option>
              ))}
            </select>
          </div>

          {/* Feed items */}
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {isLoading ? (
              <div className="p-12 text-center">
                <div
                  className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-t-transparent mb-3"
                  style={{ borderColor: '#5120c8', borderTopColor: 'transparent' }}
                />
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-12 text-center">
                <Activity size={40} style={{ color: 'var(--muted)', opacity: 0.3, margin: '0 auto 12px' }} />
                <p className="font-medium" style={{ color: 'var(--muted)' }}>{isAr ? 'لا يوجد نشاط' : 'No activity'}</p>
              </div>
            ) : (
              activities.slice(0, 30).map((act: any, i: number) => {
                const conf = ACTION_CONFIG[act.action] || { label: act.action, icon: Activity, color: '#5120c8' }
                const ActionIcon = conf.icon
                const name = act.user?.profile?.firstName
                  ? `${act.user.profile.firstName} ${act.user.profile.lastName}`
                  : act.user?.email?.split('@')[0] ?? '?'
                const initial = (act.user?.profile?.firstName?.[0] || act.user?.email?.[0] || '?').toUpperCase()

                return (
                  <div
                    key={act.id || i}
                    className="flex items-center gap-3 px-4 py-3 transition-colors"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      animation: i < 3 ? `fadeUp 0.3s ease ${i * 0.1}s both` : undefined,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background: isDark ? `${conf.color}20` : `${conf.color}10`,
                        color: conf.color,
                      }}
                    >
                      {initial}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{name}</span>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{
                            background: isDark ? `${conf.color}18` : `${conf.color}10`,
                            color: conf.color,
                          }}
                        >
                          <ActionIcon size={10} />
                          {conf.label}
                        </span>
                      </div>
                      {act.entity && (
                        <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{act.entity}</p>
                      )}
                    </div>

                    {/* Time */}
                    <div className="text-[11px] shrink-0 flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                      <Clock size={10} />
                      {timeAgo(act.createdAt, isAr)}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Action Distribution (1/3) */}
        <div
          className="rounded-xl border p-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <TrendingUp size={16} style={{ color: '#5120c8' }} />
            {isAr ? 'توزيع النشاطات' : 'Activity Distribution'}
          </h3>

          {topActions.length === 0 ? (
            <div className="py-8 text-center">
              <TrendingUp size={32} style={{ color: 'var(--muted)', opacity: 0.3, margin: '0 auto 8px' }} />
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{isAr ? 'لا توجد بيانات بعد' : 'No data yet'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topActions.map(([action, count]) => {
                const conf = ACTION_CONFIG[action] || { label: action, icon: Activity, color: '#5120c8' }
                const ActionIcon = conf.icon
                const pct = Math.round((count / maxCount) * 100)
                return (
                  <div key={action}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                        <ActionIcon size={12} style={{ color: conf.color }} />
                        {conf.label}
                      </span>
                      <span className="text-xs font-bold" style={{ color: conf.color }}>{count}</span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: conf.color,
                          opacity: 0.8,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Quick summary */}
          <div
            className="mt-5 pt-4"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <div className="space-y-2">
              {[
                { label: isAr ? 'إجمالي الأحداث' : 'Total Events', value: (rawData as any[]).length },
                { label: isAr ? 'أنواع النشاط' : 'Action Types', value: uniqueActions.length },
                { label: isAr ? 'مستخدمون فريدون' : 'Unique Users', value: activeUsersMap.size },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{item.label}</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
