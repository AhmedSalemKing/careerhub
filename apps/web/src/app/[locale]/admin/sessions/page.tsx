'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import {
  Calendar, Video, Globe, Phone, PlusCircle, ExternalLink,
  CheckCircle, XCircle, Clock, Users, Eye,
} from 'lucide-react'

function MapPin(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  )
}

const methodConfig: Record<string, { label: string; icon: any }> = {
  ONLINE:      { label: 'أونلاين',      icon: Video },
  IN_PERSON:   { label: 'حضوري',        icon: MapPin },
  PHONE:       { label: 'هاتف',         icon: Phone },
  ZOOM:        { label: 'Zoom',         icon: Video },
  GOOGLE_MEET: { label: 'Google Meet',  icon: Globe },
}

export default function AdminSessionsPage() {
  const locale = useLocale()
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const isAr = locale === 'ar'
  const [filter, setFilter] = useState('ALL')

  const { data: allSessions = [], isLoading } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      const res = await get('/admin/sessions')
      const d = (res as any)?.data?.data ?? []
      return Array.isArray(d) ? d : []
    },
  })

  const sessions = filter === 'ALL' ? allSessions : (allSessions as any[]).filter((s: any) => s.status === filter)

  const stats = {
    total: (allSessions as any[]).length,
    pending: (allSessions as any[]).filter((s: any) => ['PENDING', 'SCHEDULED'].includes(s.status)).length,
    completed: (allSessions as any[]).filter((s: any) => s.status === 'COMPLETED').length,
    cancelled: (allSessions as any[]).filter((s: any) => s.status === 'CANCELLED').length,
    revenue: (allSessions as any[])
      .filter((s: any) => ['PAID', 'CONFIRMED'].includes(s.paymentStatus))
      .reduce((sum: number, s: any) => sum + (s.price || 0), 0),
  }

  const filters = ['ALL', 'SCHEDULED', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
  const filterLabels: Record<string, string> = {
    ALL: isAr ? 'الكل' : 'All',
    SCHEDULED: isAr ? 'مجدولة' : 'Scheduled',
    PENDING: isAr ? 'معلقة' : 'Pending',
    CONFIRMED: isAr ? 'مؤكدة' : 'Confirmed',
    COMPLETED: isAr ? 'مكتملة' : 'Completed',
    CANCELLED: isAr ? 'ملغية' : 'Cancelled',
  }

  function goToCreateSession() {
    router.push(`/${locale}/admin/create-session`)
  }

  const userName = (u: any) => u?.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u?.email || '—'

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
      PENDING:     { label: isAr ? 'معلقة' : 'Pending',      dot: 'bg-amber-500',   bg: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)', text: isDark ? '#fbbf24' : '#b45309', border: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)' },
      CONFIRMED:   { label: isAr ? 'مؤكدة' : 'Confirmed',    dot: 'bg-blue-500',    bg: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)', text: isDark ? '#60a5fa' : '#2563eb', border: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)' },
      SCHEDULED:   { label: isAr ? 'مجدولة' : 'Scheduled',    dot: 'bg-blue-500',    bg: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)', text: isDark ? '#60a5fa' : '#2563eb', border: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)' },
      COMPLETED:   { label: isAr ? 'مكتملة' : 'Completed',    dot: 'bg-emerald-500', bg: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)', text: isDark ? '#34d399' : '#059669', border: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)' },
      CANCELLED:   { label: isAr ? 'ملغية' : 'Cancelled',     dot: 'bg-red-500',     bg: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',   text: isDark ? '#f87171' : '#dc2626', border: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)' },
      REJECTED:    { label: isAr ? 'مرفوضة' : 'Rejected',     dot: 'bg-gray-500',    bg: isDark ? 'rgba(107,114,128,0.12)' : 'rgba(107,114,128,0.08)', text: isDark ? '#9ca3af' : '#6b7280', border: isDark ? 'rgba(107,114,128,0.3)' : 'rgba(107,114,128,0.2)' },
      RESCHEDULED: { label: isAr ? 'تغيير موعد' : 'Rescheduled', dot: 'bg-orange-500', bg: isDark ? 'rgba(249,115,22,0.12)' : 'rgba(249,115,22,0.08)', text: isDark ? '#fb923c' : '#ea580c', border: isDark ? 'rgba(249,115,22,0.3)' : 'rgba(249,115,22,0.2)' },
    }
    return map[status] ?? map.PENDING
  }

  const paymentBadge = (paymentStatus: string) => {
    if (paymentStatus === 'PAID' || paymentStatus === 'CONFIRMED') {
      return {
        label: isAr ? 'مدفوع' : 'Paid',
        bg: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)',
        text: isDark ? '#34d399' : '#059669',
        border: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)',
      }
    }
    return {
      label: isAr ? 'غير مدفوع' : 'Unpaid',
      bg: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
      text: isDark ? '#f87171' : '#dc2626',
      border: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)',
    }
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ─── Header ─── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
            <Calendar style={{ color: '#5120c8' }} />
            {isAr ? 'إدارة الجلسات الاستشارية' : 'Consulting Sessions'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {isAr ? 'متابعة وإدارة جميع جلسات الاستشارة' : 'Track and manage all consulting sessions'}
          </p>
        </div>
        <button
          onClick={goToCreateSession}
          className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-all group"
          style={{ background: '#5120c8', color: '#fff', boxShadow: '0 4px 12px rgba(81,32,200,0.25)' }}
        >
          <PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          {isAr ? 'إضافة جلسة جديدة' : 'New Session'}
          <ExternalLink size={14} style={{ opacity: 0.6 }} />
        </button>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: isAr ? 'الإجمالي' : 'Total', value: stats.total, color: '#5120c8', icon: Calendar },
          { label: isAr ? 'قيد الانتظار' : 'Pending', value: stats.pending, color: '#f59e0b', icon: Clock },
          { label: isAr ? 'مكتملة' : 'Completed', value: stats.completed, color: '#10b981', icon: CheckCircle },
          { label: isAr ? 'ملغية' : 'Cancelled', value: stats.cancelled, color: '#ef4444', icon: XCircle },
          { label: isAr ? 'الإيرادات' : 'Revenue', value: `${stats.revenue} ${isAr ? 'ر.س' : 'SAR'}`, color: '#8b5cf6', icon: Users },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={i}
              className="rounded-xl p-4 border transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon size={18} style={{ color: stat.color }} />
                <span className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* ─── Filter Tabs ─── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-all"
            style={{
              background: filter === f ? '#5120c8' : 'var(--surface)',
              color: filter === f ? '#fff' : 'var(--muted)',
              border: filter === f ? '1px solid #5120c8' : '1px solid var(--border)',
            }}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* ─── Table ─── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl"
              style={{ background: 'var(--surface-2)' }}
            />
          ))}
        </div>
      ) : (sessions as any[]).length === 0 ? (
        <div
          className="rounded-2xl border border-dashed py-16 text-center"
          style={{ borderColor: 'var(--border)' }}
        >
          <Calendar className="mx-auto mb-4 h-12 w-12" style={{ color: 'var(--muted)', opacity: 0.4 }} />
          <p className="font-medium text-lg" style={{ color: 'var(--muted)' }}>
            {isAr ? 'لا توجد جلسات' : 'No sessions found'}
          </p>
          <p className="text-sm mt-1 mb-4" style={{ color: 'var(--muted)', opacity: 0.6 }}>
            {isAr ? 'ابدأ بإضافة جلسة استشارية جديدة' : 'Start by adding a new consulting session'}
          </p>
          <button
            onClick={goToCreateSession}
            className="inline-flex items-center gap-2 font-medium"
            style={{ color: '#5120c8' }}
          >
            <PlusCircle size={16} />
            {isAr ? 'إضافة جلسة جديدة' : 'Add new session'}
          </button>
        </div>
      ) : (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  {[
                    isAr ? 'الطالب' : 'Student',
                    isAr ? 'المستشار' : 'Consultant',
                    isAr ? 'الموضوع' : 'Topic',
                    isAr ? 'الموعد' : 'Date & Time',
                    isAr ? 'الطريقة' : 'Method',
                    isAr ? 'السعر' : 'Price',
                    isAr ? 'الدفع' : 'Payment',
                    isAr ? 'الحالة' : 'Status',
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(sessions as any[]).map((s) => {
                  const st = statusBadge(s.status)
                  const pay = paymentBadge(s.paymentStatus)
                  const method = methodConfig[s.meetingMethod] || methodConfig.ONLINE
                  const studentName = userName(s.student)
                  const consultantName = userName(s.consultant)
                  const date = new Date(s.scheduledAt)
                  const MethodIcon = method.icon

                  return (
                    <tr
                      key={s.id}
                      className="group transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              background: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)',
                              color: isDark ? '#60a5fa' : '#2563eb',
                            }}
                          >
                            {studentName[0]}
                          </div>
                          <span className="font-medium text-xs" style={{ color: 'var(--foreground)' }}>{studentName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              background: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.08)',
                              color: '#8b5cf6',
                            }}
                          >
                            {consultantName[0]}
                          </div>
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>{consultantName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs max-w-[150px] truncate" style={{ color: 'var(--foreground)' }}>
                        {s.topic || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-xs" style={{ color: 'var(--foreground)' }}>
                          <div>{date.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' })}</div>
                          <div style={{ color: 'var(--muted)' }}>{date.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
                          style={{
                            background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.06)',
                            color: isDark ? '#60a5fa' : '#2563eb',
                          }}
                        >
                          <MethodIcon size={12} />
                          {method.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-sm" style={{ color: '#10b981' }}>
                          {s.price || 0}{' '}
                          <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>ر.س</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{ background: pay.bg, color: pay.text, border: `1px solid ${pay.border}` }}
                        >
                          {pay.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}` }}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
