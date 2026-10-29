'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { get } from '@/lib/api'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Search,
  Users,
  Video,
  X,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Types                                                                 */
/* ------------------------------------------------------------------ */
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
    email?: string
    profile?: { firstName?: string; lastName?: string; avatar?: string }
  }
  consultant?: {
    id: string
    email?: string
    profile?: { firstName?: string; lastName?: string; avatar?: string }
  }
}

/* ------------------------------------------------------------------ */
/* Constants                                                             */
/* ------------------------------------------------------------------ */
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const ROW_HEIGHT = 60
const GRID_START_HOUR = 8
const GRID_END_HOUR = 21
const HOURS = Array.from({ length: GRID_END_HOUR - GRID_START_HOUR }, (_, i) => i + GRID_START_HOUR)

const STATUS_AR: Record<string, string> = {
  PENDING_APPROVAL: 'بانتظار الموافقة',
  PENDING: 'بانتظار الموافقة',
  AWAITING_PAYMENT: 'بانتظار الدفع',
  CONFIRMED: 'مؤكدة',
  IN_PROGRESS: 'جارية',
  COMPLETED: 'مكتملة',
  CANCELLED: 'ملغاة',
  RESCHEDULE_REQUESTED: 'تغيير موعد',
}

/* ------------------------------------------------------------------ */
/* Helpers                                                               */
/* ------------------------------------------------------------------ */
function addDays(d: Date, n: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

function startOfWeekSun(d: Date): Date {
  const start = new Date(d)
  start.setDate(start.getDate() - start.getDay())
  start.setHours(0, 0, 0, 0)
  return start
}

function fmt12(d: Date, isAr: boolean): string {
  return d.toLocaleTimeString(
    isAr ? 'ar-EG-u-ca-gregory' : 'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  )
}

function fmtFullDate(d: Date, isAr: boolean): string {
  return d.toLocaleDateString(
    isAr ? 'ar-EG-u-ca-gregory' : 'en-US-u-ca-gregory',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory' },
  )
}

function hourLabel(h: number): string {
  if (h < 12) return `${h}:00 ص`
  if (h === 12) return '12:00 م'
  return `${h - 12}:00 م`
}

function personName(s: Session): string {
  const u = s.user ?? s.consultant
  return `${u?.profile?.firstName || ''} ${u?.profile?.lastName || ''}`.trim() || '—'
}

/* ------------------------------------------------------------------ */
/* Status colours                                                        */
/* ------------------------------------------------------------------ */
function blockStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'CONFIRMED':
      return { background: 'var(--primary)', border: '1.5px solid var(--primary)', color: '#fff' }
    case 'IN_PROGRESS':
      return { background: 'var(--accent)', border: '1.5px solid var(--accent)', color: '#fff' }
    case 'COMPLETED':
      return {
        background: 'var(--accent-light)',
        border: '1.5px solid var(--accent)',
        color: 'var(--accent)',
        textDecoration: 'line-through' as const,
      }
    case 'CANCELLED':
      return { background: 'var(--error-subtle)', border: '1.5px solid var(--error)', color: 'var(--error)' }
    case 'RESCHEDULE_REQUESTED':
      return { background: 'var(--warning-subtle)', border: '1.5px solid var(--warning)', color: 'var(--warning)' }
    case 'PENDING':
    case 'PENDING_APPROVAL':
    case 'AWAITING_PAYMENT':
      return {
        background: 'var(--primary-subtle)',
        border: '1.5px dashed var(--primary-border)',
        color: 'var(--primary)',
      }
    default:
      return { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                             */
/* ------------------------------------------------------------------ */
export default function ScheduleClient() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()

  const [weekStart, setWeekStart] = useState(() => startOfWeekSun(new Date()))
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Session | null>(null)
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileDay, setMobileDay] = useState(() => new Date())
  const [now, setNow] = useState(() => new Date())
  const [view, setView] = useState<'day' | 'week' | 'month'>('week')

  /* Current-time line — update every minute */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  /* Mobile breakpoint */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  /* ---------------------------------------------------------------- */
  /* Data loading                                                       */
  /* ---------------------------------------------------------------- */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const from = weekStart.toISOString()
      const to = addDays(weekStart, 7).toISOString()
      const res = await get(`/consulting/sessions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      const client = (res.data?.data?.clientSessions ?? []) as Session[]
      const mine = (res.data?.data?.mySessions ?? []) as Session[]
      const map = new Map<string, Session>()
      for (const s of [...mine, ...client]) map.set(s.id, s)
      setSessions(Array.from(map.values()))
    } catch (e) {
      console.error('[Schedule] load error', e)
    }
    setLoading(false)
  }, [weekStart])

  useEffect(() => { load() }, [load])

  /* ---------------------------------------------------------------- */
  /* Stats                                                              */
  /* ---------------------------------------------------------------- */
  const weekSessions = sessions.length
  const upcomingSessions = sessions.filter(
    (s: Session) => s.status === 'CONFIRMED' && new Date(s.scheduledAt) > now,
  ).length
  const completedHours = (
    sessions
      .filter((s: Session) => s.status === 'COMPLETED')
      .reduce((sum: number, s: Session) => sum + (s.duration || 0), 0) / 60
  ).toFixed(1)

  /* ---------------------------------------------------------------- */
  /* Block positioning                                                  */
  /* ---------------------------------------------------------------- */
  function blockTop(scheduledAt: string): number {
    const d = new Date(scheduledAt)
    const h = d.getHours()
    if (h < GRID_START_HOUR) return 0
    return ((h - GRID_START_HOUR) * 60 + d.getMinutes()) / 60 * ROW_HEIGHT
  }

  function blockHeight(duration: number): number {
    return Math.max(30, (duration / 60) * ROW_HEIGHT)
  }

  /* ---------------------------------------------------------------- */
  /* Current-time line                                                  */
  /* ---------------------------------------------------------------- */
  const nowTop =
    ((now.getHours() - GRID_START_HOUR) * 60 + now.getMinutes()) / 60 * ROW_HEIGHT
  const showTimeLine =
    now.getHours() >= GRID_START_HOUR && now.getHours() < GRID_END_HOUR

  /* ---------------------------------------------------------------- */
  /* Date range label                                                   */
  /* ---------------------------------------------------------------- */
  const weekEnd = addDays(weekStart, 6)
  const dateRangeLabel = (() => {
    const endStr = weekEnd.toLocaleDateString(
      isAr ? 'ar-EG-u-ca-gregory' : 'en-US-u-ca-gregory',
      { month: 'long', year: 'numeric', calendar: 'gregory' },
    )
    return `${weekStart.getDate()} - ${weekEnd.getDate()} ${endStr}`
  })()

  /* ---------------------------------------------------------------- */
  /* Mobile day sessions                                               */
  /* ---------------------------------------------------------------- */
  const mobileDaySessions = useMemo(() => {
    return sessions.filter((x: Session) => {
      const t = new Date(x.scheduledAt)
      return (
        t.getFullYear() === mobileDay.getFullYear() &&
        t.getMonth() === mobileDay.getMonth() &&
        t.getDate() === mobileDay.getDate()
      )
    })
  }, [sessions, mobileDay])

  /* ---------------------------------------------------------------- */
  /* Details panel                                                      */
  /* ---------------------------------------------------------------- */
  function closePanel() {
    setSelected(null)
    setPanelPos(null)
  }

  const detailPanel = selected
    ? (() => {
        const start = new Date(selected.scheduledAt)
        const end = new Date(start.getTime() + (selected.duration || 0) * 60_000)
        const canAct =
          selected.status === 'CONFIRMED' || selected.status === 'IN_PROGRESS'
        const isLive = selected.status === 'IN_PROGRESS'
        const name = personName(selected)

        const panelStyle: React.CSSProperties = {
          position: 'fixed',
          width: 300,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          padding: 20,
          zIndex: 100,
        }

        if (panelPos) {
          const safeTop = Math.max(
            16,
            Math.min(panelPos.top, (typeof window !== 'undefined' ? window.innerHeight : 800) - 460),
          )
          const safeLeft = Math.max(
            16,
            Math.min(
              panelPos.left,
              (typeof window !== 'undefined' ? window.innerWidth : 1200) - 316,
            ),
          )
          panelStyle.top = safeTop
          panelStyle.left = safeLeft
        } else {
          panelStyle.top = '50%'
          panelStyle.left = '50%'
          panelStyle.transform = 'translate(-50%, -50%)'
        }

        const bs = blockStyle(selected.status)

        return (
          <>
            <div
              onClick={closePanel}
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            />
            <div style={panelStyle}>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 800 }}>
                  {isAr ? 'تفاصيل الجلسة' : 'Session Details'}
                </span>
                <button
                  onClick={closePanel}
                  style={{
                    width: 30,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Client row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--primary-subtle)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {name.charAt(0) || '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{name}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {isAr ? 'عميل' : 'Client'}
                  </div>
                </div>
              </div>

              {/* Info block */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 12,
                  fontSize: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={13} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                  <span>{fmtFullDate(start, isAr)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={13} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                  <span>
                    {fmt12(start, isAr)} – {fmt12(end, isAr)}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      ...bs,
                      borderRadius: 20,
                      padding: '2px 10px',
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'inline-block',
                    }}
                  >
                    {STATUS_AR[selected.status] || selected.status}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {canAct && (
                  <button
                    onClick={() =>
                      router.push(
                        `/${locale}/dashboard/consulting/${selected.id}/go-live`,
                      )
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      background: isLive ? 'var(--accent)' : 'var(--primary)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    <Video size={14} />
                    {isLive
                      ? isAr
                        ? 'متابعة الجلسة'
                        : 'Rejoin session'
                      : isAr
                        ? 'بدء الجلسة'
                        : 'Start session'}
                  </button>
                )}
                <button
                  onClick={() =>
                    router.push(`/${locale}/dashboard/my-sessions`)
                  }
                  style={{
                    padding: '9px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {isAr ? 'عرض التفاصيل' : 'View details'}
                </button>
                <button
                  onClick={closePanel}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </>
        )
      })()
    : null

  /* ---------------------------------------------------------------- */
  /* Mobile view                                                        */
  /* ---------------------------------------------------------------- */
  if (isMobile) {
    return (
      <div
        dir="rtl"
        style={{
          background: 'var(--background)',
          color: 'var(--foreground)',
          minHeight: '100vh',
          padding: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
            {isAr ? 'جدول مواعيدي' : 'My Schedule'}
          </h1>
          <button
            onClick={() => setMobileDay(new Date())}
            style={{
              height: 32,
              padding: '0 14px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--primary)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {isAr ? 'اليوم' : 'Today'}
          </button>
        </div>

        {/* Day navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => setMobileDay((d) => addDays(d, isAr ? 1 : -1))}
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--foreground)',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={16} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {mobileDay.toLocaleDateString(
              isAr ? 'ar-EG-u-ca-gregory' : 'en-US-u-ca-gregory',
              { weekday: 'long', day: 'numeric', month: 'long', calendar: 'gregory' },
            )}
          </span>
          <button
            onClick={() => setMobileDay((d) => addDays(d, isAr ? -1 : 1))}
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--foreground)',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {loading && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
            {isAr ? 'جاري التحميل...' : 'Loading...'}
          </div>
        )}

        {mobileDaySessions.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 0',
              color: 'var(--muted)',
              fontSize: 14,
            }}
          >
            {isAr ? 'لا توجد جلسات هذا اليوم' : 'No sessions today'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mobileDaySessions.map((s) => {
              const start = new Date(s.scheduledAt)
              const end = new Date(start.getTime() + s.duration * 60_000)
              const st = blockStyle(s.status)
              return (
                <div
                  key={s.id}
                  onClick={() => { setSelected(s); setPanelPos(null) }}
                  style={{ borderRadius: 12, padding: '12px 16px', cursor: 'pointer', ...st }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    {personName(s)}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                    {fmt12(start, isAr)} – {fmt12(end, isAr)}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 3, opacity: 0.8 }}>
                    {s.duration} {isAr ? 'دقيقة' : 'min'} · {STATUS_AR[s.status] || s.status}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {detailPanel}
      </div>
    )
  }

  /* ---------------------------------------------------------------- */
  /* Desktop weekly calendar                                            */
  /* ---------------------------------------------------------------- */
  return (
    <div
      dir="rtl"
      style={{
        background: 'var(--background)',
        color: 'var(--foreground)',
        padding: '24px 20px',
        minHeight: '100vh',
      }}
    >
      {/* [A] Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{ fontSize: 22, fontWeight: 900, margin: 0, lineHeight: 1.2 }}
          >
            {isAr ? 'جدول مواعيدي' : 'My Schedule'}
          </h1>
          <p
            style={{
              fontSize: 13,
              color: 'var(--muted)',
              margin: '4px 0 0',
              fontWeight: 500,
            }}
          >
            {isAr
              ? 'نظم جلساتك ومواعيدك بسهولة'
              : 'Organize your sessions easily'}
          </p>
        </div>
        <button
          onClick={() => router.push(`/${locale}/dashboard/my-sessions`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 36,
            padding: '0 16px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--primary)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1, fontWeight: 400 }}>+</span>
          {isAr ? 'موعد جديد' : 'New session'}
        </button>
      </div>

      {/* [B] Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {(
          [
            {
              icon: <Calendar size={20} />,
              iconBg: 'var(--accent-light)',
              iconColor: 'var(--accent)',
              label: isAr ? 'جلسات هذا الأسبوع' : 'This week',
              value: weekSessions,
            },
            {
              icon: <Clock size={20} />,
              iconBg: 'var(--primary-subtle)',
              iconColor: 'var(--primary)',
              label: isAr ? 'مواعيد قادمة' : 'Upcoming',
              value: upcomingSessions,
            },
            {
              icon: <Users size={20} />,
              iconBg: 'var(--accent-light)',
              iconColor: 'var(--accent)',
              label: isAr ? 'ساعات مكتملة' : 'Completed hours',
              value: completedHours,
            },
          ] as const
        ).map((card, i) => (
          <div
            key={i}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: card.iconBg,
                color: card.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>
            <div>
              <div
                style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}
              >
                {card.value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--muted)',
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* [C] Calendar toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        {/* Left group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            <Search size={14} />
          </button>
          <button
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            <Filter size={14} />
          </button>

          {/* Prev week (in RTL layout, this is the right-pointing chevron = go back) */}
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--foreground)',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={16} />
          </button>

          <span style={{ fontSize: 13, fontWeight: 600 }}>{dateRangeLabel}</span>

          {/* Next week */}
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--foreground)',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={() => setWeekStart(startOfWeekSun(new Date()))}
            style={{
              height: 32,
              padding: '0 14px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--primary)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {isAr ? 'اليوم' : 'Today'}
          </button>
        </div>

        {/* Right group — view switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--surface)',
            borderRadius: 10,
            padding: 3,
            border: '1px solid var(--border)',
          }}
        >
          {(['day', 'week', 'month'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                height: 32,
                padding: '0 14px',
                borderRadius: 8,
                border: 'none',
                background: view === v ? 'var(--primary)' : 'transparent',
                color: view === v ? '#fff' : 'var(--muted)',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {v === 'day'
                ? isAr
                  ? 'يوم'
                  : 'Day'
                : v === 'week'
                  ? isAr
                    ? 'أسبوع'
                    : 'Week'
                  : isAr
                    ? 'شهر'
                    : 'Month'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
          {isAr ? 'جاري التحميل...' : 'Loading...'}
        </div>
      )}

      {/* [D] Weekly calendar grid */}
      <div style={{ overflowX: 'auto' }}>
        <div
          style={{
            minWidth: 700,
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'visible',
            background: 'var(--card)',
          }}
        >
          {/* D1 — Day header row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '80px repeat(7, 1fr)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {/* Time column header */}
            <div
              style={{
                height: 68,
                borderRight: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: 'var(--muted)',
                fontWeight: 600,
              }}
            >
              {isAr ? 'الوقت' : 'Time'}
            </div>

            {weekDays.map((d, i) => {
              const isToday = d.toDateString() === new Date().toDateString()
              return (
                <div
                  key={i}
                  style={{
                    height: 68,
                    padding: '8px 4px',
                    textAlign: 'center',
                    borderRight:
                      i < 6 ? '1px solid var(--border)' : undefined,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--muted)',
                    }}
                  >
                    {isAr ? DAYS_AR[d.getDay()] : DAYS_EN[d.getDay()]}
                  </div>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 900,
                      background: isToday ? 'var(--primary)' : 'transparent',
                      color: isToday ? '#fff' : 'var(--foreground)',
                    }}
                  >
                    {d.getDate()}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {d.toLocaleDateString(
                      isAr ? 'ar-EG-u-ca-gregory' : 'en-US',
                      { month: 'short', day: 'numeric' },
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* D2 — Time grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '80px repeat(7, 1fr)',
            }}
          >
            {/* Time labels column */}
            <div style={{ borderRight: '1px solid var(--border)' }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{
                    height: ROW_HEIGHT,
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: 4,
                    fontSize: 10,
                    color: 'var(--muted)',
                    boxSizing: 'border-box',
                  }}
                >
                  {hourLabel(h)}
                </div>
              ))}
            </div>

            {/* 7 day columns */}
            {weekDays.map((day, di) => {
              const isToday = day.toDateString() === new Date().toDateString()
              const dayStart = new Date(day)
              dayStart.setHours(0, 0, 0, 0)
              const dayEnd = new Date(day)
              dayEnd.setHours(23, 59, 59, 999)
              const daySessions = sessions.filter((s: Session) => {
                const t = new Date(s.scheduledAt)
                return (
                  t.getFullYear() === day.getFullYear() &&
                  t.getMonth() === day.getMonth() &&
                  t.getDate() === day.getDate()
                )
              })

              return (
                <div
                  key={di}
                  style={{
                    position: 'relative',
                    borderRight:
                      di < 6 ? '1px solid var(--border)' : undefined,
                    background: isToday
                      ? 'rgba(81,32,200,0.03)'
                      : undefined,
                  }}
                >
                  {/* Hour grid lines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      style={{
                        height: ROW_HEIGHT,
                        borderBottom: '1px solid var(--border)',
                        boxSizing: 'border-box',
                      }}
                    />
                  ))}

                  {/* Current-time line — today only */}
                  {isToday && showTimeLine && (
                    <div
                      style={{
                        position: 'absolute',
                        top: nowTop,
                        left: 0,
                        right: 0,
                        zIndex: 2,
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: -3,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--primary)',
                        }}
                      />
                      <div
                        style={{
                          height: 2,
                          background: 'var(--primary)',
                          opacity: 0.8,
                        }}
                      />
                    </div>
                  )}

                  {/* Session blocks */}
                  {daySessions.map((s) => {
                    const sessionHour = new Date(s.scheduledAt).getHours()
                    if (sessionHour < GRID_START_HOUR || sessionHour >= GRID_END_HOUR) return null
                    const top = blockTop(s.scheduledAt)
                    const height = blockHeight(s.duration)
                    const st = blockStyle(s.status)
                    const start = new Date(s.scheduledAt)
                    const end = new Date(
                      start.getTime() + s.duration * 60_000,
                    )
                    const topic =
                      s.topic || s.sessionName || personName(s)
                    const clientName = personName(s)

                    return (
                      <button
                        key={s.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          const rect =
                            e.currentTarget.getBoundingClientRect()
                          setPanelPos({
                            top: rect.top,
                            left: rect.left - 316,
                          })
                          setSelected(s)
                        }}
                        style={{
                          position: 'absolute',
                          top: top + 1,
                          left: 3,
                          right: 3,
                          height: height - 2,
                          borderRadius: 6,
                          padding: '4px 6px',
                          fontSize: 10,
                          textAlign: 'right',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          fontWeight: 700,
                          zIndex: 1,
                          lineHeight: 1.3,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                          ...st,
                        }}
                      >
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {topic}
                        </div>
                        {height > 30 && topic !== clientName && (
                          <div
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              opacity: 0.85,
                            }}
                          >
                            {clientName}
                          </div>
                        )}
                        {height > 50 && (
                          <div style={{ opacity: 0.75, fontSize: 9 }}>
                            {fmt12(start, isAr)} – {fmt12(end, isAr)}
                          </div>
                        )}
                        {height > 70 && (
                          <div
                            style={{
                              fontSize: 9,
                              borderRadius: 10,
                              padding: '1px 5px',
                              background: 'rgba(255,255,255,0.15)',
                              display: 'inline-block',
                              alignSelf: 'flex-end',
                            }}
                          >
                            {STATUS_AR[s.status] || s.status}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* [F] Status legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginTop: 12,
          flexWrap: 'wrap',
          fontSize: 12,
          color: 'var(--muted)',
        }}
      >
        {[
          { color: 'var(--error)', label: isAr ? 'ملغي' : 'Cancelled' },
          { color: 'var(--accent)', label: isAr ? 'مكتملة' : 'Completed' },
          { color: 'var(--primary)', label: isAr ? 'محجوز' : 'Confirmed' },
          { color: 'var(--success)', label: isAr ? 'متاح' : 'Available' },
        ].map((item) => (
          <div
            key={item.label}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: item.color,
                flexShrink: 0,
              }}
            />
            {item.label}
          </div>
        ))}
      </div>

      {detailPanel}
    </div>
  )
}
