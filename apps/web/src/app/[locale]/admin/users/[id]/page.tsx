'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { get } from '../../../../../lib/api'
import {
  ArrowRight, LayoutDashboard, Activity, BookOpen, CreditCard, Wallet, Briefcase,
  TrendingUp, User, Shield, Calendar, GraduationCap, CheckCircle, DollarSign,
  Key, LogOut, UserPlus, Search, PlusCircle,
} from 'lucide-react'

const TABS = [
  { id: 'overview', icon: LayoutDashboard, labelAr: 'نظرة عامة', labelEn: 'Overview' },
  { id: 'activity', icon: Activity, labelAr: 'سجل النشاط', labelEn: 'Activity' },
  { id: 'courses', icon: BookOpen, labelAr: 'الكورسات', labelEn: 'Courses' },
  { id: 'payments', icon: CreditCard, labelAr: 'المدفوعات', labelEn: 'Payments' },
]

const FILTERS = [
  { key: '24h', labelAr: 'آخر 24 ساعة', labelEn: 'Last 24h' },
  { key: '7d', labelAr: 'أسبوع', labelEn: 'Week' },
  { key: '30d', labelAr: '30 يوم', labelEn: '30 days' },
  { key: 'all', labelAr: 'الكل', labelEn: 'All' },
]

const ACTION_META: Record<string, { icon: any; color: string; bg: string; labelAr: string; labelEn: string }> = {
  VIEW_COURSE: { icon: BookOpen, color: '#007AFF', bg: 'rgba(0, 122, 255, 0.1)', labelAr: 'مشاهدة كورس', labelEn: 'View course' },
  VIDEO_WATCH: { icon: BookOpen, color: '#007AFF', bg: 'rgba(0, 122, 255, 0.1)', labelAr: 'مشاهدة كورس', labelEn: 'View course' },
  ENROLL_COURSE: { icon: CheckCircle, color: '#34C759', bg: 'rgba(52, 199, 89, 0.1)', labelAr: 'تسجيل في كورس', labelEn: 'Enroll course' },
  ENROLLMENT: { icon: CheckCircle, color: '#34C759', bg: 'rgba(52, 199, 89, 0.1)', labelAr: 'تسجيل في كورس', labelEn: 'Enroll course' },
  COMPLETE_COURSE: { icon: GraduationCap, color: '#F5A623', bg: 'rgba(245, 166, 35, 0.1)', labelAr: 'إكمال كورس', labelEn: 'Complete course' },
  COURSE_COMPLETE: { icon: GraduationCap, color: '#F5A623', bg: 'rgba(245, 166, 35, 0.1)', labelAr: 'إكمال كورس', labelEn: 'Complete course' },
  LOGIN: { icon: Key, color: '#5120C8', bg: 'rgba(81, 32, 200, 0.1)', labelAr: 'تسجيل دخول', labelEn: 'Login' },
  LOGOUT: { icon: LogOut, color: '#8E8E93', bg: 'rgba(142, 142, 147, 0.1)', labelAr: 'تسجيل خروج', labelEn: 'Logout' },
  PAYMENT_SUCCESS: { icon: DollarSign, color: '#34C759', bg: 'rgba(52, 199, 89, 0.1)', labelAr: 'دفع ناجح', labelEn: 'Payment success' },
  PAYMENT: { icon: DollarSign, color: '#34C759', bg: 'rgba(52, 199, 89, 0.1)', labelAr: 'دفع ناجح', labelEn: 'Payment success' },
  BOOK_SESSION: { icon: Calendar, color: '#5120C8', bg: 'rgba(81, 32, 200, 0.1)', labelAr: 'حجز جلسة', labelEn: 'Book session' },
  SEARCH_COURSES: { icon: Search, color: '#6E6E73', bg: 'rgba(110, 110, 115, 0.1)', labelAr: 'بحث في الكورسات', labelEn: 'Search courses' },
  REGISTER: { icon: UserPlus, color: '#34C759', bg: 'rgba(52, 199, 89, 0.1)', labelAr: 'إنشاء حساب', labelEn: 'Register' },
}

const DEFAULT_ACTION = { icon: Activity, color: '#6E6E73', bg: 'rgba(110, 110, 115, 0.1)', labelAr: 'نشاط', labelEn: 'Activity' }

function getActionMeta(action: string) {
  const key = (action || '').toUpperCase()
  return ACTION_META[key] || DEFAULT_ACTION
}

const ROLE_LABELS: Record<string, { ar: string; en: string }> = {
  STUDENT: { ar: 'طالب', en: 'Student' },
  INSTRUCTOR: { ar: 'محاضر', en: 'Instructor' },
  CONSULTANT: { ar: 'مستشار', en: 'Consultant' },
  ADMIN: { ar: 'مدير', en: 'Admin' },
}

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  ACTIVE: { ar: 'نشط', en: 'Active' },
  PENDING: { ar: 'قيد المراجعة', en: 'Pending' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected' },
  BANNED: { ar: 'محظور', en: 'Banned' },
}

function roleLabel(role: string | undefined, isAr: boolean) {
  const mapped = ROLE_LABELS[role || ''] || ROLE_LABELS[(role || '').toUpperCase()]
  return mapped ? (isAr ? mapped.ar : mapped.en) : role || '-'
}

function statusLabel(status: string | undefined, isAr: boolean) {
  const mapped = STATUS_LABELS[status || ''] || STATUS_LABELS[(status || '').toUpperCase()]
  return mapped ? (isAr ? mapped.ar : mapped.en) : status || '-'
}

function paymentType(item: any) {
  return item?.itemType === 'SESSION' ? 'SESSION' : item?.itemType === 'WALLET' ? 'WALLET' : 'COURSE'
}

function paymentTitle(item: any, isAr: boolean) {
  return item?.course?.titleEn || item?.course?.titleAr || item?.description || (isAr ? 'دفع' : 'Payment')
}

function formatCurrency(amount: number, isAr: boolean) {
  const val = Number(amount) || 0
  return `${val.toLocaleString(isAr ? 'ar-SA' : 'en-US')} ${isAr ? 'ر.س' : 'SAR'}`
}

function formatDate(date: string | Date | null | undefined, isAr: boolean) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(isAr ? 'ar-EG-u-ca-gregory' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimeAgo(date: string | Date | null | undefined, isAr: boolean) {
  if (!date) return '-'
  const now = new Date()
  const then = new Date(date)
  const diff = now.getTime() - then.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return isAr ? `منذ ${days} يوم` : `${days}d ago`
  if (hours > 0) return isAr ? `منذ ${hours} ساعة` : `${hours}h ago`
  if (mins > 0) return isAr ? `منذ ${mins} دقيقة` : `${mins}m ago`
  return isAr ? 'الآن' : 'now'
}

function startOfDay(d: Date) {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function groupActivities(items: any[], isAr: boolean) {
  const dayNow = startOfDay(new Date()).getTime()
  const dayYesterday = dayNow - 86400000
  const dayWeek = dayNow - 6 * 86400000

  const groups: { key: string; label: string; items: any[] }[] = []
  const buckets: Record<string, any[]> = {}

  for (const item of items || []) {
    const t = startOfDay(new Date(item?.createdAt || Date.now())).getTime()
    let key = 'older'
    if (t === dayNow) key = 'today'
    else if (t === dayYesterday) key = 'yesterday'
    else if (t >= dayWeek) key = 'week'
    ;(buckets[key] = buckets[key] || []).push(item)
  }

  const order = ['today', 'yesterday', 'week', 'older']
  const labels: Record<string, string> = {
    today: isAr ? 'اليوم' : 'Today',
    yesterday: isAr ? 'أمس' : 'Yesterday',
    week: isAr ? 'هذا الأسبوع' : 'This Week',
    older: isAr ? 'أقدم' : 'Earlier',
  }

  for (const key of order) {
    const bucket = buckets[key]
    if (bucket && bucket.length) groups.push({ key, label: labels[key], items: bucket })
  }

  return groups
}

export default function UserDetailPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [activeTab, setActiveTab] = useState('overview')
  const [activityFilter, setActivityFilter] = useState('all')

  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: async () => {
      const res = await get(`/admin/users/${userId}/detail`)
      return (res as any).data?.data
    },
  })

  const { data: financials, isLoading: loadingFinancials } = useQuery({
    queryKey: ['admin-user-financials', userId],
    queryFn: async () => {
      const res = await get(`/admin/users/${userId}/financials`)
      return (res as any).data?.data
    },
  })

  const { data: activityData, isLoading: loadingActivity } = useQuery({
    queryKey: ['admin-user-activity', userId, activityFilter],
    queryFn: async () => {
      const res = await get(`/admin/users/${userId}/activity?filter=${activityFilter}`)
      return (res as any).data?.data
    },
    enabled: activeTab === 'activity',
  })

  const user = userData?.user
  const enrollments = financials?.enrollments || userData?.enrollments || []
  const createdCourses = financials?.createdCourses || []
  const payments = financials?.payments || financials?.recentPayments || []
  const activities = activityData || userData?.activities || []

  const totalPaid = payments.filter((p: any) => p.status === 'SUCCESS' || p.status === 'COMPLETED').reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
  const totalEarnings = financials?.totalEarnings || 0
  const walletBalance = financials?.walletBalance || 0
  const enrolledCount = enrollments.length
  const createdCount = createdCourses.length
  const paymentCount = payments.length

  const STATS: { label: string; value: string | number; subValue?: string; icon: any; color: string; bg: string }[] = [
    { label: isAr ? 'إجمالي الدفع' : 'Total Payments', value: formatCurrency(totalPaid, isAr), subValue: paymentCount > 0 ? `${paymentCount} ${isAr ? 'عملية' : 'transactions'}` : undefined, icon: Wallet, color: '#5120C8', bg: 'rgba(81, 32, 200, 0.1)' },
    { label: isAr ? 'الكورسات' : 'Courses', value: enrolledCount + createdCount, subValue: `${enrolledCount} ${isAr ? 'مشترك' : 'enrolled'} / ${createdCount} ${isAr ? 'منشأ' : 'created'}`, icon: BookOpen, color: '#007AFF', bg: 'rgba(0, 122, 255, 0.1)' },
    { label: isAr ? 'الأرباح' : 'Earnings', value: formatCurrency(totalEarnings, isAr), icon: TrendingUp, color: '#34C759', bg: 'rgba(52, 199, 89, 0.1)' },
    { label: isAr ? 'المحفظة' : 'Wallet Balance', value: formatCurrency(walletBalance, isAr), icon: Briefcase, color: '#F5A623', bg: 'rgba(245, 166, 35, 0.1)' },
  ]

  const activityGroups = groupActivities(activities, isAr)

  const isLoading = loadingUser || loadingFinancials || (activeTab === 'activity' && loadingActivity)

  if (isLoading) return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(81,32,200,0.2)', borderTopColor: '#5120c8', borderRadius: '50%', animation: 'dw-spin 0.8s linear infinite' }} />
      <style>{`@keyframes dw-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <style>{`@keyframes dw-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ArrowRight size={18} style={{ color: 'var(--foreground)' }} />
          </button>

          <div
            style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(81, 32, 200, 0.1)', color: '#5120C8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, flexShrink: 0,
            }}
          >
            {user?.profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', margin: 0, lineHeight: 1.2 }}>
              {user?.profile?.firstName} {user?.profile?.lastName}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0', direction: 'ltr', textAlign: isAr ? 'right' : 'left' }}>
              {user?.email}
            </p>
          </div>

          <div style={{ flexShrink: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, background: 'rgba(81, 32, 200, 0.1)', color: '#5120C8' }}>
              <User size={13} />
              {roleLabel(user?.accountType || user?.role, isAr)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 12,
                  fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                  border: active ? '1px solid rgba(81, 32, 200, 0.3)' : '1px solid transparent',
                  background: active ? 'rgba(81, 32, 200, 0.1)' : 'transparent',
                  color: active ? '#5120C8' : 'var(--muted)',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
                {isAr ? tab.labelAr : tab.labelEn}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: 1400, margin: '0 auto' }}>

      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
            {STATS.map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} style={{ padding: 20, borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{stat.label}</span>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1 }}>{stat.value}</div>
                  {stat.subValue && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{stat.subValue}</div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            <div style={{ padding: 24, borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 20px' }}>
                {isAr ? 'معلومات الحساب' : 'Account Info'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: User, label: isAr ? 'الدور' : 'Role', value: roleLabel(user?.accountType || user?.role, isAr) },
                  { icon: Shield, label: isAr ? 'الحالة' : 'Status', value: statusLabel(user?.status, isAr) },
                  { icon: Calendar, label: isAr ? 'تاريخ الانضمام' : 'Joined', value: formatDate(user?.createdAt, isAr) },
                ].map((row, i) => {
                  const Icon = row.icon
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface)', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={14} />
                      </div>
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--muted)' }}>{row.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>{row.value}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ padding: 24, borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 20px' }}>
                {isAr ? 'النشاط الأخير' : 'Recent Activity'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                {activities.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
                    {isAr ? 'لا يوجد نشاط مسجل بعد' : 'No activity recorded yet'}
                  </p>
                ) : activities.slice(0, 5).map((act: any, i: number) => {
                  const meta = getActionMeta(act?.action)
                  const Icon = meta.icon
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 10, borderRadius: 10, background: 'var(--surface)' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
                          {isAr ? meta.labelAr : meta.labelEn}
                        </p>
                        {act?.metadata?.courseTitle && (
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>{act.metadata.courseTitle}</p>
                        )}
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>{formatTimeAgo(act.createdAt, isAr)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActivityFilter(filter.key)}
                style={{
                  background: activityFilter === filter.key ? '#5120C8' : 'var(--surface-2)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: activityFilter === filter.key ? '#fff' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {isAr ? filter.labelAr : filter.labelEn}
              </button>
            ))}
          </div>

          {activityGroups.length === 0 ? (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <Activity size={36} color="var(--muted)" style={{ marginBottom: 12 }} />
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
                {isAr ? 'لا يوجد نشاط مسجل' : 'No activity recorded'}
              </p>
            </div>
          ) : activityGroups.map((group) => (
            <div key={group.key}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '24px 0 12px' }}>
                {group.label}
              </h3>
              {group.items.map((act: any, i: number) => {
                const meta = getActionMeta(act?.action)
                const Icon = meta.icon
                const entityName = act?.entity === 'Course' ? (isAr ? 'كورس' : 'course')
                  : act?.entity === 'Session' ? (isAr ? 'جلسة' : 'session')
                  : act?.entity === 'Payment' ? (isAr ? 'دفع' : 'payment')
                  : act?.entity
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: 16, borderRadius: 14, background: 'var(--surface)', marginBottom: 8 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: meta.bg, color: meta.color }}>
                          {isAr ? meta.labelAr : meta.labelEn}
                        </span>
                        {entityName && (
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{entityName}</span>
                        )}
                      </div>
                      {act?.metadata?.courseTitle && (
                        <p style={{ fontSize: 13, color: 'var(--foreground)', margin: '4px 0 0' }}>{act.metadata.courseTitle}</p>
                      )}
                      {act?.metadata?.consultantName && (
                        <p style={{ fontSize: 13, color: 'var(--foreground)', margin: '4px 0 0' }}>{act.metadata.consultantName}</p>
                      )}
                      {act?.metadata?.query && (
                        <p style={{ fontSize: 13, color: 'var(--foreground)', margin: '4px 0 0' }}>
                          {isAr ? 'بحث: ' : 'Search: '}{act.metadata.query}
                        </p>
                      )}
                      {Boolean(act?.metadata?.amount) && (
                        <p style={{ fontSize: 13, color: 'var(--foreground)', margin: '4px 0 0' }}>
                          {formatCurrency(act.metadata.amount, isAr)}
                        </p>
                      )}
                      <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>
                        {formatDate(act.createdAt, isAr)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'courses' && (
        <div>
          {enrolledCount === 0 && createdCount === 0 ? (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <GraduationCap size={40} color="var(--muted)" style={{ marginBottom: 12 }} />
              <p style={{ color: 'var(--muted)', fontSize: 14, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                {isAr ? 'لا توجد كورسات' : 'No courses'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {enrolledCount > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 122, 255, 0.1)', color: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={16} />
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                      {isAr ? `الكورسات المسجلة (${enrolledCount})` : `Enrolled Courses (${enrolledCount})`}
                    </h2>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {enrollments.map((enroll: any, i: number) => {
                      const progress = Math.round(Number(enroll?.progress) || 0)
                      const isCompleted = Boolean(enroll?.completedAt) || progress >= 100
                      return (
                        <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', transition: 'box-shadow 0.15s ease' }}>
                          <div style={{ height: 120, background: 'linear-gradient(135deg, rgba(81,32,200,0.3), rgba(81,32,200,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {enroll.course?.thumbnail ? (
                              <img src={enroll.course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <BookOpen size={32} color="var(--muted)" />
                            )}
                          </div>
                          <div style={{ padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--foreground)', flex: 1 }}>
                                {isAr ? enroll.course?.titleAr : enroll.course?.titleEn}
                              </h4>
                              {isCompleted && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#34C759', background: 'rgba(52, 199, 89, 0.1)', padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                                  <CheckCircle size={12} />
                                  {isAr ? 'مكتمل' : 'Completed'}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(enroll.enrolledAt, isAr)}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#2BBFA3' }}>{formatCurrency(enroll.course?.price || 0, isAr)}</span>
                            </div>
                            {progress > 0 && (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{isAr ? 'التقدم' : 'Progress'}</span>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#007AFF' }}>{progress}%</span>
                                </div>
                                <div style={{ height: 6, borderRadius: 6, background: 'var(--surface-2)', overflow: 'hidden' }}>
                                  <div style={{ width: `${progress}%`, height: '100%', borderRadius: 6, background: '#007AFF' }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {createdCount > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(81, 32, 200, 0.1)', color: '#5120C8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PlusCircle size={16} />
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
                      {isAr ? `الكورسات المنشأة (${createdCount})` : `Created Courses (${createdCount})`}
                    </h2>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {createdCourses.map((course: any, i: number) => (
                      <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                        <div style={{ height: 120, background: 'linear-gradient(135deg, rgba(81,32,200,0.3), rgba(81,32,200,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <BookOpen size={32} color="var(--muted)" />
                          )}
                        </div>
                        <div style={{ padding: 16 }}>
                          <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
                            {isAr ? course.titleAr : course.titleEn}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                              {course.status}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#2BBFA3' }}>
                              {formatCurrency(course.price || 0, isAr)}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                            {formatDate(course.createdAt, isAr)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 16, background: 'rgba(52, 199, 89, 0.08)', border: '1px solid rgba(52, 199, 89, 0.2)', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{isAr ? 'إجمالي المدفوعات' : 'Total Payments'}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#34C759' }}>{formatCurrency(totalPaid, isAr)}</div>
            </div>
            <div style={{ textAlign: isAr ? 'right' : 'left' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{isAr ? 'عدد العمليات' : 'Transactions'}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)' }}>{paymentCount}</div>
            </div>
          </div>

          {payments.length === 0 ? (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <Wallet size={36} color="var(--muted)" style={{ marginBottom: 12 }} />
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
                {isAr ? 'لا توجد مدفوعات' : 'No payments'}
              </p>
            </div>
          ) : payments.map((p: any, i: number) => {
            const type = paymentType(p)
            const Icon = type === 'COURSE' ? BookOpen : type === 'SESSION' ? Briefcase : Wallet
            const color = type === 'COURSE' ? '#007AFF' : type === 'SESSION' ? '#5120C8' : '#34C759'
            const bg = type === 'COURSE' ? 'rgba(0, 122, 255, 0.1)' : type === 'SESSION' ? 'rgba(81, 32, 200, 0.1)' : 'rgba(52, 199, 89, 0.1)'
            const success = p?.status === 'SUCCESS' || p?.status === 'COMPLETED'
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 14, background: 'var(--card)', border: '1px solid var(--border)', marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{paymentTitle(p, isAr)}</div>
                  {(Boolean(p?.method) || Boolean(p?.description)) && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {p?.method || ''}{p?.method && p?.description ? ' · ' : ''}{p?.description || ''}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{formatDate(p.createdAt, isAr)}</div>
                </div>
                <div style={{ textAlign: isAr ? 'right' : 'left' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: success ? '#34C759' : 'var(--muted)' }}>
                    {formatCurrency(p.amount, isAr)}
                  </div>
                  <div style={{ fontSize: 11, color: success ? '#34C759' : '#EF4444', marginTop: 2 }}>{p.status}</div>
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