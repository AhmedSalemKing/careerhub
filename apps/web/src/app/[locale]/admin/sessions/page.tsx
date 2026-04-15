'use client'
import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { get, post } from '../../../../lib/api'
import { Calendar, Video, Globe, Phone, PlusCircle, X } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING:     { label: 'معلقة',        color: 'bg-amber-500/20 text-amber-400' },
  CONFIRMED:   { label: 'مؤكدة',        color: 'bg-green-500/20 text-green-400' },
  RESCHEDULED: { label: 'تغيير موعد',   color: 'bg-blue-500/20 text-blue-400' },
  COMPLETED:   { label: 'مكتملة',       color: 'bg-gray-500/20 text-gray-400' },
  CANCELLED:   { label: 'ملغية',        color: 'bg-red-500/20 text-red-400' },
  REJECTED:    { label: 'مرفوضة',       color: 'bg-red-500/20 text-red-400' },
}

const MODAL_INPUT = {
  width: '100%',
  padding: '9px 12px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

export default function AdminSessionsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [filter, setFilter] = useState('ALL')
  const queryClient = useQueryClient()

  // Create session modal
  const [showCreate, setShowCreate] = useState(false)
  const [sessionForm, setSessionForm] = useState({ studentId: '', consultantId: '', topic: '', scheduledAt: '', price: 0, meetingMethod: 'ONLINE' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const { data: allSessions = [], isLoading } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      const res = await get('/admin/sessions')
      const d = (res as any)?.data?.data ?? []
      return Array.isArray(d) ? d : []
    },
  })

  const { data: students = [] } = useQuery({
    queryKey: ['students-dropdown'],
    queryFn: async () => {
      const res = await get('/admin/users?accountType=STUDENT&limit=100')
      const d = (res as any).data?.data ?? (res as any).data
      const arr = d?.users ?? d?.items ?? (Array.isArray(d) ? d : [])
      return arr
    },
  })

  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants-dropdown'],
    queryFn: async () => {
      const res = await get('/admin/users?accountType=CONSULTANT&limit=100')
      const d = (res as any).data?.data ?? (res as any).data
      const arr = d?.users ?? d?.items ?? (Array.isArray(d) ? d : [])
      return arr
    },
  })

  const sessions = filter === 'ALL' ? allSessions : (allSessions as any[]).filter((s: any) => s.status === filter)
  const totalRevenue = (allSessions as any[])
    .filter((s: any) => s.paymentStatus === 'PAID')
    .reduce((sum: number, s: any) => sum + (s.price || 0), 0)

  const filters = ['ALL', 'PENDING', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED']
  const filterLabels: Record<string, string> = {
    ALL: isAr ? 'الكل' : 'All',
    PENDING: isAr ? 'معلقة' : 'Pending',
    CONFIRMED: isAr ? 'مؤكدة' : 'Confirmed',
    RESCHEDULED: isAr ? 'تغيير موعد' : 'Rescheduled',
    COMPLETED: isAr ? 'مكتملة' : 'Completed',
    CANCELLED: isAr ? 'ملغية' : 'Cancelled',
  }

  async function handleCreateSession() {
    setCreating(true)
    setCreateError('')
    try {
      await post('/admin/sessions/create', sessionForm)
      setShowCreate(false)
      setSessionForm({ studentId: '', consultantId: '', topic: '', scheduledAt: '', price: 0, meetingMethod: 'ONLINE' })
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] })
    } catch (e: any) {
      setCreateError(e?.response?.data?.message || 'Error creating session')
    } finally { setCreating(false) }
  }

  const userName = (u: any) => u?.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u?.email || '—'

  return (
    <div className="p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{isAr ? 'الجلسات الاستشارية' : 'Consulting Sessions'}</h1>
          <p className="text-[color:var(--muted)] mt-1">{isAr ? 'إدارة ومتابعة جميع جلسات الاستشارة' : 'Manage all consulting sessions'}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#5120c8', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14 }}
        >
          <PlusCircle size={16} />
          {isAr ? 'إضافة جلسة' : 'Add Session'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        {[
          { label: isAr ? 'إجمالي الجلسات' : 'Total Sessions', value: (allSessions as any[]).length },
          { label: isAr ? 'معلقة' : 'Pending', value: (allSessions as any[]).filter((s: any) => s.status === 'PENDING').length },
          { label: isAr ? 'مؤكدة' : 'Confirmed', value: (allSessions as any[]).filter((s: any) => s.status === 'CONFIRMED').length },
          { label: isAr ? 'إيرادات الجلسات' : 'Session Revenue', value: `${totalRevenue} ${isAr ? 'ر.س' : 'SAR'}` },
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
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-[color:var(--surface)]" />)}
        </div>
      ) : (sessions as any[]).length === 0 ? (
        <div className="rounded-2xl border border-[color:var(--border)] py-12 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="text-[color:var(--muted)]">{isAr ? 'لا توجد جلسات' : 'No sessions found'}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[color:var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-2)]">
                {[
                  isAr ? 'الطالب' : 'Student',
                  isAr ? 'المستشار' : 'Consultant',
                  isAr ? 'التاريخ' : 'Date',
                  isAr ? 'الطريقة' : 'Method',
                  isAr ? 'السعر' : 'Price',
                  isAr ? 'الدفع' : 'Payment',
                  isAr ? 'الحالة' : 'Status',
                ].map(h => (
                  <th key={h} className="px-4 py-3 text-right text-xs font-semibold text-[color:var(--muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {(sessions as any[]).map((s) => {
                const st = statusConfig[s.status] || statusConfig.PENDING
                const studentName = userName(s.student)
                const consultantName = userName(s.consultant)
                const date = new Date(s.scheduledAt)
                const MethodIcon = s.meetingMethod === 'ZOOM' ? Video : s.meetingMethod === 'GOOGLE_MEET' ? Globe : Phone
                return (
                  <tr key={s.id} className="bg-[color:var(--surface)] hover:bg-[color:var(--surface-2)] transition">
                    <td className="px-4 py-3 font-medium text-foreground">{studentName}</td>
                    <td className="px-4 py-3 text-[color:var(--muted)]">{consultantName}</td>
                    <td className="px-4 py-3 text-[color:var(--muted)] text-xs">
                      {date.toLocaleDateString(isAr ? 'ar-SA' : 'en-US')} {date.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3"><MethodIcon className="h-4 w-4 text-[color:var(--muted)]" /></td>
                    <td className="px-4 py-3 font-bold text-primary">{s.price} {isAr ? 'ر.س' : 'SAR'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.paymentStatus === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {s.paymentStatus === 'PAID' ? (isAr ? 'مدفوع' : 'Paid') : (isAr ? 'غير مدفوع' : 'Unpaid')}
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

      {/* Create Session Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowCreate(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
            <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: 18, color: '#fff', margin: '0 0 20px' }}>
              {isAr ? 'إضافة جلسة جديدة' : 'Add New Session'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select value={sessionForm.studentId} onChange={e => setSessionForm(f => ({ ...f, studentId: e.target.value }))} style={MODAL_INPUT}>
                <option value="">{isAr ? '-- اختر الطالب --' : '-- Select Student --'}</option>
                {(students as any[]).map((u: any) => (
                  <option key={u.id} value={u.id}>{userName(u)}</option>
                ))}
              </select>
              <select value={sessionForm.consultantId} onChange={e => setSessionForm(f => ({ ...f, consultantId: e.target.value }))} style={MODAL_INPUT}>
                <option value="">{isAr ? '-- اختر المستشار --' : '-- Select Consultant --'}</option>
                {(consultants as any[]).map((u: any) => (
                  <option key={u.id} value={u.id}>{userName(u)}</option>
                ))}
              </select>
              <input
                placeholder={isAr ? 'الموضوع' : 'Topic'}
                value={sessionForm.topic}
                onChange={e => setSessionForm(f => ({ ...f, topic: e.target.value }))}
                style={MODAL_INPUT}
              />
              <input
                type="datetime-local"
                value={sessionForm.scheduledAt}
                onChange={e => setSessionForm(f => ({ ...f, scheduledAt: e.target.value }))}
                style={MODAL_INPUT}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input
                  type="number"
                  placeholder={isAr ? 'السعر' : 'Price'}
                  value={sessionForm.price}
                  onChange={e => setSessionForm(f => ({ ...f, price: Number(e.target.value) }))}
                  style={MODAL_INPUT}
                />
                <select value={sessionForm.meetingMethod} onChange={e => setSessionForm(f => ({ ...f, meetingMethod: e.target.value }))} style={MODAL_INPUT}>
                  <option value="ONLINE">{isAr ? 'عبر الإنترنت' : 'Online'}</option>
                  <option value="IN_PERSON">{isAr ? 'حضوري' : 'In Person'}</option>
                </select>
              </div>
              {createError && (
                <p style={{ color: '#f87171', fontSize: 12, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>{createError}</p>
              )}
              <button
                onClick={handleCreateSession}
                disabled={creating || !sessionForm.studentId || !sessionForm.consultantId || !sessionForm.scheduledAt}
                style={{ background: '#5120c8', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: creating ? 0.7 : 1 }}
              >
                {creating ? '...' : (isAr ? 'إنشاء الجلسة' : 'Create Session')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
