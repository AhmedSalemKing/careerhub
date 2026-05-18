'use client'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { get } from '../../../../lib/api'
import {
  Activity, Users, LogIn, BookOpen, Calendar, DollarSign,
  Search, RefreshCw, Monitor, TrendingUp, Clock, MapPin,
  ChevronLeft, ChevronRight, ShoppingCart,
} from 'lucide-react'

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

function fmtDateTime(dateStr: string, isAr: boolean): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const TABS = [
  { key: 'ALL', labelAr: 'كل النشاطات', labelEn: 'All Activities', icon: Activity },
  { key: 'LOGIN', labelAr: 'تسجيل الدخول', labelEn: 'Login', icon: LogIn },
  { key: 'COURSE', labelAr: 'الكورسات', labelEn: 'Courses', icon: BookOpen },
  { key: 'SESSION', labelAr: 'الجلسات', labelEn: 'Sessions', icon: Calendar },
  { key: 'PAYMENT', labelAr: 'المدفوعات', labelEn: 'Payments', icon: DollarSign },
]

const ACTION_I18N: Record<string, { ar: string; en: string }> = {
  LOGIN:        { ar: 'تسجيل دخول', en: 'Login' },
  REGISTER:     { ar: 'تسجيل جديد', en: 'Registration' },
  VIEW_COURSES: { ar: 'تصفح كورسات', en: 'View Courses' },
  VIEW_COURSE:  { ar: 'مشاهدة كورس', en: 'View Course' },
  ENROLL_COURSE:{ ar: 'اشتراك كورس', en: 'Course Enrollment' },
  PAYMENT:      { ar: 'عملية دفع', en: 'Payment' },
  PAYMENT_SUCCESS:{ ar: 'دفع ناجح', en: 'Payment Success' },
  BOOK_SESSION: { ar: 'حجز جلسة', en: 'Book Session' },
  COMPLETE_LESSON: { ar: 'إكمال درس', en: 'Complete Lesson' },
  WATCH_LESSON: { ar: 'مشاهدة درس', en: 'Watch Lesson' },
  WALLET_TOPUP: { ar: 'شحن محفظة', en: 'Wallet Top-up' },
  AI_CHAT:      { ar: 'محادثة ذكية', en: 'AI Chat' },
  ASSESSMENT:   { ar: 'اختبار تقييم', en: 'Assessment' },
  CREATE_COURSE:{ ar: 'إنشاء كورس', en: 'Create Course' },
  SEARCH_COURSES:{ ar: 'بحث في الكورسات', en: 'Search Courses' },
  CERTIFICATE_ISSUED:{ ar: 'إصدار شهادة', en: 'Certificate Issued' },
}

function getDetails(act: any, isAr: boolean): string {
  const meta = act.metadata || {}
  switch (act.action) {
    case 'LOGIN': return act.user?.email || '—'
    case 'ENROLL_COURSE': return meta.courseTitle || meta.resourceId || act.entityId || act.entity || '—'
    case 'BOOK_SESSION': return [meta.consultantName, meta.date].filter(Boolean).join(' - ') || '—'
    case 'PAYMENT_SUCCESS':
    case 'PAYMENT': {
      const paymentParts: string[] = []
      if (meta.amount) paymentParts.push(`${meta.amount} ${isAr ? 'ر.س' : 'SAR'}`)
      if (meta.type === 'consultation') {
        if (meta.consultantName) {
          const prefix = isAr ? 'جلسة مع' : 'Session with'
          paymentParts.push(`${prefix} ${meta.consultantName}`)
        }
        if (meta.sessionDate) {
          paymentParts.push(new Date(meta.sessionDate).toLocaleDateString(isAr ? 'ar-SA' : 'en-US'))
        }
      } else if (meta.type === 'course' && meta.courseTitle) {
        const prefix = isAr ? 'كورس' : 'Course'
        paymentParts.push(`${prefix}: ${meta.courseTitle}`)
      } else if (meta.consultantName) {
        paymentParts.push(meta.consultantName)
      }
      return paymentParts.filter(Boolean).join('  •  ') || '—'
    }
    case 'VIEW_COURSE': return meta.courseTitle || act.entityId || '—'
    case 'SEARCH_COURSES': return meta.query || '—'
    case 'WALLET_TOPUP': return `${meta.amount || ''} ${isAr ? 'ر.س' : 'SAR'}`.trim() || '—'
    case 'COMPLETE_LESSON':
    case 'WATCH_LESSON': return meta.lessonTitle || act.entityId || '—'
    case 'CERTIFICATE_ISSUED': return meta.courseTitle || '—'
    default: return act.entity || meta.resourceId || act.entityId || '—'
  }
}

function actionLabel(action: string, isAr: boolean): string {
  const entry = ACTION_I18N[action]
  if (entry) return isAr ? entry.ar : entry.en
  return action
}

function actionColor(action: string): string {
  if (action.startsWith('LOGIN') || action === 'REGISTER') return '#2BBFA3'
  if (action.startsWith('ENROLL')) return '#10B981'
  if (action.startsWith('BOOK')) return '#8B5CF6'
  if (action.startsWith('PAYMENT')) return '#F5A623'
  if (action.startsWith('WATCH') || action.startsWith('COMPLETE')) return '#5120c8'
  if (action.startsWith('VIEW')) return '#06B6D4'
  if (action.startsWith('AI')) return '#EC4899'
  return '#6B7280'
}

export default function ActivityPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [isDark, setIsDark] = useState(false)
  const [activeTab, setActiveTab] = useState('ALL')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  useEffect(() => {
    const check = () => setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    check()
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', check)
    return () => media.removeEventListener('change', check)
  }, [])

  const queryType = activeTab === 'ALL' ? undefined : activeTab === 'LOGIN' ? 'LOGIN' : activeTab === 'COURSE' ? 'ENROLL_COURSE,COMPLETE_LESSON,WATCH_LESSON,VIEW_COURSES' : activeTab === 'SESSION' ? 'BOOK_SESSION' : 'PAYMENT_SUCCESS,PAYMENT'

  const { data: activityData, isLoading, refetch } = useQuery({
    queryKey: ['admin-filtered-activity', queryType, filterFrom, filterTo, filterRole, search, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (queryType) params.set('type', queryType)
      if (filterFrom) params.set('from', filterFrom)
      if (filterTo) params.set('to', filterTo)
      if (filterRole) params.set('role', filterRole)
      if (search) params.set('search', search)
      params.set('page', String(page))
      params.set('limit', String(limit))
      const res = await get(`/admin/activity?${params.toString()}`)
      const body = (res as any)?.data
      const result = body?.data ?? body ?? {}
      return {
        items: result.items ?? [],
        total: result.total ?? 0,
        page: result.page ?? 1,
        limit: result.limit ?? limit,
        totalPages: result.totalPages ?? 0,
      }
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['admin-activity-stats'],
    queryFn: async () => {
      const res = await get('/admin/activity/stats')
      const body = (res as any)?.data
      return body?.data ?? body ?? {}
    },
    refetchInterval: 30000,
  })

  const items = (activityData as any)?.items ?? []
  const total = (activityData as any)?.total ?? 0
  const totalPages = (activityData as any)?.totalPages ?? 0

  const tableBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
  const tableHover = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const borderColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'
  const surface = isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'
  const fg = isDark ? '#f1f5f9' : '#0d0d0d'
  const muted = isDark ? 'rgba(255,255,255,0.4)' : '#64748b'
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px', color: fg }} dir={isAr ? 'rtl' : 'ltr'}>

      {/* ─── Header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={22} color="#5120c8" />
            {isAr ? 'نشاط المنصة' : 'Platform Activity'}
          </h1>
          <p style={{ fontSize: '13px', color: muted, margin: '4px 0 0' }}>
            {isAr ? 'سجل شامل لنشاط المستخدمين مع تصفية وبحث متقدم' : 'Comprehensive user activity log with filtering and search'}
          </p>
        </div>
        <button onClick={() => refetch()} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px',
          background: 'rgba(81,32,200,0.1)', color: '#5120c8', border: '1px solid rgba(81,32,200,0.2)',
          fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        }}>
          <RefreshCw size={14} />
          {isAr ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* ─── Stats Bar ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: isAr ? 'المستخدمون النشطون اليوم' : 'Active Users Today', value: (stats as any)?.onlineUsers ?? 0, icon: Users, color: '#2BBFA3' },
          { label: isAr ? 'تسجيلات الدخول اليوم' : 'Logins Today', value: (stats as any)?.todayActivity ?? 0, icon: LogIn, color: '#5120c8' },
          { label: isAr ? 'اشتراكات جديدة اليوم' : 'New Enrollments Today', value: (stats as any)?.todayEnrollments ?? 0, icon: BookOpen, color: '#10B981' },
          { label: isAr ? 'جلسات محجوزة اليوم' : 'Sessions Booked Today', value: (stats as any)?.todaySessions ?? 0, icon: Calendar, color: '#8B5CF6' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} style={{
              background: surface, border: `1px solid ${borderColor}`, borderRadius: '16px', padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Icon size={20} color={s.color} />
                <span style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
              <p style={{ fontSize: '12px', color: muted, margin: 0 }}>{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* ─── Filters Bar ─── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'end' }}>
        <div>
          <label style={{ fontSize: '11px', color: muted, display: 'block', marginBottom: '4px' }}>
            {isAr ? 'من تاريخ' : 'From Date'}
          </label>
          <input type="date" value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setPage(1) }}
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: '10px', color: fg, padding: '8px 12px', fontSize: '13px', outline: 'none' }} />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: muted, display: 'block', marginBottom: '4px' }}>
            {isAr ? 'إلى تاريخ' : 'To Date'}
          </label>
          <input type="date" value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setPage(1) }}
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: '10px', color: fg, padding: '8px 12px', fontSize: '13px', outline: 'none' }} />
        </div>
        <div>
          <label style={{ fontSize: '11px', color: muted, display: 'block', marginBottom: '4px' }}>
            {isAr ? 'الدور' : 'Role'}
          </label>
          <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1) }}
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: '10px', color: fg, padding: '8px 12px', fontSize: '13px', outline: 'none' }}>
            <option value="">{isAr ? 'الكل' : 'All'}</option>
            <option value="STUDENT">{isAr ? 'طالب' : 'Student'}</option>
            <option value="INSTRUCTOR">{isAr ? 'مدرس' : 'Instructor'}</option>
            <option value="CONSULTANT">{isAr ? 'مستشار' : 'Consultant'}</option>
            <option value="ADMIN">{isAr ? 'مدير' : 'Admin'}</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: '11px', color: muted, display: 'block', marginBottom: '4px' }}>
            {isAr ? 'بحث' : 'Search'}
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: muted }} />
            <input value={searchInput} onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
              placeholder={isAr ? 'بحث باسم المستخدم...' : 'Search by name...'}
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: '10px', color: fg, padding: '8px 12px 8px 34px', fontSize: '13px', width: '100%', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setPage(1) }} style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px',
              border: isActive ? '1px solid #5120c8' : `1px solid transparent`,
              background: isActive ? 'rgba(81,32,200,0.1)' : 'transparent',
              color: isActive ? '#5120c8' : muted, fontSize: '13px', fontWeight: isActive ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <Icon size={14} />
              {isAr ? tab.labelAr : tab.labelEn}
            </button>
          )
        })}
      </div>

      {/* ─── Table Container ─── */}
      <div style={{ background: surface, border: `1px solid ${borderColor}`, borderRadius: '12px', overflow: 'hidden' }}>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', color: muted, fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isAr ? 'المستخدم' : 'User'}
                </th>
                <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', color: muted, fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isAr ? 'الدور' : 'Role'}
                </th>
                <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', color: muted, fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isAr ? 'النشاط' : 'Activity'}
                </th>
                <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', color: muted, fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isAr ? 'التفاصيل' : 'Details'}
                </th>
                <th style={{ padding: '12px 16px', textAlign: isAr ? 'right' : 'left', color: muted, fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isAr ? 'الوقت' : 'Time'}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: muted }}>
                    <div style={{ width: 24, height: 24, border: '2px solid #5120c8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    {isAr ? 'جاري التحميل...' : 'Loading...'}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: muted }}>
                    <Activity size={36} style={{ opacity: 0.3, margin: '0 auto 8px', display: 'block' }} />
                    {isAr ? 'لا يوجد نشاط' : 'No activity found'}
                  </td>
                </tr>
              ) : items.map((act: any, i: number) => {
                const roleLabel: Record<string, string> = {
                  STUDENT: isAr ? 'طالب' : 'Student',
                  INSTRUCTOR: isAr ? 'مدرس' : 'Instructor',
                  CONSULTANT: isAr ? 'مستشار' : 'Consultant',
                  ADMIN: isAr ? 'مدير' : 'Admin',
                }
                const name = act.user?.profile?.firstName
                  ? `${act.user.profile.firstName} ${act.user.profile.lastName}`
                  : act.user?.email?.split('@')[0] ?? '?'
                return (
                  <tr key={act.id || i} style={{ borderBottom: `1px solid ${borderColor}`, transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = tableHover}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{name}</td>
                    <td style={{ padding: '12px 16px', color: muted }}>
                      {roleLabel[act.user?.accountType] || act.user?.accountType}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px',
                        borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                        background: `${actionColor(act.action)}15`, color: actionColor(act.action),
                      }}>
                        {actionLabel(act.action, isAr)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: muted, fontSize: '12px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getDetails(act, isAr)}
                    </td>
                    <td style={{ padding: '12px 16px', color: muted, fontSize: '12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {timeAgo(act.createdAt, isAr)}
                      </div>
                      <div style={{ fontSize: '10px', color: muted, opacity: 0.6, marginTop: '2px' }}>
                        {new Date(act.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px',
            background: surface, border: `1px solid ${borderColor}`, color: fg, fontSize: '12px',
            cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1,
          }}>
            <ChevronRight size={14} />
            {isAr ? 'السابق' : 'Prev'}
          </button>
          <span style={{ fontSize: '12px', color: muted }}>
            {isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`} · {isAr ? `إجمالي ${total}` : `${total} total`}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px',
            background: surface, border: `1px solid ${borderColor}`, color: fg, fontSize: '12px',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1,
          }}>
            {isAr ? 'التالي' : 'Next'}
            <ChevronLeft size={14} />
          </button>
        </div>
      )}

      {/* ─── Live Tracking Placeholder (Phase 2) ─── */}
      <div style={{
        background: 'rgba(81,32,200,0.05)', border: '1px solid rgba(81,32,200,0.15)',
        borderRadius: '16px', padding: '32px', textAlign: 'center', marginTop: '24px',
      }}>
        <Monitor size={28} style={{ color: 'rgba(81,32,200,0.3)', margin: '0 auto 8px', display: 'block' }} />
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>
          {isAr ? 'الخريطة التفاعلية المباشرة قريباً' : 'Live Interactive Map — Coming Soon'}
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
