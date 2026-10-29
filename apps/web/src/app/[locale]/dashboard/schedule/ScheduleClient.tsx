'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { api } from '../../../../lib/api'

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface UserRef {
  id: string
  email?: string
  profile?: { firstName?: string; lastName?: string; avatar?: string }
}

interface Session {
  id: string
  scheduledAt: string
  duration: number
  status: string
  topic?: string
  sessionName?: string
  description?: string
  price?: number
  meetingLink?: string
  meetingType?: string
  paymentStatus?: string
  user?: UserRef        // student relation (field name from backend is "user")
  consultant?: UserRef
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const DAYS_AR   = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const HOURS      = Array.from({ length: 13 }, (_, i) => i + 8)  // 8 AM → 8 PM
const ROW_H      = 64
const GRID_START = 8

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function startOfWeekSun(d: Date): Date {
  const r = new Date(d)
  r.setDate(r.getDate() - r.getDay())
  r.setHours(0, 0, 0, 0)
  return r
}

function hourLabel(h: number): string {
  if (h === 0)  return '12:00 ص'
  if (h < 12)   return `${h}:00 ص`
  if (h === 12) return '12:00 م'
  return `${h - 12}:00 م`
}

function fmt12(d: Date): string {
  const h  = d.getHours()
  const m  = d.getMinutes()
  const mm = String(m).padStart(2, '0')
  if (h === 0)  return `12:${mm} ص`
  if (h < 12)   return `${h}:${mm} ص`
  if (h === 12) return `12:${mm} م`
  return `${h - 12}:${mm} م`
}

function fmtDate(d: Date): string {
  return `${DAYS_AR[d.getDay()]}، ${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`
}

function sameDay(scheduledAt: string, day: Date): boolean {
  const t = new Date(scheduledAt)
  return (
    t.getFullYear() === day.getFullYear() &&
    t.getMonth()    === day.getMonth()    &&
    t.getDate()     === day.getDate()
  )
}

function blockTop(scheduledAt: string): number {
  const d = new Date(scheduledAt)
  return Math.max(0, (d.getHours() - GRID_START) * ROW_H + (d.getMinutes() / 60) * ROW_H)
}

function blockHeight(duration: number): number {
  return Math.max(ROW_H * 0.55, (duration / 60) * ROW_H - 2)
}

function userName(u?: UserRef): string {
  if (!u) return '—'
  const full = `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim()
  return full || u.email?.split('@')[0] || '—'
}

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_AR: Record<string, string> = {
  PENDING:              'بانتظار الموافقة',
  PENDING_APPROVAL:     'بانتظار الموافقة',
  AWAITING_PAYMENT:     'بانتظار الدفع',
  CONFIRMED:            'مؤكدة',
  IN_PROGRESS:          'جارية الآن',
  COMPLETED:            'مكتملة',
  CANCELLED:            'ملغاة',
  REJECTED:             'مرفوضة',
  RESCHEDULE_REQUESTED: 'طلب تغيير موعد',
  RESCHEDULED:          'تم تغيير الموعد',
}

function blockStyle(status: string): CSSProperties {
  switch (status) {
    case 'CONFIRMED':
      return { background: 'var(--primary)', border: '1.5px solid var(--primary)', color: '#fff' }
    case 'IN_PROGRESS':
      return { background: 'var(--accent)', border: '1.5px solid var(--accent)', color: '#fff' }
    case 'COMPLETED':
      return { background: 'rgba(43,191,163,0.18)', border: '1.5px solid var(--accent)', color: 'var(--accent)' }
    case 'AWAITING_PAYMENT':
      return { background: 'rgba(255,149,0,0.15)', border: '1.5px solid var(--warning)', color: 'var(--warning)' }
    case 'PENDING':
    case 'PENDING_APPROVAL':
      return { background: 'rgba(81,32,200,0.12)', border: '1.5px dashed rgba(81,32,200,0.45)', color: 'var(--primary)' }
    case 'RESCHEDULE_REQUESTED':
    case 'RESCHEDULED':
      return { background: 'rgba(0,122,255,0.12)', border: '1.5px solid var(--info, #007aff)', color: 'var(--info, #007aff)' }
    case 'CANCELLED':
    case 'REJECTED':
      return { background: 'rgba(255,59,48,0.10)', border: '1.5px solid var(--error)', color: 'var(--error)' }
    default:
      return { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }
  }
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function ScheduleClient() {
  const locale = useLocale()
  const router = useRouter()

  const [weekStart, setWeekStart] = useState(() => startOfWeekSun(new Date()))
  const [sessions,  setSessions]  = useState<Session[]>([])
  const [loading,   setLoading]   = useState(false)
  const [selected,  setSelected]  = useState<Session | null>(null)
  const [acting,    setActing]    = useState(false)
  const [now,       setNow]       = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  /* ── API call — no date params so backend returns ALL sessions ─────────── */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/consulting/sessions')

      // Backend returns: { success, data: { mySessions, clientSessions, isConsultant } }
      // Axios wraps body in res.data, so: res.data = { success, data: {...} }
      const outer = res.data
      const inner = outer?.data ?? outer

      const ms = (inner?.mySessions     ?? []) as Session[]
      const cs = (inner?.clientSessions ?? []) as Session[]

      console.log('[Schedule] raw outer keys:', Object.keys(outer || {}))
      console.log('[Schedule] mySessions:', ms.length, '| clientSessions:', cs.length)

      const map = new Map<string, Session>()
      ;[...ms, ...cs].forEach((s: Session) => {
        if (s?.id && !map.has(s.id)) map.set(s.id, s)
      })
      const all = Array.from(map.values())

      console.log('[Schedule] total deduplicated:', all.length)
      all.forEach((s: Session) => {
        const d = new Date(s.scheduledAt)
        console.log(`  id=${s.id.slice(0,8)} status=${s.status} scheduledAt=${s.scheduledAt} date=${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} hour=${d.getHours()}`)
      })

      setSessions(all)
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: unknown }; message?: string }
      console.error('[Schedule] load error:', e?.response?.status, e?.response?.data ?? e?.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  /* ── Room actions ─────────────────────────────────────────────────────── */
  async function handleStartRoom(sessionId: string) {
    setActing(true)
    try {
      await api.post(`/consulting/sessions/${sessionId}/start-room`)
    } catch { /* consultant may get 403 on join-room side */ }
    try {
      await api.post(`/consulting/sessions/${sessionId}/join-room`)
    } catch { /* ignore */ }
    setSelected(null)
    router.push(`/${locale}/dashboard/consulting/${sessionId}/go-live`)
    setActing(false)
  }

  async function handleJoinRoom(sessionId: string) {
    try {
      await api.post(`/consulting/sessions/${sessionId}/join-room`)
    } catch { /* ignore */ }
    setSelected(null)
    router.push(`/${locale}/dashboard/consulting/${sessionId}/go-live`)
  }

  /* ── Stats ────────────────────────────────────────────────────────────── */
  const weekSessions = useMemo(() =>
    sessions.filter((s: Session) =>
      weekDays.some((day: Date) => sameDay(s.scheduledAt, day)) &&
      !['CANCELLED','REJECTED'].includes(s.status),
    ),
  [sessions, weekDays])

  const upcomingCount = useMemo(() =>
    sessions.filter((s: Session) => {
      const t = new Date(s.scheduledAt)
      return (
        t > now &&
        ['PENDING','PENDING_APPROVAL','AWAITING_PAYMENT','CONFIRMED','IN_PROGRESS'].includes(s.status)
      )
    }).length,
  [sessions, now])

  const doneHours = useMemo(() =>
    +(
      sessions
        .filter((s: Session) => s.status === 'COMPLETED')
        .reduce((acc: number, s: Session) => acc + (s.duration ?? 60), 0) / 60
    ).toFixed(1),
  [sessions])

  /* ── Current time indicator ───────────────────────────────────────────── */
  const todayIdx = weekDays.findIndex((d: Date) => sameDay(now.toISOString(), d))
  const nowTop   = (now.getHours() - GRID_START) * ROW_H + (now.getMinutes() / 60) * ROW_H

  /* ── Session detail modal ─────────────────────────────────────────────── */
  function renderModal() {
    if (!selected) return null
    const s          = selected
    const startD     = new Date(s.scheduledAt)
    const endD       = new Date(startD.getTime() + (s.duration ?? 60) * 60_000)
    const minutesUntil = (startD.getTime() - now.getTime()) / 60_000
    const canStart   = (s.status === 'CONFIRMED' || s.status === 'IN_PROGRESS') && minutesUntil >= -240
    const isLive     = s.status === 'IN_PROGRESS'
    const other      = s.user ?? s.consultant
    const initials   = userName(other).split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2) || '؟'
    const st         = blockStyle(s.status)

    return (
      <div
        onClick={(e: { target: EventTarget | null; currentTarget: EventTarget | null }) => { if (e.target === e.currentTarget) setSelected(null) }}
        style={{
          position: 'fixed', inset: 0, zIndex: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.65)', padding: 16,
        }}
      >
        <div style={{
          width: '100%', maxWidth: 420,
          borderRadius: 16, border: '1px solid var(--border)',
          background: 'var(--card)', padding: 24,
          boxShadow: '0 24px 72px rgba(0,0,0,0.5)',
          maxHeight: '90vh', overflowY: 'auto',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <span style={{ fontWeight: 900, fontSize: 15 }}>تفاصيل الجلسة</span>
            <button
              onClick={() => setSelected(null)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--muted)', cursor: 'pointer', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          </div>

          {/* Person */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(81,32,200,0.1)', color: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 900, flexShrink: 0, overflow: 'hidden',
            }}>
              {other?.profile?.avatar
                ? <img src={other.profile.avatar} alt="" style={{ width: 44, height: 44, objectFit: 'cover' }} />
                : initials}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{userName(other)}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {s.user ? 'عميل' : 'مستشار'}
              </div>
            </div>
          </div>

          {/* Info block */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 14,
            fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {(s.topic || s.sessionName) && (
              <div><span style={{ color: 'var(--muted)', fontWeight: 700 }}>الموضوع: </span>{s.topic || s.sessionName}</div>
            )}
            <div><span style={{ color: 'var(--muted)', fontWeight: 700 }}>التاريخ: </span>{fmtDate(startD)}</div>
            <div><span style={{ color: 'var(--muted)', fontWeight: 700 }}>الوقت: </span>{fmt12(startD)} — {fmt12(endD)}</div>
            <div><span style={{ color: 'var(--muted)', fontWeight: 700 }}>المدة: </span>{s.duration ?? 60} دقيقة</div>
            {s.meetingLink && (
              <div>
                <span style={{ color: 'var(--muted)', fontWeight: 700 }}>رابط الاجتماع: </span>
                <a href={s.meetingLink} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: 11 }}>
                  فتح الرابط
                </a>
              </div>
            )}
          </div>

          {/* Status badge */}
          <div style={{ marginBottom: 16 }}>
            <span style={{
              ...st, borderRadius: 20, padding: '3px 12px',
              fontSize: 11, fontWeight: 800, display: 'inline-block',
            }}>
              {STATUS_AR[s.status] ?? s.status}
            </span>
          </div>

          {/* Time remaining */}
          {s.status === 'CONFIRMED' && minutesUntil > 0 && (
            <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginBottom: 12 }}>
              تبدأ خلال {minutesUntil < 60
                ? `${Math.round(minutesUntil)} دقيقة`
                : `${(minutesUntil / 60).toFixed(1)} ساعة`}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {canStart && (
              <button
                onClick={() => isLive ? handleJoinRoom(s.id) : handleStartRoom(s.id)}
                disabled={acting}
                style={{
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  background: isLive ? 'var(--accent)' : 'var(--primary)',
                  color: '#fff', fontWeight: 800, fontSize: 13,
                  cursor: acting ? 'wait' : 'pointer', opacity: acting ? 0.7 : 1,
                }}
              >
                {acting ? 'جاري...' : isLive ? 'متابعة الجلسة' : 'بدء الجلسة'}
              </button>
            )}
            <button
              onClick={() => router.push(`/${locale}/dashboard/consulting/${s.id}`)}
              style={{
                padding: '10px 20px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--foreground)', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              }}
            >
              عرض التفاصيل
            </button>
            <button
              onClick={() => setSelected(null)}
              style={{
                padding: '8px 20px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--muted)', cursor: 'pointer', fontSize: 12,
              }}
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div dir="rtl" style={{ background: 'var(--background)', color: 'var(--foreground)', padding: 20, minHeight: '100vh' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>جدول مواعيدي</h1>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>نظم جلساتك ومواعيدك بسهولة</p>
        </div>
        <button
          onClick={() => router.push(`/${locale}/dashboard/coaching/book`)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 10, border: 'none',
            background: 'var(--primary)', color: '#fff', cursor: 'pointer',
            fontWeight: 700, fontSize: 13,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          موعد جديد
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {([
          { label: 'جلسات هذا الأسبوع', value: weekSessions.length, color: 'var(--primary)' },
          { label: 'مواعيد قادمة',       value: upcomingCount,       color: 'var(--accent)'  },
          { label: 'ساعات مكتملة',       value: doneHours,           color: 'var(--success)' },
        ] as const).map(({ label, value, color }) => (
          <div key={label} style={{ borderRadius: 14, border: '1px solid var(--border)', background: 'var(--card)', padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setWeekStart((w: Date) => addDays(w, -7))}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <span style={{ fontSize: 13, fontWeight: 700, minWidth: 190, textAlign: 'center' }}>
            {weekStart.getDate()} {MONTHS_AR[weekStart.getMonth()]}
            {' — '}
            {addDays(weekStart, 6).getDate()} {MONTHS_AR[addDays(weekStart, 6).getMonth()]} {addDays(weekStart, 6).getFullYear()}
          </span>

          <button
            onClick={() => setWeekStart((w: Date) => addDays(w, 7))}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          <button
            onClick={() => setWeekStart(startOfWeekSun(new Date()))}
            style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid var(--primary)', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
          >
            اليوم
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {loading && <span style={{ fontSize: 11, color: 'var(--muted)' }}>جاري التحميل...</span>}
          <button
            onClick={load}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: loading ? 'wait' : 'pointer', fontSize: 11 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            تحديث
          </button>
        </div>
      </div>

      {/* ═══════════ CALENDAR GRID ═══════════════════════════════════════════
          CRITICAL:
          1. Outer div: overflowX:auto — scroll on small screens
          2. Inner div: NO overflow:hidden — would clip absolutely-positioned blocks
          3. Day column: explicit height = HOURS.length * ROW_H (832px)
          4. Session blocks: position:absolute inside the day column
      */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
        <div style={{ minWidth: 780, background: 'var(--card)' }}>

          {/* Day header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7,1fr)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ height: 56, borderRight: '1px solid var(--border)' }} />
            {weekDays.map((d: Date, i: number) => {
              const isToday    = sameDay(now.toISOString(), d)
              const hasSessions = sessions.some((s: Session) =>
                sameDay(s.scheduledAt, d) && !['CANCELLED','REJECTED'].includes(s.status),
              )
              return (
                <div key={i} style={{ padding: '8px 4px', textAlign: 'center', borderRight: i < 6 ? '1px solid var(--border)' : undefined }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', marginBottom: 3 }}>
                    {DAYS_AR[d.getDay()]}
                  </div>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    margin: '0 auto', position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 900,
                    background: isToday ? 'var(--primary)' : 'transparent',
                    color: isToday ? '#fff' : 'var(--foreground)',
                  }}>
                    {d.getDate()}
                    {hasSessions && !isToday && (
                      <span style={{
                        position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                        width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)',
                      }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(7,1fr)' }}>

            {/* Hour labels column */}
            <div style={{ borderRight: '1px solid var(--border)' }}>
              {HOURS.map((h: number) => (
                <div key={h} style={{ height: ROW_H, borderBottom: '1px solid var(--border)', boxSizing: 'border-box', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 5, fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>
                  {hourLabel(h)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day: Date, di: number) => {
              const isToday     = di === todayIdx
              const daySessions = sessions.filter((s: Session) => sameDay(s.scheduledAt, day))

              return (
                <div
                  key={di}
                  style={{
                    position: 'relative',
                    /* CRITICAL: explicit height so absolutely-positioned blocks are visible */
                    height: HOURS.length * ROW_H,
                    borderRight: di < 6 ? '1px solid var(--border)' : undefined,
                    background: isToday ? 'rgba(81,32,200,0.025)' : undefined,
                    /* NO overflow:hidden — it clips the session blocks */
                  }}
                >
                  {/* Hour grid lines (absolute so they don't affect column height) */}
                  {HOURS.map((h: number) => (
                    <div key={h} style={{ position: 'absolute', top: (h - GRID_START) * ROW_H, left: 0, right: 0, height: ROW_H, borderBottom: '1px solid var(--border)', boxSizing: 'border-box', pointerEvents: 'none' }} />
                  ))}

                  {/* Half-hour subtle lines */}
                  {HOURS.map((h: number) => (
                    <div key={`h-${h}`} style={{ position: 'absolute', top: (h - GRID_START) * ROW_H + ROW_H / 2, left: 0, right: 0, height: 1, background: 'var(--border)', opacity: 0.35, pointerEvents: 'none' }} />
                  ))}

                  {/* Current time line */}
                  {isToday && nowTop >= 0 && nowTop <= HOURS.length * ROW_H && (
                    <div style={{ position: 'absolute', top: nowTop, left: 0, right: 0, height: 2, background: 'var(--primary)', zIndex: 5, pointerEvents: 'none' }}>
                      <div style={{ position: 'absolute', right: -5, top: -4, width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
                    </div>
                  )}

                  {/* SESSION BLOCKS */}
                  {daySessions.map((s: Session) => {
                    const sd = new Date(s.scheduledAt)
                    const h  = sd.getHours()
                    if (h < GRID_START || h >= GRID_START + HOURS.length) return null

                    const top  = blockTop(s.scheduledAt)
                    const ht   = blockHeight(s.duration ?? 60)
                    const st   = blockStyle(s.status)
                    const endD = new Date(sd.getTime() + (s.duration ?? 60) * 60_000)

                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelected(s)}
                        title={`${s.topic || s.sessionName || 'جلسة'} — ${STATUS_AR[s.status] ?? s.status}`}
                        style={{
                          position: 'absolute',
                          top:      top + 1,
                          left:     3,
                          right:    3,
                          height:   ht - 2,
                          borderRadius: 8,
                          padding: '4px 7px',
                          fontSize: 10,
                          textAlign: 'right',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          fontWeight: 700,
                          zIndex: 2,
                          lineHeight: 1.35,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                          border: st.border as string,
                          background: st.background as string,
                          color: st.color as string,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: 800 }}>
                            {s.topic || s.sessionName || 'جلسة استشارية'}
                          </span>
                        </div>
                        {ht > 40 && (
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 9, opacity: 0.9, marginTop: 1 }}>
                            {userName(s.user ?? s.consultant)}
                          </div>
                        )}
                        {ht > 58 && (
                          <div style={{ fontSize: 9, opacity: 0.8, marginTop: 1 }}>
                            {fmt12(sd)} — {fmt12(endD)}
                          </div>
                        )}
                        {ht > 72 && (
                          <div style={{ marginTop: 3, fontSize: 8, fontWeight: 800, opacity: 0.85 }}>
                            {STATUS_AR[s.status] ?? s.status}
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

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'مؤكدة',            color: 'var(--primary)' },
          { label: 'جارية',             color: 'var(--accent)'  },
          { label: 'مكتملة',            color: 'rgba(43,191,163,0.6)' },
          { label: 'بانتظار الدفع',    color: 'var(--warning)' },
          { label: 'بانتظار الموافقة', color: 'rgba(81,32,200,0.4)' },
          { label: 'ملغاة',             color: 'var(--error)'   },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            {label}
          </div>
        ))}
        {sessions.length > 0 && (
          <div style={{ marginRight: 'auto', fontSize: 10, color: 'var(--muted)', opacity: 0.6 }}>
            {sessions.length} جلسة محملة
          </div>
        )}
      </div>

      {/* Empty state — no sessions at all */}
      {!loading && sessions.length === 0 && (
        <div style={{ marginTop: 40, textAlign: 'center', padding: 40, border: '2px dashed var(--border)', borderRadius: 16, color: 'var(--muted)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>لا توجد جلسات</div>
          <div style={{ fontSize: 12 }}>لم يتم العثور على أي جلسات في حسابك</div>
          <div style={{ fontSize: 11, marginTop: 8, opacity: 0.7 }}>تحقق من Console لرؤية تفاصيل استجابة الـ API</div>
        </div>
      )}

      {/* No sessions in THIS WEEK but sessions exist */}
      {!loading && sessions.length > 0 && weekSessions.length === 0 && (
        <div style={{ marginTop: 16, textAlign: 'center', padding: 16, background: 'var(--surface)', borderRadius: 10, fontSize: 12, color: 'var(--muted)' }}>
          لا توجد جلسات في هذا الأسبوع — جرب الأسبوع القادم أو السابق
        </div>
      )}

      {renderModal()}
    </div>
  )
}
