'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { api } from '../../../../lib/api'

/* ─── Types ───────────────────────────────────────────────────────── */
interface UserRef {
  id: string
  email?: string
  profile?: { firstName?: string; lastName?: string; avatar?: string }
}
interface Session {
  id: string
  scheduledAt?: unknown   // may come back as string, Date object, {}, or null
  duration: number
  status: string
  studentId?: string
  consultantId?: string
  topic?: string
  sessionName?: string
  description?: string
  price?: number
  meetingLink?: string
  user?: UserRef
  student?: UserRef
  consultant?: UserRef
}

/* ─── Constants ───────────────────────────────────────────────────── */
const DAYS_AR    = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
const MONTHS_AR  = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const HOURS      = Array.from({ length: 16 }, (_: unknown, i: number) => i + 8)
const ROW_H      = 64
const GRID_START = 8

/* ─── Date helper — handles any serialization format ─────────────── */
function getSessionDate(s: Session): Date | null {
  // Try all possible field name variants and serialization formats
  const raw = s as unknown as Record<string, unknown>
  const candidates = [
    raw.scheduledAt,
    raw.date,
    raw.startAt,
    raw.sessionDate,
    raw.startTime,
    raw.bookedAt,
  ]
  for (const raw of candidates) {
    if (!raw) continue
    // Already a Date object (Prisma Date leaking through)
    if (raw instanceof Date) {
      if (!isNaN(raw.getTime())) return raw
      continue
    }
    // ISO string
    if (typeof raw === 'string' && raw.length > 0) {
      const d = new Date(raw)
      if (!isNaN(d.getTime())) return d
      continue
    }
    // Number (Unix ms)
    if (typeof raw === 'number') {
      const d = new Date(raw)
      if (!isNaN(d.getTime())) return d
      continue
    }
    // Object with $date (MongoDB style) or nested date
    if (typeof raw === 'object' && raw !== null) {
      const obj = raw as Record<string, unknown>
      // {$date: "..."} MongoDB
      if (obj.$date) {
        const d = new Date(String(obj.$date))
        if (!isNaN(d.getTime())) return d
        continue
      }
      // Try converting to string via valueOf / toString
      try {
        const str = String(raw)
        if (str !== '[object Object]') {
          const d = new Date(str)
          if (!isNaN(d.getTime())) return d
        }
      } catch { /* ignore */ }
    }
  }
  return null
}

/* ─── Other helpers ───────────────────────────────────────────────── */
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
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
  const h = d.getHours(), m = d.getMinutes()
  const mm = String(m).padStart(2, '0')
  if (h === 0)  return `12:${mm} ص`
  if (h < 12)   return `${h}:${mm} ص`
  if (h === 12) return `12:${mm} م`
  return `${h - 12}:${mm} م`
}
function fmtDateAr(d: Date): string {
  return `${DAYS_AR[d.getDay()]}، ${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`
}
// Accepts Date, ISO string, or null — handles all safely
function sameDay(a: Date | string | null | undefined, b: Date): boolean {
  if (!a) return false
  const d = typeof a === 'string' ? new Date(a) : a
  if (isNaN(d.getTime())) return false
  return (
    d.getFullYear() === b.getFullYear() &&
    d.getMonth()    === b.getMonth()    &&
    d.getDate()     === b.getDate()
  )
}
function blockTop(d: Date): number {
  return Math.max(0, (d.getHours() - GRID_START) * ROW_H + (d.getMinutes() / 60) * ROW_H)
}
function blockH(duration: number): number {
  return Math.max(ROW_H * 0.55, (duration / 60) * ROW_H - 2)
}
function userName(u?: UserRef): string {
  if (!u) return '—'
  const n = `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim()
  return n || u.email?.split('@')[0] || '—'
}
function getOtherPerson(s: Session): UserRef | undefined {
  return s.student ?? s.user ?? s.consultant
}

/* ─── Status ──────────────────────────────────────────────────────── */
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
function statusConfig(status: string): { bg: string; border: string; text: string; badge: string; badgeText: string } {
  switch (status) {
    case 'CONFIRMED':
      return { bg:'rgba(59,130,246,0.15)', border:'#3b82f6', text:'var(--foreground)', badge:'rgba(59,130,246,0.25)', badgeText:'#2563eb' }
    case 'IN_PROGRESS':
      return { bg:'rgba(139,92,246,0.15)', border:'#8b5cf6', text:'var(--foreground)', badge:'rgba(139,92,246,0.25)', badgeText:'#7c3aed' }
    case 'COMPLETED':
      return { bg:'rgba(34,197,94,0.15)', border:'#22c55e', text:'var(--foreground)', badge:'rgba(34,197,94,0.25)', badgeText:'#16a34a' }
    case 'AWAITING_PAYMENT':
      return { bg:'rgba(234,179,8,0.15)', border:'#eab308', text:'var(--foreground)', badge:'rgba(234,179,8,0.25)', badgeText:'#ca8a04' }
    case 'PENDING':
    case 'PENDING_APPROVAL':
      return { bg:'color-mix(in srgb, var(--foreground) 6%, transparent)', border:'color-mix(in srgb, var(--foreground) 25%, transparent)', text:'var(--foreground)', badge:'color-mix(in srgb, var(--foreground) 10%, transparent)', badgeText:'var(--muted-foreground)' }
    case 'CANCELLED':
    case 'REJECTED':
      return { bg:'rgba(239,68,68,0.10)', border:'rgba(239,68,68,0.40)', text:'var(--foreground)', badge:'rgba(239,68,68,0.18)', badgeText:'#dc2626' }
    case 'EXPIRED':
      return { bg:'color-mix(in srgb, var(--foreground) 5%, transparent)', border:'color-mix(in srgb, var(--foreground) 18%, transparent)', text:'var(--muted-foreground)', badge:'color-mix(in srgb, var(--foreground) 8%, transparent)', badgeText:'var(--muted-foreground)' }
    default:
      return { bg:'color-mix(in srgb, var(--foreground) 4%, transparent)', border:'color-mix(in srgb, var(--foreground) 12%, transparent)', text:'var(--foreground)', badge:'color-mix(in srgb, var(--foreground) 8%, transparent)', badgeText:'var(--muted-foreground)' }
  }
}

/* ─── Component ───────────────────────────────────────────────────── */
export default function ScheduleClient() {
  const locale = useLocale()
  const router = useRouter()

  const [sessions,  setSessions]  = useState<Session[]>([])
  const [weekStart, setWeekStart] = useState(() => startOfWeekSun(new Date()))
  const [loading,   setLoading]   = useState(false)
  const [selected,  setSelected]  = useState<Session | null>(null)
  const [acting,    setActing]    = useState(false)
  const [now,       setNow]       = useState(new Date())
  const [view,      setView]      = useState<'calendar' | 'list'>('calendar')

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_: unknown, i: number) => addDays(weekStart, i)),
    [weekStart],
  )

  /* ── Load all sessions ───────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await api.get('/consulting/sessions')

      // RAW diagnostic log — shows exact shape before any parsing
      const body = res.data?.data ?? res.data ?? {}
      const firstMs = (body.mySessions    ?? [])[0]
      const firstCs = (body.clientSessions ?? [])[0]
      console.log('[RAW mySessions[0]]',    JSON.stringify(firstMs,    null, 2))
      console.log('[RAW clientSessions[0]]', JSON.stringify(firstCs, null, 2))

      const ms: Session[] = body.mySessions     ?? []
      const cs: Session[] = body.clientSessions ?? []

      const map = new Map<string, Session>()
      ;[...ms, ...cs].forEach((s: Session) => { if (s?.id && !map.has(s.id)) map.set(s.id, s) })
      const all = Array.from(map.values())

      console.log('[Schedule] loaded:', all.length, 'sessions')
      all.forEach((s: Session) => {
        const d = getSessionDate(s)
        const rawS = s as unknown as Record<string, unknown>
        console.log(
          `  ${s.id.slice(0,8)} | ${s.status}`,
          `| date=${d ? d.toLocaleDateString('ar-EG') : 'NO DATE'}`,
          `| hour=${d ? d.getHours() : 'N/A'}`,
          `| rawScheduledAt=${JSON.stringify(rawS.scheduledAt)}`,
          `| topic=${rawS.topic ?? '—'}`,
        )
      })

      setSessions(all)

      // Auto-navigate to the week of the nearest session with a valid date
      const validSessions = all.filter((s: Session) => getSessionDate(s) !== null)
      console.log('[Schedule] sessions with valid date:', validSessions.length, '/', all.length)

      if (validSessions.length > 0) {
        const sorted = [...validSessions].sort((a: Session, b: Session) => {
          const ta = getSessionDate(a)!.getTime()
          const tb = getSessionDate(b)!.getTime()
          const nowMs = Date.now()
          const aFuture = ta >= nowMs
          const bFuture = tb >= nowMs
          if (aFuture && !bFuture) return -1
          if (!aFuture && bFuture) return 1
          if (aFuture && bFuture) return ta - tb
          return tb - ta
        })
        const target     = sorted[0]
        const targetDate = getSessionDate(target)!
        const targetWeek = startOfWeekSun(targetDate)
        setWeekStart(targetWeek)
        console.log('[Schedule] auto-navigated to:', targetDate.toLocaleDateString())
      } else {
        console.warn('[Schedule] 0 sessions with valid dates — all scheduledAt are null/invalid')
        if (all.length > 0) {
          console.warn('[Schedule] first session raw:', JSON.stringify(all[0]))
        }
      }
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: unknown }; message?: string }
      console.error('[Schedule] error:', e?.response?.status, e?.response?.data ?? e?.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  /* ── Actions ─────────────────────────────────────────────────────── */
  async function handleStartRoom(sessionId: string) {
    setActing(true)
    try { await api.post(`/consulting/sessions/${sessionId}/start-room`) } catch { /* 403 = client */ }
    try { await api.post(`/consulting/sessions/${sessionId}/join-room`)  } catch { /* ignore */ }
    setSelected(null)
    router.push(`/${locale}/dashboard/consulting/${sessionId}/go-live`)
    setActing(false)
  }
  async function handleJoinRoom(sessionId: string) {
    try { await api.post(`/consulting/sessions/${sessionId}/join-room`) } catch { /* ignore */ }
    setSelected(null)
    router.push(`/${locale}/dashboard/consulting/${sessionId}/go-live`)
  }

  /* ── Derived stats ───────────────────────────────────────────────── */
  const weekSessions = useMemo(
    () => sessions.filter((s: Session) => {
      const d = getSessionDate(s)
      return d && weekDays.some((day: Date) => sameDay(d, day))
    }),
    [sessions, weekDays],
  )
  const activeWeekSessions = useMemo(
    () => weekSessions.filter((s: Session) => !['CANCELLED','REJECTED'].includes(s.status)),
    [weekSessions],
  )
  const upcomingCount = useMemo(
    () => sessions.filter((s: Session) => {
      const d = getSessionDate(s)
      return d && d > now &&
        ['PENDING','PENDING_APPROVAL','AWAITING_PAYMENT','CONFIRMED','IN_PROGRESS'].includes(s.status)
    }).length,
    [sessions, now],
  )
  const doneHours = useMemo(
    () => +(sessions
      .filter((s: Session) => s.status === 'COMPLETED')
      .reduce((a: number, s: Session) => a + (s.duration ?? 60), 0) / 60
    ).toFixed(1),
    [sessions],
  )

  /* ── Current time line ───────────────────────────────────────────── */
  const todayIdx = weekDays.findIndex((d: Date) => sameDay(now, d))
  const nowTop   = (now.getHours() - GRID_START) * ROW_H + (now.getMinutes() / 60) * ROW_H

  /* ── Week range label ────────────────────────────────────────────── */
  const weekLabel = useMemo(() => {
    const end = addDays(weekStart, 6)
    return `${weekStart.getDate()} ${MONTHS_AR[weekStart.getMonth()]} — ${end.getDate()} ${MONTHS_AR[end.getMonth()]} ${end.getFullYear()}`
  }, [weekStart])

  /* ── Session detail modal ────────────────────────────────────────── */
  function SessionModal() {
    if (!selected) return null
    const s         = selected
    const startD    = getSessionDate(s)
    const endD      = startD ? new Date(startD.getTime() + (s.duration ?? 60) * 60_000) : null
    const minsUntil = startD ? (startD.getTime() - now.getTime()) / 60_000 : -Infinity
    const canAct    = (s.status === 'CONFIRMED' || s.status === 'IN_PROGRESS') && minsUntil >= -240
    const isLive    = s.status === 'IN_PROGRESS'
    const other     = getOtherPerson(s)
    const initials  = userName(other).split(' ').map((w: string) => w[0] ?? '').join('').slice(0,2) || '؟'
    const st        = statusConfig(s.status)

    return (
      <div
        onClick={(e: { target: EventTarget | null; currentTarget: EventTarget | null }) => { if (e.target === e.currentTarget) setSelected(null) }}
        style={{ position:'fixed', inset:0, zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.72)', backdropFilter:'blur(8px)', padding:16 }}
      >
        <div style={{ width:'100%', maxWidth:420, borderRadius:20, border:`1px solid ${st.border}`, background:'#141414', padding:28, boxShadow:'0 32px 80px rgba(0,0,0,0.7)', maxHeight:'90vh', overflowY:'auto', fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <span style={{ fontWeight:900, fontSize:16, color:'#f1f5f9', fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>تفاصيل الجلسة</span>
            <button onClick={() => setSelected(null)} style={{ width:32, height:32, borderRadius:8, border:'1px solid color-mix(in srgb, var(--foreground) 10%, transparent)', background:'color-mix(in srgb, var(--foreground) 5%, transparent)', color:'var(--muted-foreground)', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
          </div>

          {/* Person */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18, padding:'12px 14px', background:'color-mix(in srgb, var(--foreground) 4%, transparent)', borderRadius:12, border:'1px solid color-mix(in srgb, var(--foreground) 7%, transparent)' }}>
            <div style={{ width:44, height:44, borderRadius:12, background:`rgba(${st.badge},0.3)`, border:`1px solid ${st.border}`, color:st.badgeText, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, flexShrink:0 }}>
              {other?.profile?.avatar
                ? <img src={other.profile.avatar} alt="" style={{ width:44, height:44, borderRadius:12, objectFit:'cover' }} />
                : initials}
            </div>
            <div>
              <div style={{ fontWeight:500, fontSize:14, color:'#f1f5f9', fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>{userName(other)}</div>
              <div style={{ fontSize:11, color:'var(--muted-foreground)', fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>{s.student || s.user ? 'عميل' : 'مستشار'}</div>
            </div>
            <span style={{ marginRight:'auto', background:st.badge, border:`1px solid ${st.border}`, color:st.badgeText, borderRadius:20, padding:'3px 10px', fontSize:10, fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>
              {STATUS_AR[s.status] ?? s.status}
            </span>
          </div>

          {/* Info */}
          <div style={{ background:'var(--card)', border:'1px solid color-mix(in srgb, var(--foreground) 7%, transparent)', borderRadius:12, padding:'12px 16px', marginBottom:16, fontSize:12, display:'flex', flexDirection:'column', gap:8 }}>
            {(s.topic || s.sessionName) && (
              <div style={{ display:'flex', gap:8, alignItems:'baseline' }}>
                <span style={{ color:'var(--muted-foreground)', fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif', flexShrink:0 }}>الموضوع</span>
                <span style={{ color:'#f1f5f9', fontWeight:500, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>{s.topic || s.sessionName}</span>
              </div>
            )}
            {startD && (
              <div style={{ display:'flex', gap:8, alignItems:'baseline' }}>
                <span style={{ color:'var(--muted-foreground)', fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif', flexShrink:0 }}>التاريخ</span>
                <span style={{ color:'#cbd5e1', fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>{fmtDateAr(startD)}</span>
              </div>
            )}
            {startD && endD && (
              <div style={{ display:'flex', gap:8, alignItems:'baseline' }}>
                <span style={{ color:'var(--muted-foreground)', fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif', flexShrink:0 }}>الوقت</span>
                <span style={{ color:'#cbd5e1', fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>{fmt12(startD)} — {fmt12(endD)}</span>
              </div>
            )}
            <div style={{ display:'flex', gap:8, alignItems:'baseline' }}>
              <span style={{ color:'var(--muted-foreground)', fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif', flexShrink:0 }}>المدة</span>
              <span style={{ color:'#cbd5e1', fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>{s.duration ?? 60} دقيقة</span>
            </div>
            {s.meetingLink && (
              <div style={{ display:'flex', gap:8, alignItems:'baseline' }}>
                <span style={{ color:'var(--muted-foreground)', fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif', flexShrink:0 }}>رابط</span>
                <a href={s.meetingLink} target="_blank" rel="noreferrer" style={{ color:'#60a5fa', fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>فتح الرابط</a>
              </div>
            )}
          </div>

          {/* Countdown */}
          {s.status === 'CONFIRMED' && minsUntil > 0 && (
            <div style={{ fontSize:11, color:'var(--muted-foreground)', textAlign:'center', marginBottom:14, fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>
              تبدأ خلال {minsUntil < 60 ? `${Math.round(minsUntil)} دقيقة` : `${(minsUntil/60).toFixed(1)} ساعة`}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {canAct && (
              <button onClick={() => isLive ? handleJoinRoom(s.id) : handleStartRoom(s.id)} disabled={acting} style={{ padding:'12px 20px', borderRadius:12, border:'none', background:isLive ? '#8b5cf6' : '#14b8a6', color:'var(--primary-foreground)', fontWeight:500, fontSize:14, cursor:acting ? 'wait' : 'pointer', opacity:acting ? 0.7 : 1, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>
                {acting ? 'جاري...' : isLive ? 'متابعة الجلسة' : 'بدء الجلسة'}
              </button>
            )}
            <button onClick={() => router.push(`/${locale}/dashboard/client-sessions`)} style={{ padding:'12px 20px', borderRadius:12, border:`1px solid ${st.border}`, background:st.bg, color:st.text, cursor:'pointer', fontWeight:500, fontSize:13, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              عرض التفاصيل ←
            </button>
            <button onClick={() => setSelected(null)} style={{ padding:'8px 20px', borderRadius:10, border:'1px solid color-mix(in srgb, var(--foreground) 8%, transparent)', background:'transparent', color:'var(--muted-foreground)', cursor:'pointer', fontSize:12, fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>
              إغلاق
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── List view — shows ALL sessions, even those with no valid date ─ */
  function ListView() {
    const sorted = [...sessions].sort((a: Session, b: Session) => {
      const ta = getSessionDate(a)?.getTime() ?? 0
      const tb = getSessionDate(b)?.getTime() ?? 0
      return tb - ta
    })
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
        {sorted.map((s: Session) => {
          const startD = getSessionDate(s)
          const endD   = startD ? new Date(startD.getTime() + (s.duration ?? 60) * 60_000) : null
          const st     = statusConfig(s.status)
          const other  = getOtherPerson(s)
          return (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12, border:`1px solid ${st.border}`, background:st.bg, cursor:'pointer', textAlign:'right', width:'100%', fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}
            >
              <div style={{ width:3, alignSelf:'stretch', borderRadius:2, background:st.border, flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:500, fontSize:13, color:st.text, marginBottom:3, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>
                  {s.topic || s.sessionName || 'جلسة استشارية'}
                </div>
                <div style={{ fontSize:11, color:'var(--muted-foreground)', fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>
                  {userName(other)}
                  {startD ? ` · ${fmtDateAr(startD)}` : ' · تاريخ غير محدد'}
                  {startD && endD ? ` · ${fmt12(startD)} — ${fmt12(endD)}` : ''}
                </div>
              </div>
              <span style={{ background:st.badge, border:`1px solid ${st.border}`, color:st.badgeText, borderRadius:20, padding:'2px 10px', fontSize:10, fontWeight:300, flexShrink:0, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>
                {STATUS_AR[s.status] ?? s.status}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div dir="rtl" style={{ background:'var(--background)', color:'var(--foreground)', padding:20, minHeight:'100vh' }}>

      {/* Page title */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, margin:'0 0 4px', fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>جدول مواعيدي</h1>
          <p style={{ fontSize:12, color:'var(--muted)', margin:0, fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>نظم جلساتك ومواعيدك بسهولة</p>
        </div>
        <button onClick={() => router.push(`/${locale}/dashboard/client-sessions`)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:10, border:'none', background:'var(--primary)', color:'var(--primary-foreground)', cursor:'pointer', fontWeight:700, fontSize:13 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          إدارة الجلسات
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {([
          { label:'جلسات هذا الأسبوع', value:activeWeekSessions.length, color:'#14b8a6', icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label:'مواعيد قادمة',        value:upcomingCount,             color:'#a78bfa', icon:'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label:'ساعات مكتملة',        value:doneHours,                 color:'#10b981', icon:'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
        ] as const).map(({ label, value, color, icon }) => (
          <div key={label} style={{ borderRadius:14, border:'1px solid color-mix(in srgb, var(--foreground) 7%, transparent)', background:'var(--card)', padding:'16px 20px', display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" style={{ opacity:0.8 }}><path d={icon}/></svg>
              <div style={{ fontSize:12, color:'var(--muted-foreground)', fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>{label}</div>
            </div>
            <div style={{ fontSize:28, fontWeight:500, color, lineHeight:1, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <button onClick={() => setWeekStart((w: Date) => addDays(w,-7))} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--foreground)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        <span style={{ fontSize:13, fontWeight:700, minWidth:200, textAlign:'center' }}>{weekLabel}</span>

        <button onClick={() => setWeekStart((w: Date) => addDays(w,7))} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--foreground)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        <button onClick={() => setWeekStart(startOfWeekSun(new Date()))} style={{ padding:'5px 14px', borderRadius:8, border:'1px solid var(--primary)', background:'var(--primary)', color:'var(--primary-foreground)', cursor:'pointer', fontSize:12, fontWeight:700 }}>
          اليوم
        </button>

        <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden', marginRight:'auto' }}>
          {(['calendar','list'] as const).map((v: 'calendar' | 'list') => (
            <button key={v} onClick={() => setView(v)} style={{ padding:'5px 14px', fontSize:12, fontWeight:700, cursor:'pointer', border:'none', background:view===v ? 'var(--primary)' : 'transparent', color:view===v ? 'var(--primary-foreground)' : 'var(--muted)', transition:'all 0.15s' }}>
              {v === 'calendar' ? 'أسبوع' : 'قائمة'}
            </button>
          ))}
        </div>

        <button onClick={load} disabled={loading} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--muted)', cursor:loading ? 'wait' : 'pointer', fontSize:11 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          {loading ? 'جاري...' : 'تحديث'}
        </button>

        {sessions.length > 0 && (
          <span style={{ fontSize:10, color:'var(--muted)', opacity:0.6 }}>{sessions.length} جلسة</span>
        )}
      </div>

      {/* ════ LIST VIEW ════════════════════════════════════════════════ */}
      {view === 'list' && <ListView />}

      {/* ════ CALENDAR VIEW ════════════════════════════════════════════ */}
      {view === 'calendar' && (
        <>
          {/* Calendar grid */}
          <div style={{ overflowX:'auto', borderRadius:12, border:'1px solid var(--border)' }}>
            <div style={{ minWidth:780, background:'var(--card)' }}>

              {/* Day headers */}
              <div style={{ display:'grid', gridTemplateColumns:'64px repeat(7,1fr)', borderBottom:'1px solid color-mix(in srgb, var(--foreground) 7%, transparent)' }}>
                <div style={{ height:56, borderRight:'1px solid color-mix(in srgb, var(--foreground) 6%, transparent)' }} />
                {weekDays.map((d: Date, i: number) => {
                  const isToday = sameDay(now, d)
                  const hasSess = sessions.some((s: Session) => {
                    const sd = getSessionDate(s)
                    return sd && sameDay(sd, d) && !['CANCELLED','REJECTED'].includes(s.status)
                  })
                  return (
                    <div key={i} style={{ padding:'8px 4px', textAlign:'center', borderRight:i<6 ? '1px solid color-mix(in srgb, var(--foreground) 6%, transparent)' : undefined }}>
                      <div style={{ fontSize:11, fontWeight:500, color:'var(--muted-foreground)', marginBottom:4, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>{DAYS_AR[d.getDay()]}</div>
                      <div style={{ width:30, height:30, borderRadius:'50%', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:300, background:isToday ? '#5120c8' : 'transparent', color:isToday ? 'var(--primary-foreground)' : 'var(--foreground)', position:'relative', fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>
                        {d.getDate()}
                        {hasSess && !isToday && (
                          <span style={{ position:'absolute', bottom:1, left:'50%', transform:'translateX(-50%)', width:4, height:4, borderRadius:'50%', background:'#14b8a6' }} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Time grid */}
              <div style={{ display:'grid', gridTemplateColumns:'64px repeat(7,1fr)' }}>

                {/* Hour labels */}
                <div style={{ borderRight:'1px solid color-mix(in srgb, var(--foreground) 6%, transparent)' }}>
                  {HOURS.map((h: number) => (
                    <div key={h} style={{ height:ROW_H, borderBottom:'1px solid color-mix(in srgb, var(--foreground) 4%, transparent)', boxSizing:'border-box', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:5, fontSize:11, color:'var(--muted-foreground)', fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>
                      {hourLabel(h)}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map((day: Date, di: number) => {
                  const isToday     = di === todayIdx
                  const daySessions = sessions.filter((s: Session) => {
                    const d = getSessionDate(s)
                    return d && sameDay(d, day)
                  })

                  return (
                    <div
                      key={di}
                      style={{
                        position:'relative',
                        height: HOURS.length * ROW_H,
                        borderRight: di < 6 ? '1px solid color-mix(in srgb, var(--foreground) 6%, transparent)' : undefined,
                        background: isToday ? 'rgba(81,32,200,0.04)' : undefined,
                      }}
                    >
                      {/* Grid lines */}
                      {HOURS.map((h: number) => (
                        <div key={h} style={{ position:'absolute', top:(h-GRID_START)*ROW_H, left:0, right:0, height:ROW_H, borderBottom:'1px solid color-mix(in srgb, var(--foreground) 4%, transparent)', boxSizing:'border-box', pointerEvents:'none' }} />
                      ))}
                      {/* Half-hour lines */}
                      {HOURS.map((h: number) => (
                        <div key={`hf${h}`} style={{ position:'absolute', top:(h-GRID_START)*ROW_H+ROW_H/2, left:0, right:0, height:1, background:'color-mix(in srgb, var(--foreground) 2.5%, transparent)', pointerEvents:'none' }} />
                      ))}

                      {/* Current time indicator */}
                      {isToday && nowTop >= 0 && nowTop <= HOURS.length*ROW_H && (
                        <div style={{ position:'absolute', top:nowTop, left:0, right:0, height:2, background:'var(--primary)', zIndex:5, pointerEvents:'none' }}>
                          <div style={{ position:'absolute', right:-5, top:-5, width:10, height:10, borderRadius:'50%', background:'var(--primary)', boxShadow:'0 0 6px rgba(81,32,200,0.8)' }} />
                        </div>
                      )}

                      {/* SESSION BLOCKS */}
                      {daySessions.map((s: Session) => {
                        const sd = getSessionDate(s)
                        if (!sd) return null   // guard: skip sessions with no valid date

                        const h = sd.getHours()
                        if (h < GRID_START || h >= GRID_START + HOURS.length) return null

                        const top  = blockTop(sd)
                        const ht   = blockH(s.duration ?? 60)
                        const st   = statusConfig(s.status)
                        const endD = new Date(sd.getTime() + (s.duration ?? 60) * 60_000)

                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelected(s)}
                            title={`${s.topic || s.sessionName || 'جلسة'} — ${STATUS_AR[s.status] ?? s.status}`}
                            style={{
                              position:'absolute',
                              top: top + 1,
                              left: 3, right: 3,
                              height: ht - 2,
                              borderRadius: 8,
                              padding: '5px 8px',
                              fontSize: 10,
                              textAlign: 'right',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              zIndex: 2,
                              lineHeight: 1.35,
                              border: `1.5px solid ${st.border}`,
                              background: st.bg,
                              color: st.text,
                              boxShadow: `0 2px 8px rgba(0,0,0,0.15)`,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 2,
                              fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif',
                            }}
                          >
                            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500, fontSize:10 }}>
                              {s.topic || s.sessionName || 'جلسة استشارية'}
                            </span>
                            {ht > 40 && (
                              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:9, fontWeight:300, opacity:0.75 }}>
                                {userName(getOtherPerson(s))}
                              </span>
                            )}
                            {ht > 58 && (
                              <span style={{ fontSize:9, fontWeight:300, opacity:0.7, marginTop:'auto' }}>
                                {fmt12(sd)} — {fmt12(endD)}
                              </span>
                            )}
                            {ht >= 72 && (
                              <span style={{ fontSize:8, fontWeight:300, background:st.badge, color:st.badgeText, borderRadius:4, padding:'1px 5px', alignSelf:'flex-start' }}>
                                {STATUS_AR[s.status] ?? s.status}
                              </span>
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

          {/* No sessions this week → show week jump buttons */}
          {activeWeekSessions.length === 0 && sessions.length > 0 && (() => {
            const weekMap = new Map<string, Date>()
            sessions
              .filter((s: Session) => {
                const d = getSessionDate(s)
                return d && !['CANCELLED','REJECTED'].includes(s.status)
              })
              .forEach((s: Session) => {
                const d = getSessionDate(s)!
                const w = startOfWeekSun(d)
                if (!weekMap.has(w.toISOString())) weekMap.set(w.toISOString(), w)
              })
            const uniqueWeeks: Date[] = Array.from(weekMap.values()).sort((a: Date, b: Date) => a.getTime() - b.getTime()).slice(0, 8)
            if (uniqueWeeks.length === 0) return null
            return (
              <div style={{ marginTop:16, padding:16, background:'var(--surface)', borderRadius:12, border:'1px dashed var(--border)' }}>
                <div style={{ fontSize:13, color:'var(--muted)', marginBottom:12, textAlign:'center', fontWeight:700 }}>
                  لا توجد جلسات في هذا الأسبوع — اختر أسبوعاً من الجلسات الموجودة:
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
                  {uniqueWeeks.map((w: Date) => {
                    const end = addDays(w, 6)
                    const label = `${w.getDate()} ${MONTHS_AR[w.getMonth()]} — ${end.getDate()} ${MONTHS_AR[end.getMonth()]}`
                    const sessCount = sessions.filter((s: Session) => {
                      const d = getSessionDate(s)
                      return d && d >= w && d < addDays(w, 7)
                    }).length
                    return (
                      <button
                        key={w.toISOString()}
                        onClick={() => setWeekStart(w)}
                        style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--primary)', background:'rgba(81,32,200,0.08)', color:'var(--primary)', cursor:'pointer', fontSize:12, fontWeight:700 }}
                      >
                        {label} ({sessCount})
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Sessions exist but none have valid dates */}
          {activeWeekSessions.length === 0 && sessions.length > 0 &&
            sessions.filter((s: Session) => getSessionDate(s) !== null).length === 0 && (
            <div style={{ marginTop:16, padding:16, background:'rgba(255,149,0,0.08)', borderRadius:12, border:'1px dashed var(--warning)', textAlign:'center' }}>
              <div style={{ fontSize:13, color:'var(--warning)', fontWeight:700, marginBottom:6 }}>
                تنبيه: {sessions.length} جلسة موجودة لكن بدون تاريخ صالح
              </div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>
                يرجى استخدام عرض القائمة لمشاهدة جميع الجلسات
              </div>
              <button onClick={() => setView('list')} style={{ marginTop:10, padding:'6px 18px', borderRadius:8, border:'1px solid var(--warning)', background:'transparent', color:'var(--warning)', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                عرض القائمة
              </button>
            </div>
          )}

          {/* Completely empty */}
          {sessions.length === 0 && !loading && (
            <div style={{ marginTop:40, textAlign:'center', padding:40, border:'2px dashed var(--border)', borderRadius:16, color:'var(--muted)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin:'0 auto 12px', display:'block', opacity:0.4 }}>
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>لا توجد جلسات</div>
              <div style={{ fontSize:12 }}>لم يتم العثور على أي جلسات في حسابك</div>
            </div>
          )}
        </>
      )}

      {/* Legend */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:14, flexWrap:'wrap' }}>
        {[
          { label:'مؤكدة',             color:'#3b82f6' },
          { label:'جارية الآن',        color:'#8b5cf6' },
          { label:'مكتملة',            color:'#22c55e' },
          { label:'بانتظار الدفع',    color:'#eab308' },
          { label:'بانتظار الموافقة', color:'var(--muted-foreground)' },
          { label:'ملغاة',             color:'#ef4444' },
        ].map(({ label, color }: { label: string; color: string }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--muted-foreground)', fontWeight:300, fontFamily:'"PingAR","Plus Jakarta Sans",sans-serif' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:color, flexShrink:0 }} />
            {label}
          </div>
        ))}
      </div>

      <SessionModal />
    </div>
  )
}
