'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { api } from '../../../../lib/api'

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

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8) // 8am–9pm
const ROW_HEIGHT = 60
const GRID_START_HOUR = 8

function addDays(d: Date, n: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

function startOfWeekSun(d: Date): Date {
  const start = new Date(d)
  start.setDate(start.getDate() - start.getDay()) // Sunday = 0
  start.setHours(0, 0, 0, 0)
  return start
}

function blockStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'PENDING_APPROVAL':
    case 'PENDING':
      return {
        background: 'color-mix(in srgb, var(--primary) 22%, transparent)',
        border: '1.5px dashed var(--primary)',
        color: 'var(--primary)',
      }
    case 'AWAITING_PAYMENT':
      return {
        background: 'color-mix(in srgb, var(--warning) 20%, transparent)',
        border: '1.5px solid var(--warning)',
        color: 'var(--warning)',
      }
    case 'CONFIRMED':
      return { background: 'var(--primary)', border: '1.5px solid var(--primary)', color: 'white' }
    case 'IN_PROGRESS':
      return { background: 'var(--accent)', border: '1.5px solid var(--accent)', color: 'white' }
    case 'COMPLETED':
      return {
        background: 'var(--surface)',
        border: '1.5px solid var(--border)',
        color: 'var(--muted)',
        textDecoration: 'line-through',
      }
    case 'CANCELLED':
    case 'RESCHEDULE_REQUESTED':
      return {
        background: 'repeating-linear-gradient(45deg, color-mix(in srgb, var(--border) 80%, transparent), color-mix(in srgb, var(--border) 80%, transparent) 3px, transparent 3px, transparent 9px)',
        border: '1.5px solid var(--border)',
        color: 'var(--muted)',
      }
    default:
      return { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }
  }
}

function badgeStyle(status: string): React.CSSProperties {
  const base = blockStyle(status)
  return {
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 800,
    display: 'inline-block',
    background: base.background,
    border: base.border,
    color: base.color,
  }
}

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

function userName(u?: { profile?: { firstName?: string; lastName?: string } }): string {
  return `${u?.profile?.firstName || ''} ${u?.profile?.lastName || ''}`.trim() || '—'
}

function locFmt(d: Date, isAr: boolean, opts: Intl.DateTimeFormatOptions): string {
  return d.toLocaleString(isAr ? 'ar-EG-u-ca-gregory' : 'en-US-u-ca-gregory', opts)
}

export default function ScheduleClient() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()

  const [weekStart, setWeekStart] = useState(() => startOfWeekSun(new Date()))
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Session | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileDay, setMobileDay] = useState(() => new Date())

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const from = weekStart.toISOString()
      const to = addDays(weekStart, 7).toISOString()
      const res = await api.get(`/consulting/sessions?from=${from}&to=${to}`)
      const clientSessions = (res.data?.data?.clientSessions || []) as Session[]
      const mySessions = (res.data?.data?.mySessions || []) as Session[]
      setSessions([...clientSessions, ...mySessions])
    } catch (e) {
      console.error('[Schedule] load error', e)
    }
    setLoading(false)
  }, [weekStart])

  useEffect(() => { load() }, [load])

  function handleStartRoom(sessionId: string) {
    setSelected(null)
    router.push(`/${locale}/dashboard/consulting/${sessionId}/go-live`)
  }

  function handleJoinRoom(sessionId: string) {
    setSelected(null)
    router.push(`/${locale}/dashboard/consulting/${sessionId}/go-live`)
  }

  function blockTop(scheduledAt: string): number {
    const d = new Date(scheduledAt)
    return Math.max(0, ((d.getHours() - GRID_START_HOUR) * 60 + d.getMinutes()) / 60 * ROW_HEIGHT)
  }

  function blockHeight(duration: number): number {
    return Math.max(ROW_HEIGHT / 2, (duration / 60) * ROW_HEIGHT)
  }

  const mobileDaySessions = useMemo(() => {
    const s = new Date(mobileDay); s.setHours(0, 0, 0, 0)
    const e = addDays(s, 1)
    return sessions.filter(x => { const t = new Date(x.scheduledAt); return t >= s && t < e })
  }, [sessions, mobileDay])

  // Session detail modal
  const modal = selected ? (() => {
    const start = new Date(selected.scheduledAt)
    const end = new Date(start.getTime() + selected.duration * 60000)
    const minutesUntil = (start.getTime() - Date.now()) / 60000
    const canStart = selected.status === 'CONFIRMED' || selected.status === 'IN_PROGRESS'
    const isLive = selected.status === 'IN_PROGRESS'

    return (
      <div
        onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}
        style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--foreground) 40%, transparent)', padding: 16 }}
      >
        <div style={{ width: '100%', maxWidth: 400, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--card)', padding: 24, boxShadow: '0 24px 64px color-mix(in srgb, var(--foreground) 20%, transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 900, margin: 0 }}>{isAr ? 'تفاصيل الجلسة' : 'Session details'}</h2>
            <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>
              {userName(selected.user ?? selected.consultant).charAt(0) || '?'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{userName(selected.user ?? selected.consultant)}</div>
              {(selected.user?.email || selected.consultant?.email) && (
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {selected.user?.email || selected.consultant?.email}
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div><span style={{ color: 'var(--muted)', fontWeight: 700 }}>{isAr ? 'التاريخ: ' : 'Date: '}</span>{locFmt(start, isAr, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div><span style={{ color: 'var(--muted)', fontWeight: 700 }}>{isAr ? 'الوقت: ' : 'Time: '}</span>{locFmt(start, isAr, { hour: '2-digit', minute: '2-digit' })} — {locFmt(end, isAr, { hour: '2-digit', minute: '2-digit' })}</div>
            <div><span style={{ color: 'var(--muted)', fontWeight: 700 }}>{isAr ? 'المدة: ' : 'Duration: '}</span>{selected.duration} {isAr ? 'دقيقة' : 'min'}</div>
            <div><span style={{ color: 'var(--muted)', fontWeight: 700 }}>{isAr ? 'الموضوع: ' : 'Topic: '}</span>{selected.topic || selected.sessionName || '—'}</div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <span style={badgeStyle(selected.status)}>{STATUS_AR[selected.status] || selected.status}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(canStart || isLive) && (
              <button
                onClick={() => isLive ? handleJoinRoom(selected.id) : handleStartRoom(selected.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: isLive ? 'var(--accent)' : 'var(--primary)', color: 'white', fontWeight: 800, fontSize: 13 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                {isLive ? (isAr ? 'متابعة الجلسة' : 'Rejoin session') : (isAr ? 'بدء الجلسة' : 'Start session')}
              </button>
            )}
            {selected.status === 'CONFIRMED' && !canStart && minutesUntil > 15 && (
              <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
                {isAr ? `تبدأ خلال ${Math.round(minutesUntil)} دقيقة` : `Starts in ${Math.round(minutesUntil)} min`}
              </div>
            )}
            <button onClick={() => setSelected(null)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    )
  })() : null

  // Mobile single-day view
  if (isMobile) {
    return (
      <div dir="rtl" style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{isAr ? 'جدول مواعيدي' : 'My Schedule'}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setMobileDay(d => addDays(d, -1))} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 800 }}>{'<'}</button>
            <span style={{ fontSize: 12, fontWeight: 600, minWidth: 130, textAlign: 'center', color: 'var(--foreground)' }}>
              {locFmt(mobileDay, isAr, { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <button onClick={() => setMobileDay(d => addDays(d, 1))} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 800 }}>{'>'}</button>
          </div>
        </div>

        {loading && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</div>}

        {mobileDaySessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)', fontSize: 14 }}>
            {isAr ? 'لا توجد جلسات هذا اليوم' : 'No sessions today'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mobileDaySessions.map(s => {
              const start = new Date(s.scheduledAt)
              const end = new Date(start.getTime() + s.duration * 60000)
              const st = blockStyle(s.status)
              return (
                <div key={s.id} onClick={() => setSelected(s)} style={{ borderRadius: 12, padding: '12px 16px', cursor: 'pointer', ...st }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{userName(s.user ?? s.consultant)}</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>
                    {locFmt(start, isAr, { hour: '2-digit', minute: '2-digit' })} — {locFmt(end, isAr, { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 3, opacity: 0.8 }}>{s.duration} {isAr ? 'دقيقة' : 'min'} · {STATUS_AR[s.status] || s.status}</div>
                </div>
              )
            })}
          </div>
        )}

        {modal}
      </div>
    )
  }

  // Desktop weekly calendar
  return (
    <div dir="rtl" style={{ background: 'var(--background)', color: 'var(--foreground)', padding: 16, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>{isAr ? 'جدول مواعيدي' : 'My Schedule'}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setWeekStart(w => addDays(w, -7))} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button onClick={() => setWeekStart(startOfWeekSun(new Date()))} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            {isAr ? 'اليوم' : 'Today'}
          </button>
          <button onClick={() => setWeekStart(w => addDays(w, 7))} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, fontWeight: 600, textAlign: 'center' }}>
        {locFmt(weekStart, isAr, { day: 'numeric', month: 'long' })} — {locFmt(addDays(weekStart, 6), isAr, { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>

      {loading && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</div>}

      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 760, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--card)' }}>
          {/* Day header */}
          <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ height: 48, borderRight: '1px solid var(--border)' }} />
            {weekDays.map((d, i) => {
              const isToday = d.toDateString() === new Date().toDateString()
              return (
                <div key={i} style={{ padding: '8px 4px', textAlign: 'center', borderRight: i < 6 ? '1px solid var(--border)' : undefined }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>{isAr ? DAYS_AR[d.getDay()] : DAYS_EN[d.getDay()]}</div>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', margin: '2px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, background: isToday ? 'var(--primary)' : 'transparent', color: isToday ? 'white' : 'var(--foreground)' }}>
                    {d.getDate()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)' }}>
            {/* Time labels */}
            <div style={{ borderRight: '1px solid var(--border)' }}>
              {HOURS.map(h => (
                <div key={h} style={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 4, fontSize: 10, color: 'var(--muted)', borderBottom: '1px solid var(--border)', boxSizing: 'border-box' }}>
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, di) => {
              const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0)
              const dayEnd = addDays(dayStart, 1)
              const daySessions = sessions.filter(s => { const t = new Date(s.scheduledAt); return t >= dayStart && t < dayEnd })

              return (
                <div key={di} style={{ position: 'relative', borderRight: di < 6 ? '1px solid var(--border)' : undefined }}>
                  {HOURS.map(h => (
                    <div key={h} style={{ height: ROW_HEIGHT, borderBottom: '1px solid var(--border)', boxSizing: 'border-box' }} />
                  ))}
                  {daySessions.map(s => {
                    const st = blockStyle(s.status)
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelected(s)}
                        style={{
                          position: 'absolute',
                          top: blockTop(s.scheduledAt) + 1,
                          left: 3,
                          right: 3,
                          height: blockHeight(s.duration) - 2,
                          borderRadius: 6,
                          padding: '3px 6px',
                          fontSize: 10,
                          textAlign: 'right',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          fontWeight: 700,
                          zIndex: 1,
                          lineHeight: 1.3,
                          ...st,
                        }}
                      >
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName(s.user ?? s.consultant)}</div>
                        {blockHeight(s.duration) > 44 && (
                          <div style={{ opacity: 0.8, fontSize: 9 }}>{s.duration} {isAr ? 'د' : 'm'}</div>
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

      {modal}
    </div>
  )
}
