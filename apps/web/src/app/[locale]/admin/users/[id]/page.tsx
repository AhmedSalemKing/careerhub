'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { get } from '../../../../../lib/api'
import { 
  ArrowLeft, User, Mail, Calendar, DollarSign, BookOpen, Shield, Activity,
  Clock, FileText, GraduationCap, CreditCard, CheckCircle, XCircle, PlayCircle
} from 'lucide-react'

const TABS = [
  { key: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview' },
  { key: 'activity', labelAr: 'سجل النشاط', labelEn: 'Activity' },
  { key: 'courses', labelAr: 'الكورسات', labelEn: 'Courses' },
  { key: 'payments', labelAr: 'المدفوعات', labelEn: 'Payments' },
]

const FILTERS = [
  { key: '24h', labelAr: 'آخر 24 ساعة', labelEn: 'Last 24h' },
  { key: '7d', labelAr: 'أسبوع', labelEn: 'Week' },
  { key: '30d', labelAr: '30 يوم', labelEn: '30 days' },
  { key: 'all', labelAr: 'الكل', labelEn: 'All' },
]

const ACTIVITY_ICONS: Record<string, any> = {
  LOGIN: Activity,
  ENROLLMENT: GraduationCap,
  PAYMENT: CreditCard,
  LOGOUT: XCircle,
  PROFILE_UPDATE: User,
  COURSE_COMPLETE: CheckCircle,
  VIDEO_WATCH: PlayCircle,
  DEFAULT: Clock,
}

function getActivityIcon(action: string) {
  const key = action?.toUpperCase() || 'DEFAULT'
  return ACTIVITY_ICONS[key] || ACTIVITY_ICONS.DEFAULT
}

function formatCurrency(amount: number, isAr: boolean) {
  const val = Number(amount) || 0
  return `${val.toLocaleString(isAr ? 'ar-SA' : 'en-US')} ${isAr ? 'ر.س' : 'SAR'}`
}

function formatDate(date: string | Date, isAr: boolean) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimeAgo(date: string | Date, isAr: boolean) {
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
  const enrollments = financials?.enrollments || []
  const payments = financials?.payments || []
  const activities = activityData || userData?.activities || []

  const totalPaid = payments.filter((p: any) => p.status === 'SUCCESS' || p.status === 'COMPLETED').reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
  const totalEarnings = financials?.totalEarnings || 0
  const walletBalance = financials?.walletBalance || 0
  const coursesCount = enrollments.length

  const stats = [
    { label: isAr ? 'إجمالي الدفع' : 'Total Payments', value: formatCurrency(totalPaid, isAr), color: '#2BBFA3' },
    { label: isAr ? 'الأرباح' : 'Earnings', value: formatCurrency(totalEarnings, isAr), color: '#5120c8' },
    { label: isAr ? 'الكورسات' : 'Courses', value: coursesCount, color: '#F59E0B' },
    { label: isAr ? 'رصيد المحفظة' : 'Wallet Balance', value: formatCurrency(walletBalance, isAr), color: '#EC4899' },
  ]

  const isLoading = loadingUser || loadingFinancials || (activeTab === 'activity' && loadingActivity)

  if (isLoading) return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(81,32,200,0.2)', borderTopColor: '#5120c8', borderRadius: '50%', animation: 'dw-spin 0.8s linear infinite' }} />
      <style>{`@keyframes dw-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#e0e0e0', display: 'flex' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 900, fontSize: 24, color: '#fff', margin: 0 }}>
            {user?.profile?.firstName} {user?.profile?.lastName}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0, fontFamily: 'DM Sans, sans-serif' }}>{user?.email}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12, overflowX: 'auto' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: activeTab === tab.key ? '#5120c8' : 'transparent',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}
          >
            {isAr ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans, sans-serif' }}>{stat.label}</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: stat.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
            <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={14} color="#A78BFA" />
                {isAr ? 'معلومات الحساب' : 'Account Info'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: User, label: isAr ? 'الدور' : 'Role', value: user?.accountType },
                  { icon: Shield, label: isAr ? 'الحالة' : 'Status', value: user?.status },
                  { icon: Calendar, label: isAr ? 'تاريخ الانضمام' : 'Joined', value: formatDate(user?.createdAt, isAr) },
                ].map((row, i) => {
                  const Icon = row.icon
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon size={14} color="rgba(255,255,255,0.4)" />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans, sans-serif', flex: 1 }}>{row.label}</span>
                      <span style={{ fontSize: 13, color: '#e0e0e0', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>{String(row.value ?? '-')}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={14} color="#A78BFA" />
                {isAr ? 'النشاط الأخير' : 'Recent Activity'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                {activities.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                    {isAr ? 'لا يوجد نشاط مسجل' : 'No activity recorded yet'}
                  </p>
                ) : activities.slice(0, 5).map((act: any, i: number) => {
                  const Icon = getActivityIcon(act.action)
                  return (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8, alignItems: 'flex-start' }}>
                      <Icon size={14} color="#5120c8" style={{ marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#e0e0e0', fontFamily: 'DM Sans, sans-serif' }}>{act.action}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif' }}>{formatTimeAgo(act.createdAt, isAr)}</p>
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActivityFilter(filter.key)}
                style={{
                  background: activityFilter === filter.key ? '#5120c8' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: activityFilter === filter.key ? '#fff' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {isAr ? filter.labelAr : filter.labelEn}
              </button>
            ))}
          </div>

          <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={14} color="#A78BFA" />
              {isAr ? 'سجل النشاط' : 'Activity Log'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 500, overflowY: 'auto' }}>
              {activities.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                  {isAr ? 'لا يوجد نشاط مسجل' : 'No activity recorded'}
                </p>
              ) : activities.map((act: any, i: number) => {
                const Icon = getActivityIcon(act.action)
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(81,32,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color="#5120c8" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#e0e0e0', fontFamily: 'DM Sans, sans-serif' }}>{act.action}</p>
                      {act.entity && (
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans, sans-serif' }}>
                          {isAr ? 'على' : 'on'} {act.entity}
                        </p>
                      )}
                      <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif' }}>
                        {formatDate(act.createdAt, isAr)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {enrollments.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                <GraduationCap size={40} color="rgba(255,255,255,0.2)" style={{ marginBottom: 12 }} />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>
                  {isAr ? 'لا توجد كورسات مسجلة' : 'No enrolled courses'}
                </p>
              </div>
            ) : enrollments.map((enroll: any, i: number) => (
              <div key={i} style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ height: 120, background: 'linear-gradient(135deg, rgba(81,32,200,0.3), rgba(81,32,200,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {enroll.course?.thumbnail ? (
                    <img src={enroll.course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <BookOpen size={32} color="rgba(255,255,255,0.3)" />
                  )}
                </div>
                <div style={{ padding: 16 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans, sans-serif' }}>
                    {isAr ? enroll.course?.titleAr : enroll.course?.titleEn}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'DM Sans, sans-serif' }}>
                      {formatDate(enroll.enrolledAt, isAr)}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2BBFA3', fontFamily: 'DM Sans, sans-serif' }}>
                      {formatCurrency(enroll.course?.price || 0, isAr)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div>
          <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={14} color="#A78BFA" />
              {isAr ? 'سجل المدفوعات' : 'Payment History'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {payments.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
                  {isAr ? 'لا توجد مدفوعات' : 'No payments'}
                </p>
              ) : payments.map((p: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: p.status === 'SUCCESS' || p.status === 'COMPLETED' ? 'rgba(43,191,163,0.2)' : 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DollarSign size={18} color={p.status === 'SUCCESS' || p.status === 'COMPLETED' ? '#2BBFA3' : '#EF4444'} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#e0e0e0', fontFamily: 'DM Sans, sans-serif' }}>
                        {p.course?.titleEn || p.course?.titleAr || p.description || isAr ? 'دفع رسوم' : 'Payment'}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Sans, sans-serif' }}>
                        {formatDate(p.createdAt, isAr)}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#2BBFA3', fontFamily: 'DM Sans, sans-serif' }}>
                      {formatCurrency(p.amount, isAr)}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: p.status === 'SUCCESS' || p.status === 'COMPLETED' ? '#2BBFA3' : '#EF4444', fontFamily: 'DM Sans, sans-serif' }}>
                      {p.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes dw-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}