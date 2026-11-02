'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, patch, post } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import {
  formatFullDate,
  formatShortDate,
  formatTimeOnly,
  formatTimeRange,
  formatTimeSafe,
  type DateLike,
} from '@/lib/time'
import Link from 'next/link'

const Ic = {
  alert: (p: { size?: number }) => (
    <svg width={p.size??13} height={p.size??13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  calendar: (p: { size?: number }) => (
    <svg width={p.size??10} height={p.size??10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  check: (p: { size?: number }) => (
    <svg width={p.size??12} height={p.size??12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  clock: (p: { size?: number }) => (
    <svg width={p.size??11} height={p.size??11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  mail: (p: { size?: number }) => (
    <svg width={p.size??10} height={p.size??10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>
  ),
  play: (p: { size?: number }) => (
    <svg width={p.size??12} height={p.size??12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
  ),
  refresh: (p: { size?: number }) => (
    <svg width={p.size??12} height={p.size??12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
  ),
  users: (p: { size?: number }) => (
    <svg width={p.size??20} height={p.size??20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  video: (p: { size?: number }) => (
    <svg width={p.size??13} height={p.size??13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
  ),
  x: (p: { size?: number }) => (
    <svg width={p.size??12} height={p.size??12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
}
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
  const router = useRouter()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<TabKey>('pending_approval')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [rescheduleSession, setRescheduleSession] = useState<any | null>(null)
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
    mutationFn: async (id: string) => {
      const response = await post(`/consulting/sessions/${id}/start-room`, {})
      return { id, response }
    },
    onSuccess: ({ id }: { id: string }) => {
      router.push(`/${locale}/dashboard/consulting/${id}/go-live`)
      toast.success(isAr ? 'تم بدء الجلسة' : 'Session started')
      invalidate()
    },
    onError: (error: any) =>
      toast.error(error?.response?.data?.message || (isAr ? 'تعذر بدء الجلسة' : 'Failed to start session')),
  })

  const joinRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await post(`/consulting/sessions/${id}/join-room`, {})
      return { id, response }
    },
    onSuccess: ({ id }: { id: string }) => {
      router.push(`/${locale}/dashboard/consulting/${id}/go-live`)
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
    if (!scheduledAt) return Number.NaN
    const start = scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt as string)
    if (isNaN(start.getTime())) return Number.NaN
    return (start.getTime() - Date.now()) / 60000
  }

  const canStart = (_scheduledAt: DateLike) => true

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
                <Ic.users size={20} />
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
              <Ic.refresh size={12} />
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
            <span style={{ color: 'var(--muted)', opacity: 0.4, display: 'block', margin: '0 auto 14px', width: 'fit-content' }}><Ic.users size={44} /></span>
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
                      <Ic.video size={13} />
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
                      <Ic.alert size={13} />
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
                              <Ic.mail size={10} />
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
                          <Ic.calendar size={10} />
                          {formatShortDate(scheduledAt, locale)}
                        </span>
                      </div>
                    </div>

                    <div
                      className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border px-3 py-2"
                      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                    >
                      <span className="flex items-center gap-1 text-[11px] font-bold">
                        <span style={{ color: 'var(--muted)' }}><Ic.clock size={11} /></span>
                        {formatTimeSafe(session.scheduledAt, locale, '—')}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                        <Ic.video size={11} />
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
                            <Ic.check size={12} />
                            {isAr ? 'موافقة' : 'Approve'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setRescheduleSession(session)
                            }}
                            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold"
                            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)', cursor: 'pointer' }}
                          >
                            <Ic.clock size={12} />
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
                            <Ic.x size={12} />
                            {isAr ? 'رفض' : 'Reject'}
                          </button>
                        </>
                      )}

                      {status === 'CONFIRMED' && (
                        <button
                          type="button"
                          onClick={() => router.push(`/${locale}/dashboard/consulting/${session.id}/go-live`)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-black"
                          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}
                        >
                          <Ic.play size={12} />
                          {isAr ? 'بدء الجلسة' : 'Start session'}
                        </button>
                      )}

                      {status === 'IN_PROGRESS' && (
                        <button
                          type="button"
                          onClick={() => router.push(`/${locale}/dashboard/consulting/${session.id}/go-live`)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-black"
                          style={{ background: 'color-mix(in srgb, var(--accent) 20%, transparent)', color: 'var(--accent)', border: '1.5px solid var(--accent)', cursor: 'pointer' }}
                        >
                          <Ic.video size={12} />
                          {isAr ? 'انضم للجلسة' : 'Join session'}
                        </button>
                      )}

                      {canReschedule && status !== 'PENDING_APPROVAL' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRescheduleSession(session)
                          }}
                          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold"
                          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)', cursor: 'pointer' }}
                        >
                          <Ic.clock size={12} />
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
                          <Ic.x size={12} />
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
        <RescheduleModal
          session={rescheduleSession}
          isAr={isAr}
          submitting={requestRescheduleMutation.isPending}
          onClose={() => setRescheduleSession(null)}
          onSubmit={(proposedAt, reason) =>
            requestRescheduleMutation.mutate({ id: rescheduleSession.id, proposedAt, reason })
          }
        />
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

// ─── Reschedule modal: calendar → time slots → confirm ──────────────────────

interface RescheduleSlot {
  time: string
  status: 'available' | 'booked'
  isCurrentSession?: boolean
  clientName?: string
  sessionTopic?: string
}

function RescheduleModal({
  session,
  isAr,
  submitting,
  onClose,
  onSubmit,
}: {
  session: any
  isAr: boolean
  submitting: boolean
  onClose: () => void
  onSubmit: (proposedAt: string, reason?: string) => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [slots, setSlots] = useState<RescheduleSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotsError, setSlotsError] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => new Date())

  const tr = (ar: string, en: string) => (isAr ? ar : en)
  const dateLocale = isAr ? 'ar-EG-u-ca-gregory' : 'en-US'
  const dayNames = isAr
    ? ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const duration = session.duration || 60

  useEffect(() => {
    if (!selectedDate) return
    let cancelled = false
    const from = new Date(selectedDate)
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setDate(to.getDate() + 1)
    setLoadingSlots(true)
    setSlotsError(false)
    setSlots([])
    setSelectedSlot(null)
    get(`/consulting/sessions/${session.id}/reschedule-slots`, {
      params: { from: from.toISOString(), to: to.toISOString() },
    })
      .then((res: any) => {
        if (cancelled) return
        setSlots(res?.data?.data?.slots ?? [])
      })
      .catch(() => {
        if (cancelled) return
        setSlotsError(true)
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedDate, session.id])

  const formatSlot = (iso: string) =>
    new Date(iso).toLocaleTimeString(dateLocale, { hour: 'numeric', minute: '2-digit' })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()

  const font = 'PingAR'
  const muted = 'var(--muted)'
  const faint = 'color-mix(in srgb, var(--foreground) 8%, transparent)'

  const primaryBtn = (enabled: boolean): React.CSSProperties => ({
    background: enabled ? 'var(--primary)' : faint,
    color: enabled ? 'var(--primary-foreground)' : muted,
    border: 'none',
    borderRadius: 10,
    padding: '10px 0',
    fontFamily: font,
    fontWeight: 500,
    fontSize: 14,
    cursor: enabled ? 'pointer' : 'not-allowed',
  })
  const ghostBtn: React.CSSProperties = {
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--foreground)',
    borderRadius: 10,
    padding: '10px 0',
    fontFamily: font,
    fontWeight: 300,
    fontSize: 13,
    cursor: 'pointer',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'color-mix(in srgb, var(--foreground) 60%, transparent)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(event) => event.stopPropagation()}
        style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20,
          width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: font, fontWeight: 500, fontSize: 16, color: 'var(--foreground)' }}>
              {tr('إعادة جدولة الجلسة', 'Reschedule session')}
            </div>
            <div style={{ fontFamily: font, fontWeight: 300, fontSize: 12, color: muted, marginTop: 3 }}>
              {session.topic || session.sessionName || ''} — {duration} {tr('دقيقة', 'min')}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tr('إغلاق', 'Close')}
            style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: faint, color: muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '16px 24px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
          {([1, 2, 3] as const).map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step >= s ? 'var(--primary)' : faint,
                color: step >= s ? 'var(--primary-foreground)' : muted,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: font, fontWeight: 500, fontSize: 12,
              }}>{s}</div>
              <span style={{ fontFamily: font, fontWeight: 300, fontSize: 11, color: step >= s ? 'var(--foreground)' : muted }}>
                {s === 1 ? tr('التاريخ', 'Date') : s === 2 ? tr('الوقت', 'Time') : tr('تأكيد', 'Confirm')}
              </span>
              {s < 3 && <div style={{ width: 24, height: 1, background: 'var(--border)' }} />}
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 24px 24px' }}>
          {step === 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', padding: '4px 8px' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isAr ? 'scaleX(-1)' : undefined }}>
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span style={{ fontFamily: font, fontWeight: 500, fontSize: 14, color: 'var(--foreground)' }}>
                  {currentMonth.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', padding: '4px 8px' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isAr ? 'scaleX(-1)' : undefined }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
                {dayNames.map((d) => (
                  <div key={d} style={{ textAlign: 'center', fontFamily: font, fontWeight: 300, fontSize: 11, color: muted, padding: '4px 0' }}>{d}</div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                  const available = date >= today
                  const isSelected = selectedDate?.toDateString() === date.toDateString()
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => available && setSelectedDate(date)}
                      disabled={!available}
                      style={{
                        aspectRatio: '1', borderRadius: 8, border: 'none',
                        background: isSelected ? 'var(--primary)' : available ? faint : 'transparent',
                        color: isSelected ? 'var(--primary-foreground)' : available ? 'var(--foreground)' : 'color-mix(in srgb, var(--foreground) 20%, transparent)',
                        cursor: available ? 'pointer' : 'not-allowed',
                        fontFamily: font, fontWeight: 300, fontSize: 13,
                      }}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>

              {selectedDate && (
                <button type="button" onClick={() => setStep(2)} style={{ ...primaryBtn(true), width: '100%', marginTop: 16 }}>
                  {tr('التالي — اختر الوقت', 'Next — choose a time')}
                </button>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ fontFamily: font, fontWeight: 300, fontSize: 13, color: muted, marginBottom: 16 }}>
                {selectedDate?.toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

              {loadingSlots ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: muted, fontFamily: font, fontWeight: 300, fontSize: 13 }}>
                  {tr('جاري تحميل الأوقات المتاحة...', 'Loading available times...')}
                </div>
              ) : slotsError ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--error)', fontFamily: font, fontWeight: 300, fontSize: 13 }}>
                  {tr('تعذر تحميل الأوقات', 'Could not load times')}
                </div>
              ) : slots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: muted, fontFamily: font, fontWeight: 300, fontSize: 13 }}>
                  {tr('لا توجد أوقات في هذا اليوم', 'No times on this day')}
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {slots.map((slot) => {
                      const isAvailable = slot.status === 'available'
                      const isCurrent = !!slot.isCurrentSession
                      const isBooked = slot.status === 'booked' && !isCurrent
                      const isSelected = selectedSlot === slot.time
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => isAvailable && setSelectedSlot(slot.time)}
                          disabled={!isAvailable}
                          title={
                            isCurrent
                              ? tr('الموعد الحالي لهذا العميل', 'Current time of this client')
                              : isBooked
                                ? `${slot.clientName ?? tr('عميل', 'Client')}${slot.sessionTopic ? ' — ' + slot.sessionTopic : ''}`
                                : ''
                          }
                          style={{
                            padding: '8px 4px', borderRadius: 8,
                            border: isSelected
                              ? '1.5px solid var(--primary)'
                              : isCurrent
                                ? '1.5px solid var(--accent)'
                                : isBooked
                                  ? '1px solid color-mix(in srgb, var(--foreground) 10%, transparent)'
                                  : '1px solid var(--border)',
                            background: isSelected
                              ? 'var(--primary-subtle)'
                              : isCurrent
                                ? 'var(--accent-light)'
                                : isBooked
                                  ? 'color-mix(in srgb, var(--foreground) 4%, transparent)'
                                  : 'var(--card)',
                            color: isSelected
                              ? 'var(--primary)'
                              : isCurrent
                                ? 'var(--accent)'
                                : isBooked
                                  ? 'color-mix(in srgb, var(--foreground) 35%, transparent)'
                                  : 'var(--foreground)',
                            cursor: isAvailable ? 'pointer' : 'not-allowed',
                            fontFamily: font, fontWeight: isCurrent ? 500 : 300, fontSize: 12,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                          }}
                        >
                          <span>{formatSlot(slot.time)}</span>
                          {isCurrent && <span style={{ fontSize: 9, opacity: 0.8 }}>{tr('موعده الحالي', 'Current time')}</span>}
                          {isBooked && <span style={{ fontSize: 9, opacity: 0.8, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slot.clientName ?? tr('محجوز', 'Booked')}</span>}
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                    {[
                      { color: 'var(--border)', label: tr('متاح', 'Available') },
                      { color: 'var(--accent)', label: tr('الموعد الحالي', 'Current time') },
                      { color: 'color-mix(in srgb, var(--foreground) 20%, transparent)', label: tr('محجوز', 'Booked') },
                    ].map((item) => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, border: `1.5px solid ${item.color}`, background: 'transparent' }} />
                        <span style={{ fontFamily: font, fontWeight: 300, fontSize: 11, color: muted }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="button" onClick={() => setStep(1)} style={{ ...ghostBtn, flex: 1 }}>{tr('رجوع', 'Back')}</button>
                <button type="button" disabled={!selectedSlot} onClick={() => selectedSlot && setStep(3)} style={{ ...primaryBtn(!!selectedSlot), flex: 2 }}>
                  {tr('التالي — تأكيد', 'Next — confirm')}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={{ padding: '14px 16px', borderRadius: 12, marginBottom: 16, background: faint, border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: font, fontWeight: 500, fontSize: 13, color: 'var(--foreground)', marginBottom: 10 }}>
                  {tr('ملخص الموعد الجديد', 'New time summary')}
                </div>
                {[
                  { label: tr('التاريخ', 'Date'), value: selectedDate?.toLocaleDateString(dateLocale, { weekday: 'long', month: 'long', day: 'numeric' }) ?? '' },
                  { label: tr('الوقت', 'Time'), value: selectedSlot ? formatSlot(selectedSlot) : '' },
                  { label: tr('المدة', 'Duration'), value: `${duration} ${tr('دقيقة', 'min')}` },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontFamily: font, fontWeight: 300, fontSize: 12, color: muted }}>{row.label}</span>
                    <span style={{ fontFamily: font, fontWeight: 300, fontSize: 12, color: 'var(--foreground)' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: 'var(--primary-subtle)', border: '1px solid var(--primary-border)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span style={{ fontFamily: font, fontWeight: 300, fontSize: 12, color: 'var(--foreground)' }}>
                  {tr('سيتم إرسال إشعار للعميل بالموعد الجديد ويطلب موافقته', 'The client will be notified of the new time and asked to approve it')}
                </span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label htmlFor="reschedule-reason" style={{ fontFamily: font, fontWeight: 300, fontSize: 12, color: muted, display: 'block', marginBottom: 6 }}>
                  {tr('سبب إعادة الجدولة (اختياري)', 'Reason (optional)')}
                </label>
                <textarea
                  id="reschedule-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder={tr('مثال: ارتباط طارئ', 'e.g. Emergency')}
                  rows={2}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', resize: 'none', fontFamily: font, fontWeight: 300, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setStep(2)} style={{ ...ghostBtn, flex: 1 }}>{tr('رجوع', 'Back')}</button>
                <button
                  type="button"
                  disabled={submitting || !selectedSlot}
                  onClick={() => selectedSlot && onSubmit(selectedSlot, reason.trim() || undefined)}
                  style={{ ...primaryBtn(!submitting), flex: 2, opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? tr('جاري الإرسال...', 'Sending...') : tr('تأكيد إعادة الجدولة', 'Confirm reschedule')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
