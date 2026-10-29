'use client'

import { useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch, post } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import {
  formatFullDate,
  formatShortDate,
  formatTimeOnly,
  formatTimeRange,
  formatTimeSafe,
  localDateTimeToISO,
  parseDate,
  type DateLike,
} from '@/lib/time'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
  Mail,
  Play,
  RefreshCw,
  Users,
  Video,
  X,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'

interface StatusStyle {
  ar: string
  en: string
  color: string
  subtle: string
}

const STATUS_CONFIG: Record<string, StatusStyle> = {
  PENDING_APPROVAL: {
    ar: 'بانتظار الموافقة',
    en: 'Pending approval',
    color: 'var(--warning)',
    subtle: 'var(--warning-subtle)',
  },
  AWAITING_PAYMENT: {
    ar: 'بانتظار الدفع',
    en: 'Awaiting payment',
    color: 'var(--warning)',
    subtle: 'var(--warning-subtle)',
  },
  CONFIRMED: {
    ar: 'مؤكدة',
    en: 'Confirmed',
    color: 'var(--primary)',
    subtle: 'var(--primary-subtle)',
  },
  IN_PROGRESS: {
    ar: 'جارية',
    en: 'In progress',
    color: 'var(--accent)',
    subtle: 'var(--accent-light)',
  },
  COMPLETED: {
    ar: 'مكتملة',
    en: 'Completed',
    color: 'var(--muted)',
    subtle: 'var(--surface-2)',
  },
  CANCELLED: {
    ar: 'ملغاة',
    en: 'Cancelled',
    color: 'var(--error)',
    subtle: 'var(--error-subtle)',
  },
  RESCHEDULE_REQUESTED: {
    ar: 'تغيير موعد',
    en: 'Reschedule requested',
    color: 'var(--accent)',
    subtle: 'var(--accent-light)',
  },
}

type TabKey = 'pending_approval' | 'awaiting_payment' | 'upcoming' | 'completed' | 'cancelled'

const TABS: { key: TabKey; ar: string; en: string; statuses: string[] }[] = [
  { key: 'pending_approval', ar: 'بانتظار موافقتي', en: 'Pending approval', statuses: ['PENDING_APPROVAL'] },
  { key: 'awaiting_payment', ar: 'انتظار الدفع', en: 'Awaiting payment', statuses: ['AWAITING_PAYMENT'] },
  {
    key: 'upcoming',
    ar: 'القادمة',
    en: 'Upcoming',
    statuses: ['CONFIRMED', 'IN_PROGRESS', 'RESCHEDULE_REQUESTED'],
  },
  { key: 'completed', ar: 'المكتملة', en: 'Completed', statuses: ['COMPLETED'] },
  { key: 'cancelled', ar: 'الملغاة', en: 'Cancelled', statuses: ['CANCELLED'] },
]

/**
 * Map every status a legacy row may carry onto the rebuilt flow.
 * Old rows created before the rebuild use PENDING, RESCHEDULED or REJECTED.
 */
function displayStatus(status?: string | null): string {
  switch (status) {
    case 'PENDING':
      return 'PENDING_APPROVAL'
    case 'RESCHEDULED':
      return 'RESCHEDULE_REQUESTED'
    case 'REJECTED':
    case 'EXPIRED':
      return 'CANCELLED'
    case undefined:
    case null:
    case '':
      return 'PENDING_APPROVAL'
    default:
      return status
  }
}

function clientName(session: any): string {
  const profile = session?.user?.profile
  return `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
}

/**
 * Sessions created before the rebuild can carry a legacy field name or no date
 * at all, which is what produced "Invalid Date" on the cards. Resolve the value
 * once, then always format through the null-safe helpers.
 */
function scheduledAtOf(session: any): DateLike {
  return session?.scheduledAt ?? session?.scheduled_at ?? session?.startTime ?? session?.date ?? null
}

function durationOf(session: any): number {
  const value = Number(session?.duration ?? session?.durationMinutes ?? 60)
  return isNaN(value) || value <= 0 ? 60 : value
}

function normalize(row: any) {
  return { ...row, scheduledAt: scheduledAtOf(row), duration: durationOf(row) }
}

async function loadClientSessions(): Promise<any[]> {
  try {
    const response = await get('/consulting/sessions')
    const data = response.data?.data
    if (Array.isArray(data?.clientSessions)) return data.clientSessions.map(normalize)
    if (Array.isArray(data)) return data.map(normalize)
  } catch (error) {
    console.warn('[client-sessions] /consulting/sessions unavailable, falling back', error)
  }

  const response = await get('/sessions/my-sessions')
  const data = response.data?.data
  const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.sessions) ? data.sessions : []
  const userId = useAuthStore.getState().user?.id
  const filtered = userId ? list.filter((session) => session.consultantId === userId) : list
  return filtered.map(normalize)
}

export default function ClientSessionsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<TabKey>('pending_approval')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [rescheduleSession, setRescheduleSession] = useState<any | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    destructive?: boolean
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const { data: sessions = [], isLoading, refetch } = useQuery<any[]>({
    queryKey: ['client-sessions'],
    queryFn: loadClientSessions,
    refetchInterval: 30000,
  })

  const counts = useMemo(() => {
    const byStatus: Record<string, number> = {}
    for (const session of sessions) {
      const status = displayStatus(session.status)
      byStatus[status] = (byStatus[status] || 0) + 1
    }
    return byStatus
  }, [sessions])

  const filtered = useMemo(
    () =>
      sessions.filter((session) =>
        TABS.find((tab) => tab.key === activeTab)?.statuses.includes(displayStatus(session.status)),
      ),
    [sessions, activeTab],
  )

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['client-sessions'] })

  const handleApprove = async (sessionId: string) => {
    try {
      setLoadingId(sessionId)
      await patch(`/consulting/sessions/${sessionId}/approve`, {})
      toast.success(isAr ? 'تمت الموافقة على الجلسة' : 'Session approved')
      invalidate()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || (isAr ? 'تعذرت الموافقة على الجلسة' : 'Failed to approve session'))
    } finally {
      setLoadingId(null)
    }
  }

  const handleReject = async (sessionId: string) => {
    try {
      setLoadingId(sessionId)
      await patch(`/consulting/sessions/${sessionId}/cancel`, {})
      toast.success(isAr ? 'تم رفض الجلسة' : 'Session rejected')
      invalidate()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || (isAr ? 'تعذر رفض الجلسة' : 'Failed to reject session'))
    } finally {
      setLoadingId(null)
    }
  }

  const startRoomMutation = useMutation({
    mutationFn: (id: string) => post(`/consulting/sessions/${id}/start-room`, {}),
    onSuccess: (response: any) => {
      const roomUrl = response?.data?.data?.roomUrl
      if (roomUrl) window.open(roomUrl, '_blank')
      toast.success(isAr ? 'تم بدء الجلسة' : 'Session started')
      invalidate()
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || (isAr ? 'تعذر بدء الجلسة' : 'Failed to start session')),
  })

  const joinRoomMutation = useMutation({
    mutationFn: (id: string) => post(`/consulting/sessions/${id}/join-room`, {}),
    onSuccess: (response: any) => {
      const roomUrl = response?.data?.data?.roomUrl
      if (roomUrl) window.open(roomUrl, '_blank')
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || (isAr ? 'تعذر الانضمام للجلسة' : 'Failed to join session')),
  })

  const requestRescheduleMutation = useMutation({
    mutationFn: ({ id, proposedAt, reason }: { id: string; proposedAt: string; reason?: string }) =>
      patch(`/consulting/sessions/${id}/request-reschedule`, { proposedAt, reason }),
    onSuccess: () => {
      toast.success(isAr ? 'تم إرسال طلب تغيير الموعد' : 'Reschedule request sent')
      setRescheduleSession(null)
      setNewDate('')
      setNewTime('')
      setRescheduleReason('')
      invalidate()
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || (isAr ? 'تعذر إرسال الطلب' : 'Failed to send request')),
  })

  /**
   * Minutes until the session starts. `NaN` means the row has no usable date,
   * in which case no start/join affordance is shown.
   */
  const minutesUntilStart = (scheduledAt: DateLike): number => {
    const start = parseDate(scheduledAt)
    if (!start) return Number.NaN
    return (start.getTime() - Date.now()) / 60000
  }

  const canStart = (scheduledAt: DateLike) => {
    const minutes = minutesUntilStart(scheduledAt)
    return Number.isFinite(minutes) && minutes <= 15 && minutes >= -120
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen pb-20"
      style={{ background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}
    >
      <header
        className="border-b px-4 pb-0 pt-6 sm:px-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}
              >
                <Users size={20} />
              </div>
              <div>
                <h1 className="text-lg font-black sm:text-xl" style={{ fontFamily: 'var(--font-madinet)' }}>
                  {isAr ? 'جلسات عملائي' : 'Client sessions'}
                </h1>
                <p className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                  {isAr ? `${sessions.length} جلسة من العملاء` : `${sessions.length} sessions from clients`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--muted)' }}
            >
              <RefreshCw size={12} />
              {isAr ? 'تحديث' : 'Refresh'}
            </button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {[
              {
                value: counts.PENDING_APPROVAL || 0,
                ar: 'بانتظار الموافقة',
                en: 'Pending approval',
                color: 'var(--warning)',
                subtle: 'var(--warning-subtle)',
              },
              {
                value: counts.AWAITING_PAYMENT || 0,
                ar: 'بانتظار الدفع',
                en: 'Awaiting payment',
                color: 'var(--warning)',
                subtle: 'var(--warning-subtle)',
              },
              {
                value: (counts.CONFIRMED || 0) + (counts.IN_PROGRESS || 0),
                ar: 'قادمة',
                en: 'Upcoming',
                color: 'var(--primary)',
                subtle: 'var(--primary-subtle)',
              },
            ].map((item) => (
              <div
                key={item.en}
                className="flex items-center gap-2 rounded-lg border px-3 py-2"
                style={{ borderColor: 'var(--border)', background: item.subtle }}
              >
                <span className="text-base font-black" style={{ color: item.color }}>
                  {item.value}
                </span>
                <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                  {isAr ? item.ar : item.en}
                </span>
              </div>
            ))}
          </div>

          <div className="-mb-px flex overflow-x-auto">
            {TABS.map((tab) => {
              const count = sessions.filter((session) =>
                tab.statuses.includes(displayStatus(session.status)),
              ).length
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className="flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-bold transition-colors"
                  style={{
                    borderColor: active ? 'var(--primary)' : 'transparent',
                    color: active ? 'var(--primary)' : 'var(--muted)',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  {isAr ? tab.ar : tab.en}
                  {count > 0 && (
                    <span
                      className="min-w-[18px] rounded-full px-1.5 py-0.5 text-[9px] font-black"
                      style={{
                        background: active ? 'var(--primary)' : 'var(--surface-2)',
                        color: active ? 'var(--primary-foreground)' : 'var(--muted)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto mt-5 max-w-3xl px-4 sm:px-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-2xl border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border px-6 py-16 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <Users size={44} style={{ color: 'var(--muted)', opacity: 0.4, margin: '0 auto 14px' }} />
            <h3 className="mb-2 text-base font-black">{isAr ? 'لا توجد جلسات هنا' : 'No sessions here'}</h3>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'ستظهر هنا الجلسات التي يحجزها العملاء معك'
                : 'Sessions booked with you by clients will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filtered.map((session) => {
              const status = displayStatus(session.status)
              const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_APPROVAL
              const name = clientName(session)
              const scheduledAt: DateLike = session.scheduledAt
              const minutesUntil = minutesUntilStart(scheduledAt)
              const soon = status === 'CONFIRMED' && canStart(scheduledAt)
              const rescheduleWaiting = status === 'RESCHEDULE_REQUESTED'
              const isCompleted = status === 'COMPLETED'
              const isLive = status === 'IN_PROGRESS'
              const baseDuration = durationOf(session)
              const duration = isCompleted ? session.actualDuration || baseDuration : baseDuration
              const canReschedule = ['PENDING_APPROVAL', 'AWAITING_PAYMENT', 'CONFIRMED', 'RESCHEDULE_REQUESTED'].includes(
                status,
              )
              const canCancel = canReschedule

              return (
                <article
                  key={session.id}
                  className="overflow-hidden rounded-2xl border transition-shadow"
                  style={{
                    background: 'var(--card)',
                    borderColor: soon ? 'var(--primary-border)' : rescheduleWaiting ? 'var(--accent)' : 'var(--border)',
                    boxShadow: soon ? '0 6px 20px var(--primary-subtle)' : 'none',
                  }}
                >
                  {soon && (
                    <div
                      className="flex items-center gap-2 border-b px-4 py-2 text-[11px] font-bold"
                      style={{ background: 'var(--primary-subtle)', borderColor: 'var(--primary-border)', color: 'var(--primary)' }}
                    >
                      <Video size={13} />
                      {minutesUntil > 1
                        ? isAr
                          ? `تبدأ خلال ${Math.round(minutesUntil)} دقيقة`
                          : `Starts in ${Math.round(minutesUntil)} minutes`
                        : isAr
                          ? 'بدأ وقت الجلسة'
                          : 'Session time is now'}
                    </div>
                  )}

                  {rescheduleWaiting && session.proposedAt && (
                    <div
                      className="flex flex-wrap items-center gap-2 border-b px-4 py-2 text-[11px] font-bold"
                      style={{ background: 'var(--accent-light)', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                    >
                      <AlertTriangle size={13} />
                      {isAr ? 'بانتظار موافقة العميل على الموعد الجديد' : 'Awaiting client approval for the new time'}
                      <span style={{ color: 'var(--foreground)' }}>
                        {formatFullDate(session.proposedAt, locale)} — {formatTimeSafe(session.proposedAt, locale)}
                      </span>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {session.user?.profile?.avatar ? (
                          <img
                            src={session.user.profile.avatar}
                            alt={name}
                            className="h-11 w-11 rounded-xl object-cover"
                            style={{ border: '1px solid var(--border)' }}
                          />
                        ) : (
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black"
                            style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}
                          >
                            {name.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">{name || (isAr ? 'عميل' : 'Client')}</p>
                          {session.user?.email && (
                            <p className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--muted)' }}>
                              <Mail size={10} />
                              <span className="truncate">{session.user.email}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className="rounded-full border px-2.5 py-1 text-[10px] font-black"
                          style={{ background: config.subtle, borderColor: config.color, color: config.color }}
                        >
                          {isAr ? config.ar : config.en}
                        </span>
                        <span
                          className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold"
                          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}
                        >
                          <CalendarDays size={10} />
                          {formatShortDate(scheduledAt, locale)}
                        </span>
                      </div>
                    </div>

                    <div
                      className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border px-3 py-2"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                    >
                      <span className="flex items-center gap-1 text-[11px] font-bold">
                        <Clock size={11} style={{ color: 'var(--muted)' }} />
                        {formatTimeOnly(session.scheduledAt, locale)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                        <Video size={11} />
                        {duration} {isAr ? 'دقيقة' : 'min'}
                      </span>
                      {isCompleted && (
                        <span className="text-[11px] font-bold" style={{ color: 'var(--muted)' }}>
                          {isAr ? 'انتهت' : 'Ended'}
                          {duration ? ` — ${duration} ${isAr ? 'دقيقة' : 'min'}` : ''}
                        </span>
                      )}
                    </div>

                    <div className="mb-3">
                      <p className="text-[10px] font-bold" style={{ color: 'var(--muted)' }}>
                        {isAr ? 'الموضوع' : 'Topic'}
                      </p>
                      <p className="text-xs font-semibold">
                        {session.topic || session.sessionName || session.description || (isAr ? '—' : '—')}
                      </p>
                      {session.notes && (
                        <p className="mt-1 text-[11px]" style={{ color: 'var(--muted)' }}>
                          {session.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {status === 'PENDING_APPROVAL' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(session.id)}
                            disabled={loadingId === session.id}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-black transition-opacity"
                            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer', opacity: loadingId === session.id ? 0.6 : 1 }}
                          >
                            <Check size={12} />
                            {isAr ? 'موافقة' : 'Approve'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setRescheduleSession(session)
                              setNewDate('')
                              setNewTime('')
                              setRescheduleReason('')
                            }}
                            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold"
                            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)', cursor: 'pointer' }}
                          >
                            <Clock size={12} />
                            {isAr ? 'إعادة الجدولة' : 'Reschedule'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: isAr ? 'رفض الجلسة' : 'Reject session',
                                message: isAr
                                  ? 'هل أنت متأكد من رفض طلب هذه الجلسة؟'
                                  : 'Are you sure you want to reject this session request?',
                                destructive: true,
                                onConfirm: () => {
                                  setConfirmModal((previous) => ({ ...previous, isOpen: false }))
                                  handleReject(session.id)
                                },
                              })
                            }}
                            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold"
                            style={{ background: 'var(--error-subtle)', borderColor: 'var(--error)', color: 'var(--error)', cursor: 'pointer' }}
                          >
                            <X size={12} />
                            {isAr ? 'رفض' : 'Reject'}
                          </button>
                        </>
                      )}

                      {status === 'CONFIRMED' && soon && (
                        <button
                          type="button"
                          onClick={() => startRoomMutation.mutate(session.id)}
                          disabled={startRoomMutation.isPending}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-black"
                          style={{ background: 'var(--accent)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer', opacity: startRoomMutation.isPending ? 0.7 : 1 }}
                        >
                          <Play size={12} />
                          {isAr ? 'بدء الجلسة' : 'Start session'}
                        </button>
                      )}

                      {status === 'IN_PROGRESS' && (
                        <button
                          type="button"
                          onClick={() => joinRoomMutation.mutate(session.id)}
                          disabled={joinRoomMutation.isPending}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-black"
                          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer', opacity: joinRoomMutation.isPending ? 0.7 : 1 }}
                        >
                          <ExternalLink size={12} />
                          {isAr ? 'انضم للجلسة' : 'Join session'}
                        </button>
                      )}

                      {canReschedule && status !== 'PENDING_APPROVAL' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRescheduleSession(session)
                            setNewDate('')
                            setNewTime('')
                            setRescheduleReason('')
                          }}
                          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold"
                          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)', cursor: 'pointer' }}
                        >
                          <Clock size={12} />
                          {isAr ? 'إعادة الجدولة' : 'Reschedule'}
                        </button>
                      )}

                      {canCancel && status !== 'PENDING_APPROVAL' && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmModal({
                              isOpen: true,
                              title: isAr ? 'إلغاء الجلسة' : 'Cancel session',
                              message: isAr
                                ? 'هل أنت متأكد من إلغاء هذه الجلسة؟'
                                : 'Are you sure you want to cancel this session?',
                              destructive: true,
                              onConfirm: () => {
                                setConfirmModal((previous) => ({ ...previous, isOpen: false }))
                                handleReject(session.id)
                              },
                            })
                          }
                          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold"
                          style={{ background: 'transparent', borderColor: 'var(--error)', color: 'var(--error)', cursor: 'pointer' }}
                        >
                          <X size={12} />
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      {rescheduleSession && (
        <>
          <div
            onClick={() => setRescheduleSession(null)}
            className="fixed inset-0 z-[200]"
            style={{ background: 'color-mix(in srgb, var(--foreground) 45%, transparent)' }}
          />
          <div
            dir="rtl"
            className="fixed left-1/2 top-1/2 z-[201] w-[min(420px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-5"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: '0 24px 64px color-mix(in srgb, var(--foreground) 25%, transparent)' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black">{isAr ? 'طلب تغيير الموعد' : 'Request reschedule'}</h3>
              <button
                type="button"
                onClick={() => setRescheduleSession(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border"
                style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>

            <p
              className="mb-4 rounded-lg border px-3 py-2 text-[11px] font-semibold"
              style={{ background: 'var(--warning-subtle)', borderColor: 'var(--warning)', color: 'var(--warning)' }}
            >
              {isAr ? 'سيتم إرسال إشعار للعميل للموافقة على الموعد الجديد' : 'The client will be notified to approve the new time'}
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold" htmlFor="reschedule-date">
                  {isAr ? 'التاريخ الجديد' : 'New date'} *
                </label>
                <input
                  id="reschedule-date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(event) => setNewDate(event.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 text-xs outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold">{isAr ? 'الوقت الجديد' : 'New time'} *</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
                    .filter(
                      (time) =>
                        !newDate ||
                        newDate !== new Date().toISOString().split('T')[0] ||
                        parseInt(time, 10) > new Date().getHours() + 1,
                    )
                    .map((time) => {
                      const active = newTime === time
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setNewTime(time)}
                          className="rounded-lg border py-2 text-[11px] font-bold"
                          style={{
                            borderColor: active ? 'var(--primary)' : 'var(--border)',
                            background: active ? 'var(--primary-subtle)' : 'var(--surface)',
                            color: active ? 'var(--primary)' : 'var(--muted)',
                            cursor: 'pointer',
                          }}
                        >
                          {time}
                        </button>
                      )
                    })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold" htmlFor="reschedule-reason">
                  {isAr ? 'السبب (اختياري)' : 'Reason (optional)'}
                </label>
                <input
                  id="reschedule-reason"
                  type="text"
                  value={rescheduleReason}
                  onChange={(event) => setRescheduleReason(event.target.value)}
                  placeholder={isAr ? 'مثال: ارتباط طارئ' : 'e.g. Emergency'}
                  className="w-full rounded-lg border px-3 py-2.5 text-xs outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRescheduleSession(null)}
                  className="flex-1 rounded-lg border py-2.5 text-xs font-bold"
                  style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={!newDate || !newTime || requestRescheduleMutation.isPending}
                  onClick={() =>
                    requestRescheduleMutation.mutate({
                      id: rescheduleSession.id,
                      proposedAt: localDateTimeToISO(newDate, newTime),
                      reason: rescheduleReason || undefined,
                    })
                  }
                  className="flex-[2] rounded-lg py-2.5 text-xs font-black"
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    border: 'none',
                    cursor: !newDate || !newTime ? 'not-allowed' : 'pointer',
                    opacity: !newDate || !newTime || requestRescheduleMutation.isPending ? 0.5 : 1,
                  }}
                >
                  {requestRescheduleMutation.isPending
                    ? isAr
                      ? 'جاري الإرسال...'
                      : 'Sending...'
                    : isAr
                      ? 'إرسال الطلب'
                      : 'Send request'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={isAr ? 'تأكيد' : 'Confirm'}
        cancelLabel={isAr ? 'إلغاء' : 'Cancel'}
        confirmDestructive={confirmModal.destructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((previous) => ({ ...previous, isOpen: false }))}
      />
    </div>
  )
}
