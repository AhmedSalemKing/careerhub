'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { Calendar, Video, Globe, Phone } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING:     { label: 'معلقة', color: 'bg-amber-500/20 text-amber-400' },
  CONFIRMED:   { label: 'مؤكدة', color: 'bg-green-500/20 text-green-400' },
  RESCHEDULED: { label: 'تغيير موعد', color: 'bg-blue-500/20 text-blue-400' },
  COMPLETED:   { label: 'مكتملة', color: 'bg-gray-500/20 text-gray-400' },
  CANCELLED:   { label: 'ملغية', color: 'bg-red-500/20 text-red-400' },
  REJECTED:    { label: 'مرفوضة', color: 'bg-red-500/20 text-red-400' },
}

export default function AdminSessionsPage() {
  const [filter, setFilter] = useState('ALL')

  const { data: allSessions = [], isLoading } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      const res = await get('/admin/sessions')
      const d = (res?.data as any)?.data ?? []
      return Array.isArray(d) ? d : []
    }
  })

  const sessions = filter === 'ALL' ? allSessions : allSessions.filter((s: any) => s.status === filter)
  const totalRevenue = allSessions
    .filter((s: any) => s.paymentStatus === 'PAID')
    .reduce((sum: number, s: any) => sum + (s.price || 0), 0)

  const filters = ['ALL','PENDING','CONFIRMED','RESCHEDULED','COMPLETED','CANCELLED']
  const filterLabels: Record<string, string> = {
    ALL: 'الكل', PENDING: 'معلقة', CONFIRMED: 'مؤكدة',
    RESCHEDULED: 'تغيير موعد', COMPLETED: 'مكتملة', CANCELLED: 'ملغية'
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">الجلسات الاستشارية</h1>
        <p className="text-[color:var(--muted)] mt-1">إدارة ومتابعة جميع جلسات الاستشارة</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        {[
          { label: 'إجمالي الجلسات', value: allSessions.length },
          { label: 'معلقة', value: allSessions.filter((s: any) => s.status === 'PENDING').length },
          { label: 'مؤكدة', value: allSessions.filter((s: any) => s.status === 'CONFIRMED').length },
          { label: 'إيرادات الجلسات', value: `${totalRevenue} ريال` },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-[color:var(--muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filter === f ? 'bg-primary text-white' : 'border border-[color:var(--border)] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]'
            }`}>
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_,i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-[color:var(--surface)]" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-[color:var(--border)] py-12 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-[color:var(--muted)]">لا توجد جلسات</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[color:var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-2)]">
                {['الطالب','المستشار','التاريخ','الطريقة','السعر','الدفع','الحالة'].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-[color:var(--muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {(sessions as any[]).map((s) => {
                const st = statusConfig[s.status] || statusConfig.PENDING
                const studentName = `${s.student?.profile?.firstName || ''} ${s.student?.profile?.lastName || ''}`.trim() || s.student?.email || '—'
                const consultantName = `${s.consultant?.profile?.firstName || ''} ${s.consultant?.profile?.lastName || ''}`.trim() || s.consultant?.email || '—'
                const date = new Date(s.scheduledAt)
                const MethodIcon = s.meetingMethod === 'ZOOM' ? Video : s.meetingMethod === 'GOOGLE_MEET' ? Globe : Phone
                return (
                  <tr key={s.id} className="bg-[color:var(--surface)] hover:bg-[color:var(--surface-2)] transition">
                    <td className="px-4 py-3 font-medium text-foreground">{studentName}</td>
                    <td className="px-4 py-3 text-[color:var(--muted)]">{consultantName}</td>
                    <td className="px-4 py-3 text-[color:var(--muted)] text-xs">
                      {date.toLocaleDateString('ar-SA')} {date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3"><MethodIcon className="h-4 w-4 text-[color:var(--muted)]" /></td>
                    <td className="px-4 py-3 font-bold text-primary">{s.price} ر.س</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.paymentStatus === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {s.paymentStatus === 'PAID' ? 'مدفوع' : 'غير مدفوع'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.color}`}>{st.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
