'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { api } from '../../../../lib/api'

/* ─── Types ─────────────────────────────────────────────── */
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
  price?: number
  user?: UserRef
  consultant?: UserRef
}

/* ─── Constants ──────────────────────────────────────────── */
const DAYS_AR  = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']
const HOURS    = Array.from({ length: 13 }, (_, i) => i + 8)   // 8 AM–8 PM
const ROW_H    = 64
const GRID_START = 8

/* ─── Helpers ────────────────────────────────────────────── */
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
  const mm = String(m).padStart(2,'0')
  if (h === 0)  return `12:${mm} ص`
  if (h < 12)   return `${h}:${mm} ص`
  if (h === 12) return `12:${mm} م`
  return `${h - 12}:${mm} م`
}
function userName(u?: UserRef): string {
  return `${u?.profile?.firstName||''} ${u?.profile?.lastName||''}`.trim() || '—'
}
function sameDay(scheduledAt: string, day: Date): boolean {
  const t = new Date(scheduledAt)
  return (
    t.getFullYear() === day.getFullYear() &&
    t.getMonth()    === day.getMonth() &&
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

/* ─── Status styles ──────────────────────────────────────── */
const STATUS_AR: Record<string,string> = {
  PENDING_APPROVAL:'بانتظار الموافقة', PENDING:'بانتظار الموافقة',
  AWAITING_PAYMENT:'بانتظار الدفع',    CONFIRMED:'مؤكدة',
  IN_PROGRESS:'جارية',                 COMPLETED:'مكتملة',
  CANCELLED:'ملغاة',                   RESCHEDULE_REQUESTED:'تغيير موعد',
}
function blockStyle(status: string): CSSProperties {
  switch (status) {
    case 'CONFIRMED':
      return { background:'var(--primary)', border:'1.5px solid var(--primary)', color:'#fff' }
    case 'IN_PROGRESS':
      return { background:'var(--accent)', border:'1.5px solid var(--accent)', color:'#fff' }
    case 'COMPLETED':
      return { background:'rgba(43,191,163,0.15)', border:'1.5px solid var(--accent)', color:'var(--accent)' }
    case 'AWAITING_PAYMENT':
      return { background:'rgba(255,149,0,0.15)', border:'1.5px solid var(--warning)', color:'var(--warning)' }
    case 'PENDING_APPROVAL': case 'PENDING':
      return { background:'rgba(81,32,200,0.12)', border:'1.5px dashed rgba(81,32,200,0.5)', color:'var(--primary)' }
    case 'RESCHEDULE_REQUESTED': case 'CANCELLED':
      return { background:'rgba(255,59,48,0.1)', border:'1.5px solid var(--error)', color:'var(--error)' }
    default:
      return { background:'var(--surface)', border:'1px solid var(--border)', color:'var(--muted)' }
  }
}

/* ─── Component ──────────────────────────────────────────── */
export default function ScheduleClient() {
  const locale  = useLocale()
  const router  = useRouter()

  const [weekStart, setWeekStart] = useState(() => startOfWeekSun(new Date()))
  const [sessions,  setSessions]  = useState<Session[]>([])
  const [loading,   setLoading]   = useState(false)
  const [selected,  setSelected]  = useState<Session | null>(null)
  const [acting,    setActing]    = useState(false)
  const [now,       setNow]       = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  /* ─── Load sessions ────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const from = weekStart.toISOString()
      const to   = addDays(weekStart, 7).toISOString()
      const res  = await api.get(`/consulting/sessions?from=${from}&to=${to}`)

      const raw  = res.data?.data ?? res.data ?? {}
      const cs   = (raw.clientSessions ?? []) as Session[]
      const ms   = (raw.mySessions     ?? []) as Session[]

      // Deduplicate by ID — same session can appear in both arrays
      const map  = new Map<string,Session>()
      ;[...cs, ...ms].forEach(s => { if (!map.has(s.id)) map.set(s.id, s) })
      const all  = Array.from(map.values())

      console.log('[Schedule] fetched', all.length, 'sessions:', all.map(s => ({
        id: s.id.slice(0,8), status: s.status, scheduledAt: s.scheduledAt,
        localDate: new Date(s.scheduledAt).toLocaleDateString(),
        localHour: new Date(s.scheduledAt).getHours(),
      })))

      setSessions(all)
    } catch (e) {
      console.error('[Schedule] load error', e)
    }
    setLoading(false)
  }, [weekStart])

  useEffect(() => { load() }, [load])

  /* ─── Room actions ─────────────────────────────────────── */
  async function handleStartRoom(sessionId: string) {
    setActing(true)
    try {
      await api.post(`/consulting/sessions/${sessionId}/start-room`)
      setSelected(null)
      router.push(`/${locale}/dashboard/consulting/${sessionId}/go-live`)
    } catch (e) { console.error('[Schedule] start room error', e) }
    setActing(false)
  }
  async function handleJoinRoom(sessionId: string) {
    try {
      await api.post(`/consulting/sessions/${sessionId}/join-room`)
      setSelected(null)
      router.push(`/${locale}/dashboard/consulting/${sessionId}/go-live`)
    } catch (e) { console.error('[Schedule] join room error', e) }
  }

  /* ─── Stats ────────────────────────────────────────────── */
  const weekCount  = sessions.length
  const upcoming   = sessions.filter((s: Session) =>
    ['CONFIRMED','AWAITING_PAYMENT','PENDING_APPROVAL','PENDING','IN_PROGRESS'].includes(s.status) &&
    new Date(s.scheduledAt) > now,
  ).length
  const doneHours  = +(sessions
    .filter((s: Session) => s.status === 'COMPLETED')
    .reduce((a: number, s: Session) => a + s.duration, 0) / 60
  ).toFixed(1)

  /* ─── Current-time indicator ───────────────────────────── */
  const todayIdx = weekDays.findIndex((d: Date) =>
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth() &&
    d.getDate()     === now.getDate(),
  )
  const nowTop = (now.getHours() - GRID_START) * ROW_H + (now.getMinutes() / 60) * ROW_H

  /* ─── Session detail modal ─────────────────────────────── */
  const modal = selected ? (() => {
    const start        = new Date(selected.scheduledAt)
    const end          = new Date(start.getTime() + selected.duration * 60_000)
    const minutesUntil = (start.getTime() - now.getTime()) / 60_000
    const canStart     = selected.status === 'CONFIRMED' && minutesUntil >= -120
    const isLive       = selected.status === 'IN_PROGRESS'
    const other        = selected.user ?? selected.consultant
    const initials     = userName(other).split(' ').map((w: string) => w[0]).join('').slice(0,2) || '؟'
    const st           = blockStyle(selected.status)

    return (
      <div
        onClick={(e) => { if (e.target === e.currentTarget) setSelected(null) }}
        style={{ position:'fixed', inset:0, zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.65)', padding:16 }}
      >
        <div style={{ width:'100%', maxWidth:420, borderRadius:16, border:'1px solid var(--border)', background:'var(--card)', padding:24, boxShadow:'0 24px 72px rgba(0,0,0,0.5)' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <span style={{ fontWeight:900, fontSize:15 }}>تفاصيل الجلسة</span>
            <button onClick={() => setSelected(null)} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
          </div>
          {/* Person */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'rgba(81,32,200,0.1)', color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900, flexShrink:0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:14 }}>{userName(other)}</div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>{selected.consultant ? 'عميل' : 'مستشار'}</div>
            </div>
          </div>
          {/* Info rows */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:12, display:'flex', flexDirection:'column', gap:6 }}>
            <div><span style={{ color:'var(--muted)', fontWeight:700 }}>الموضوع: </span>{selected.topic || selected.sessionName || '—'}</div>
            <div><span style={{ color:'var(--muted)', fontWeight:700 }}>التاريخ: </span>{start.toLocaleDateString('ar-EG-u-ca-gregory', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</div>
            <div><span style={{ color:'var(--muted)', fontWeight:700 }}>الوقت: </span>{fmt12(start)} — {fmt12(end)}</div>
            <div><span style={{ color:'var(--muted)', fontWeight:700 }}>المدة: </span>{selected.duration} دقيقة</div>
          </div>
          {/* Status badge */}
          <div style={{ marginBottom:16 }}>
            <span style={{ ...st, borderRadius:20, padding:'3px 12px', fontSize:11, fontWeight:800, display:'inline-block' }}>
              {STATUS_AR[selected.status] || selected.status}
            </span>
          </div>
          {/* Buttons */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {(canStart || isLive) && (
              <button
                onClick={() => isLive ? handleJoinRoom(selected.id) : handleStartRoom(selected.id)}
                disabled={acting}
                style={{ padding:'10px 20px', borderRadius:10, border:'none', background: isLive ? 'var(--accent)' : 'var(--primary)', color:'#fff', fontWeight:800, fontSize:13, cursor: acting ? 'wait' : 'pointer', opacity: acting ? 0.7 : 1 }}
              >
                {acting ? 'جاري...' : isLive ? 'متابعة الجلسة' : 'بدء الجلسة'}
              </button>
            )}
            {selected.status === 'CONFIRMED' && minutesUntil > 0 && (
              <div style={{ fontSize:11, color:'var(--muted)', textAlign:'center' }}>
                تبدأ خلال {Math.round(minutesUntil)} دقيقة
              </div>
            )}
            <button
              onClick={() => router.push(`/${locale}/dashboard/consulting/${selected.id}`)}
              style={{ padding:'10px 20px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--foreground)', cursor:'pointer', fontWeight:700, fontSize:13 }}
            >
              عرض التفاصيل
            </button>
            <button onClick={() => setSelected(null)} style={{ padding:'8px 20px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', cursor:'pointer', fontSize:12 }}>
              إغلاق
            </button>
          </div>
        </div>
      </div>
    )
  })() : null

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div dir="rtl" style={{ background:'var(--background)', color:'var(--foreground)', padding:20, minHeight:'100vh' }}>

      {/* Page title */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, margin:'0 0 4px' }}>جدول مواعيدي</h1>
          <p style={{ fontSize:12, color:'var(--muted)', margin:0 }}>نظم جلساتك ومواعيدك بسهولة</p>
        </div>
        <button style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', borderRadius:10, border:'none', background:'var(--primary)', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:13 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          موعد جديد
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {([
          { label:'جلسات هذا الأسبوع', value:weekCount,  color:'var(--primary)' },
          { label:'مواعيد قادمة',       value:upcoming,   color:'var(--accent)'  },
          { label:'ساعات مكتملة',       value:doneHours,  color:'var(--success)' },
        ] as const).map(({ label, value, color }) => (
          <div key={label} style={{ borderRadius:14, border:'1px solid var(--border)', background:'var(--card)', padding:'16px 20px' }}>
            <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6, fontWeight:600 }}>{label}</div>
            <div style={{ fontSize:28, fontWeight:900, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => setWeekStart((w: Date) => addDays(w,-7))} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--foreground)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <span style={{ fontSize:13, fontWeight:700, minWidth:180, textAlign:'center' }}>
            {weekStart.toLocaleDateString('ar-EG-u-ca-gregory',{ day:'numeric', month:'long' })}
            {' — '}
            {addDays(weekStart,6).toLocaleDateString('ar-EG-u-ca-gregory',{ day:'numeric', month:'long', year:'numeric' })}
          </span>
          <button onClick={() => setWeekStart((w: Date) => addDays(w,7))} style={{ width:32, height:32, borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--foreground)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button onClick={() => setWeekStart(startOfWeekSun(new Date()))} style={{ padding:'5px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--primary)', color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>
            اليوم
          </button>
        </div>
        {loading && <span style={{ fontSize:11, color:'var(--muted)' }}>جاري التحميل...</span>}
      </div>

      {/* Calendar grid — NO overflow:hidden on outer wrapper */}
      <div style={{ overflowX:'auto', borderRadius:12, border:'1px solid var(--border)' }}>
        <div style={{ minWidth:780, background:'var(--card)' }}>

          {/* Day header */}
          <div style={{ display:'grid', gridTemplateColumns:'60px repeat(7,1fr)', borderBottom:'1px solid var(--border)' }}>
            <div style={{ height:52, borderRight:'1px solid var(--border)' }} />
            {weekDays.map((d: Date, i: number) => {
              const isToday = d.toDateString() === now.toDateString()
              return (
                <div key={i} style={{ padding:'8px 0', textAlign:'center', borderRight: i<6 ? '1px solid var(--border)' : undefined }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--muted)', marginBottom:2 }}>{DAYS_AR[d.getDay()]}</div>
                  <div style={{ width:30, height:30, borderRadius:'50%', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, background: isToday ? 'var(--primary)' : 'transparent', color: isToday ? '#fff' : 'var(--foreground)' }}>
                    {d.getDate()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          <div style={{ display:'grid', gridTemplateColumns:'60px repeat(7,1fr)' }}>

            {/* Hour labels */}
            <div style={{ borderRight:'1px solid var(--border)' }}>
              {HOURS.map(h => (
                <div key={h} style={{ height:ROW_H, borderBottom:'1px solid var(--border)', boxSizing:'border-box', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:5, fontSize:10, color:'var(--muted)', fontWeight:600 }}>
                  {hourLabel(h)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day: Date, di: number) => {
              const daySessions = sessions.filter((s: Session) => sameDay(s.scheduledAt, day))
              const isToday     = di === todayIdx

              return (
                <div
                  key={di}
                  style={{
                    position:'relative',
                    height: HOURS.length * ROW_H,
                    borderRight: di<6 ? '1px solid var(--border)' : undefined,
                    background: isToday ? 'rgba(81,32,200,0.025)' : undefined,
                  }}
                >
                  {/* Hour cell lines */}
                  {HOURS.map(h => (
                    <div key={h} style={{ height:ROW_H, borderBottom:'1px solid var(--border)', boxSizing:'border-box' }} />
                  ))}

                  {/* Current-time line */}
                  {isToday && nowTop >= 0 && nowTop <= HOURS.length * ROW_H && (
                    <div style={{ position:'absolute', top:nowTop, left:0, right:0, height:2, background:'var(--primary)', zIndex:5, pointerEvents:'none' }}>
                      <div style={{ position:'absolute', right:-4, top:-4, width:10, height:10, borderRadius:'50%', background:'var(--primary)' }} />
                    </div>
                  )}

                  {/* Session blocks */}
                  {daySessions.map((s: Session) => {
                    const h = new Date(s.scheduledAt).getHours()
                    if (h < GRID_START || h >= GRID_START + HOURS.length) return null

                    const top    = blockTop(s.scheduledAt)
                    const height = blockHeight(s.duration)
                    const st     = blockStyle(s.status)
                    const startD = new Date(s.scheduledAt)
                    const endD   = new Date(startD.getTime() + s.duration * 60_000)

                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelected(s)}
                        style={{
                          position:'absolute',
                          top:    top + 1,
                          left:   3,
                          right:  3,
                          height: height - 2,
                          borderRadius:8,
                          padding:'4px 7px',
                          fontSize:10,
                          textAlign:'right',
                          cursor:'pointer',
                          overflow:'hidden',
                          fontWeight:700,
                          zIndex:2,
                          lineHeight:1.35,
                          border:'none',
                          ...st,
                        }}
                      >
                        {/* Icon + topic */}
                        <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink:0 }}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                          <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, fontWeight:800 }}>
                            {s.topic || s.sessionName || 'جلسة استشارية'}
                          </span>
                        </div>
                        {height > 40 && (
                          <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:9, opacity:0.9, marginTop:1 }}>
                            {userName(s.user ?? s.consultant)}
                          </div>
                        )}
                        {height > 58 && (
                          <div style={{ fontSize:9, opacity:0.8, marginTop:1 }}>
                            {fmt12(startD)} — {fmt12(endD)}
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
      <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:12, flexWrap:'wrap' }}>
        {[
          { label:'مؤكدة',            color:'var(--primary)' },
          { label:'مكتملة',           color:'var(--accent)'  },
          { label:'بانتظار الدفع',    color:'var(--warning)' },
          { label:'بانتظار الموافقة', color:'rgba(81,32,200,0.4)' },
          { label:'ملغاة',            color:'var(--error)'   },
        ].map(({ label, color }) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--muted)' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:color }} />
            {label}
          </div>
        ))}
      </div>

      {modal}
    </div>
  )
}
