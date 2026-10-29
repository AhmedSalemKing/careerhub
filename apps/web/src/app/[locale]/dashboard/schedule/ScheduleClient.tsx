'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { api } from '../../../../lib/api'
import { ChevronLeft, ChevronRight, Video, Calendar } from 'lucide-react'

interface Session {
  id: string
  scheduledAt: string
  duration: number
  status: string
  topic?: string
  sessionName?: string
  price?: number
  user?: {
    id: string
    profile?: { firstName?: string; lastName?: string; avatar?: string }
  }
  consultant?: {
    id: string
    profile?: { firstName?: string; lastName?: string; avatar?: string }
  }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING_APPROVAL: '#FFC107',
  AWAITING_PAYMENT: '#FF9800',
  CONFIRMED: '#1B4F72',
  IN_PROGRESS: '#27AE60',
  COMPLETED: '#95A5A6',
  CANCELLED: '#E74C3C',
  RESCHEDULE_REQUESTED: '#9B59B6',
}

const STATUS_LABELS_AR: Record<string, string> = {
  PENDING_APPROVAL: 'بانتظار الموافقة',
  AWAITING_PAYMENT: 'بانتظار الدفع',
  CONFIRMED: 'مؤكدة',
  IN_PROGRESS: 'جارية',
  COMPLETED: 'مكتملة',
  CANCELLED: 'ملغاة',
  RESCHEDULE_REQUESTED: 'تغيير موعد',
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

function startOfWeek(d: Date): Date {
  const day = d.getDay()
  const diff = (day + 6) % 7 // Saturday start for Arabic week
  const start = new Date(d)
  start.setDate(start.getDate() - diff)
  start.setHours(0, 0, 0, 0)
  return start
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
}

function userName(u?: { profile?: { firstName?: string; lastName?: string } }) {
  return `${u?.profile?.firstName || ''} ${u?.profile?.lastName || ''}`.trim() || '—'
}

export default function ScheduleClient() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Session | null>(null)
  const [starting, setStarting] = useState(false)

  const weekDays = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const from = formatDate(weekStart)
      const to = formatDate(addDays(weekStart, 6))
      const res = await api.get('/consulting/sessions')
      const all = (res.data.data?.clientSessions || []) as Session[]
      setSessions(
        all.filter(
          (s) =>
            new Date(s.scheduledAt) >= new Date(from) &&
            new Date(s.scheduledAt) <= new Date(`${to}T23:59:59.999Z`),
        ),
      )
    } catch (e) {
      console.error('[Schedule] load error', e)
    }
    setLoading(false)
  }, [weekStart])

  useEffect(() => {
    load()
  }, [load])

  async function startRoom(sessionId: string) {
    setStarting(true)
    try {
      const res = await api.post(`/consulting/sessions/${sessionId}/start-room`)
      const { roomUrl } = res.data.data || {}
      if (roomUrl) window.open(roomUrl, '_blank')
      load()
    } catch (e) {
      console.error('[Schedule] start room error', e)
      alert(isAr ? 'فشل بدء الجلسة' : 'Failed to start session')
    }
    setStarting(false)
  }

  const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8am to 8pm

  return (
    <div dir="rtl" className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">{isAr ? 'جدول مواعيدي' : 'My Schedule'}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="rounded-lg border border-[color:var(--border)] p-2 hover:bg-[color:var(--surface-2)]"
          >
            <ChevronRight size={18} />
          </button>
          <span className="min-w-[140px] text-center text-sm font-semibold">
            {weekStart.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="rounded-lg border border-[color:var(--border)] p-2 hover:bg-[color:var(--surface-2)]"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-[color:var(--muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>}

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-7 gap-1 border-b border-[color:var(--border)] pb-2">
            <div className="text-center text-xs font-bold text-[color:var(--muted)]">{isAr ? 'الوقت' : 'Time'}</div>
            {weekDays.map((d) => (
              <div key={d.toISOString()} className="text-center text-xs font-bold">
                <div className="text-[color:var(--muted)]">{d.toLocaleDateString('ar-EG', { weekday: 'long' })}</div>
                <div>{d.getDate()}</div>
              </div>
            ))}
          </div>

          <div className="mt-1 space-y-1">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-7 gap-1">
                <div className="flex items-start justify-center pt-1 text-xs text-[color:var(--muted)]">
                  {`${String(hour).padStart(2, '0')}:00`}
                </div>
                {weekDays.map((day) => {
                  const slotStart = new Date(day)
                  slotStart.setHours(hour, 0, 0, 0)
                  const slotEnd = new Date(slotStart)
                  slotEnd.setMinutes(slotEnd.getMinutes() + 60)
                  const matches = sessions.filter((s) => {
                    const start = new Date(s.scheduledAt)
                    return start >= slotStart && start < slotEnd
                  })
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="min-h-[64px] rounded border border-[color:var(--border)] bg-[color:var(--surface)] p-1"
                    >
                      {matches.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelected(s)}
                          className="mb-1 w-full rounded px-2 py-1 text-right text-xs text-white"
                          style={{ backgroundColor: STATUS_COLORS[s.status] || '#888' }}
                        >
                          <div className="font-semibold">{userName(s.user)}</div>
                          <div className="opacity-90">{formatTime(new Date(s.scheduledAt))}</div>
                          <div className="opacity-90">{s.duration} {isAr ? 'دقيقة' : 'min'}</div>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null)
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-[color:var(--card)] p-6 shadow-lg">
            <h2 className="mb-2 text-lg font-bold">{selected.sessionName || selected.topic}</h2>
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[color:var(--muted)]" />
                <span>{new Date(selected.scheduledAt).toLocaleString('ar-EG')}</span>
              </div>
              <div>
                <span className="text-[color:var(--muted)]">{isAr ? 'الحالة:' : 'Status:'}</span>{' '}
                <span
                  className="rounded px-2 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: STATUS_COLORS[selected.status] || '#888' }}
                >
                  {STATUS_LABELS_AR[selected.status] || selected.status}
                </span>
              </div>
              <div>
                <span className="text-[color:var(--muted)]">{isAr ? 'الطالب:' : 'Student:'}</span>{' '}
                {userName(selected.user)}
              </div>
              <div>
                <span className="text-[color:var(--muted)]">{isAr ? 'الموضوع:' : 'Topic:'}</span>{' '}
                {selected.topic}
              </div>
              <div>
                <span className="text-[color:var(--muted)]">{isAr ? 'السعر:' : 'Price:'}</span>{' '}
                {selected.price || 0} {isAr ? 'ر.س' : 'SAR'}
              </div>
            </div>
            <div className="flex gap-2">
              {selected.status === 'CONFIRMED' && (
                <button
                  onClick={() => startRoom(selected.id)}
                  disabled={starting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#27AE60] px-4 py-2 text-sm font-bold text-white"
                >
                  <Video size={16} />
                  {starting ? (isAr ? 'جاري...' : 'Starting...') : isAr ? 'بدء الجلسة' : 'Start Session'}
                </button>
              )}
              <button
                onClick={() => setSelected(null)}
                className="flex-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-bold"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
