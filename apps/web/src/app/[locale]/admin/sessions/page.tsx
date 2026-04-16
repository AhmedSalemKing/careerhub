'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation' // ✅ NEW: For navigation
import { useLocale } from 'next-intl'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { Calendar, Video, Globe, Phone, PlusCircle, Search, ExternalLink, CheckCircle, XCircle, Clock, Users } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:     { label: 'معلقة',        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock },
  CONFIRMED:   { label: 'مؤكدة',        color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  SCHEDULED:   { label: 'مجدولة',       color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Calendar },
  RESCHEDULED: { label: 'تغيير موعد',   color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: Calendar },
  COMPLETED:   { label: 'مكتملة',       color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: CheckCircle },
  CANCELLED:   { label: 'ملغية',        color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  REJECTED:    { label: 'مرفوضة',       color: 'bg-red-500/20 text-red-500/300 border-red-500/30', icon: XCircle },
}

const methodConfig: Record<string, { label: string; icon: any; color: string }> = {
  ONLINE:      { label: 'أونلاين',      icon: Video, color: 'text-blue-400' },
  IN_PERSON:   { label: 'حضوري',        icon: MapPin, color: 'text-green-400' },
  PHONE:       { label: 'هاتف',         icon: Phone, color: 'text-orange-400' },
  ZOOM:        { label: 'Zoom',         icon: Video, color: 'text-blue-400' },
  GOOGLE_MEET: { label: 'Google Meet',  icon: Globe, color: 'text-green-400' },
}

// Missing MapPin component
function MapPin(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  )
}

export default function AdminSessionsPage() {
  const locale = useLocale()
  const router = useRouter() // ✅ NEW: Router
  const isAr = locale === 'ar'
  const [filter, setFilter] = useState('ALL')
  const queryClient = useQueryClient()

  // ✅ REMOVED: All modal state

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

  // ✅ NEW: Navigate to professional create page
  function goToCreateSession() {
    router.push(`/${locale}/admin/create-session`)
  }

  const userName = (u: any) => u?.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u?.email || '—'

  return (
    <div className="p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calendar className="text-purple-400" />
            {isAr ? 'إدارة الجلسات الاستشارية' : 'Consulting Sessions Management'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{isAr ? 'متابعة وإدارة جميع جلسات الاستشارة' : 'Track and manage all consulting sessions'}</p>
        </div>
        
        {/* ✅ UPDATED: Navigate button */}
        <button
          onClick={goToCreateSession}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 group"
        >
          <PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          {isAr ? 'إضافة جلسة جديدة' : 'New Session'}
          <ExternalLink size={14} className="opacity-60" />
        </button>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: isAr ? 'إجمالي الجلسات' : 'Total Sessions', 
            value: stats.total, 
            icon: Calendar, 
            color: 'from-blue-600/20 to-blue-800/20',
            textColor: 'text-blue-400',
            borderColor: 'border-blue-700/30'
          },
          { 
            label: isAr ? 'قيد الانتظار' : 'Pending', 
            value: stats.pending, 
            icon: Clock, 
            color: 'from-amber-600/20 to-amber-800/20',
            textColor: 'text-amber-400',
            borderColor: 'border-amber-700/30'
          },
          { 
            label: isAr ? 'مكتملة' : 'Completed', 
            value: stats.completed, 
            icon: CheckCircle, 
            color: 'from-green-600/20 to-green-800/20',
            textColor: 'text-green-400',
            borderColor: 'border-green-700/30'
          },
          { 
            label: isAr ? 'الإيرادات' : 'Revenue', 
            value: `${stats.revenue} ${isAr ? 'ر.س' : 'SAR'}`, 
            icon: Users, 
            color: 'from-purple-600/20 to-purple-800/20',
            textColor: 'text-purple-400',
            borderColor: 'border-purple-700/30'
          },
        ].map((stat, i) => (
          <div key={i} className={`rounded-2xl border ${stat.borderColor} bg-gradient-to-br ${stat.color} p-4`}>
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={18} className={stat.textColor} />
              <span className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</span>
            </div>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Filters ─── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              filter === f 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' 
                : 'bg-gray-900/50 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            {filterLabels[f]}
            {f !== 'ALL' && (
              <span className="mr-2 text-xs opacity-60">
                ({f === 'ALL' ? allSessions.length : sessions.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Table ─── */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-900/50" />
          ))}
        </div>
      ) : (sessions as any[]).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-700 py-16 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 opacity-20" />
          <p className="text-gray-500 font-medium text-lg">{isAr ? 'لا توجد جلسات' : 'No sessions found'}</p>
          <p className="text-gray-600 text-sm mt-1 mb-4">{isAr ? 'ابدأ بإضافة جلسة استشارية جديدة' : 'Start by adding a new consulting session'}</p>
          <button
            onClick={goToCreateSession}
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium"
          >
            <PlusCircle size={16} />
            {isAr ? 'إضافة جلسة جديدة' : 'Add new session'}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-800 overflow-hidden bg-gray-900/30">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  {[
                    isAr ? 'الطالب' : 'Student',
                    isAr ? 'المستشار' : 'Consultant',
                    isAr ? 'الموضوع' : 'Topic',
                    isAr ? 'الموعد' : 'Date & Time',
                    isAr ? 'الطريقة' : 'Method',
                    isAr ? 'السعر' : 'Price',
                    isAr ? 'الحالة' : 'Status',
                  ].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {(sessions as any[]).map((s) => {
                  const st = statusConfig[s.status] || statusConfig.PENDING
                  const method = methodConfig[s.meetingMethod] || methodConfig.ONLINE
                  const studentName = userName(s.student)
                  const consultantName = userName(s.consultant)
                  const date = new Date(s.scheduledAt)
                  const MethodIcon = method.icon
                  
                  return (
                    <tr key={s.id} className="hover:bg-gray-800/30 transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600/30 to-cyan-600/30 flex items-center justify-center text-blue-400 text-xs font-bold">
                            {(studentName)[0]}
                          </div>
                          <span className="font-medium text-white text-xs">{studentName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center text-purple-400 text-xs font-bold">
                            {(consultantName)[0]}
                          </div>
                          <span className="text-gray-300 text-xs">{consultantName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-200 text-xs max-w-[150px] truncate">{s.topic || '—'}</td>
                      <td className="px-4 py-3.5">
                        <div className="text-gray-300 text-xs">
                          <div>{date.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short' })}</div>
                          <div className="text-gray-500">{date.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${method.color}`}>
                          <MethodIcon size={12} />
                          {method.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-green-400 text-sm">{s.price || 0} <span className="text-gray-500 text-xs">ر.س</span></span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${st.color}`}>
                          <st.icon size={10} />
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

      {/* ✅ INFO Banner */}
      <div className="rounded-xl bg-gradient-to-r from-pink-900/20 to-purple-900/20 border border-pink-700/30 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-pink-600/20 flex items-center justify-center shrink-0 mt-0.5">
          <PlusCircle size={16} className="text-pink-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-pink-300">
            {isAr ? 'إنشاء جلسة بسهولة' : 'Easy Session Creation'}
          </p>
          <p className="text-xs text-pink-400/70 mt-1">
            {isAr 
              ? 'اضغط "إضافة جلسة جديدة" لفتح نموذج احترافي مع اختيار الطالب والمستشار وتحديد الموعد والسعر.'
              : 'Click "New Session" to open a professional form with student/consultant selection, scheduling, and pricing.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}