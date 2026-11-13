'use client'

import { useEffect, useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  BookOpen, Users, PlusCircle, Calendar, ArrowLeft, ChevronLeft, Shield, AlertTriangle, Hand,
  CheckCircle, Award, Bookmark, CreditCard, Settings,
  TrendingUp, DollarSign, BarChart2, Plus, Bell, CalendarClock, Clock, CheckCircle2,
} from 'lucide-react'
import { get, post } from '../../../lib/api'
import { unwrapData } from '../../../lib/unwrap'
import { getMediaUrl } from '../../../lib/media'
import { learnCoursesLink, learnCourseLink } from '../../../lib/learn-link'
import { AuthGate } from '../../components/AuthGate'
import { CHARACTERS } from '../../components/characters'
import { DashboardShell } from '../../components/DashboardShell'
import { CareerPathModal, type UserTrack } from '../../../components/dashboard/CareerPathModal'
import { CourseCard, type CourseCardCourse } from '../../components/CourseCard'
import { Skeleton } from '../../components/ui/Skeleton'
import VerifiedBadge from '../../../components/VerifiedBadge'
import { useToast } from '../../../lib/toast'
import { useAuthStore } from '../../../stores/authStore'
import { ErrorBoundary } from '../../../components/ErrorBoundary'
import { formatCoursePrice, formatMoney } from '../../../lib/market'

function parseSessionDate(raw: unknown): Date | null {
  if (!raw) return null
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw
  if (typeof raw === 'string') { const d = new Date(raw); return isNaN(d.getTime()) ? null : d }
  if (typeof raw === 'object' && (raw as any).$date) { const d = new Date((raw as any).$date); return isNaN(d.getTime()) ? null : d }
  return null
}

function displayTotal(items: any[], displayKey: string, rawTotal: number): string {
  const sample = items.find((item: any) => item[displayKey])?.[displayKey] ?? ''
  const isEGP = sample.includes('ج.م')
  if (isEGP) {
    const egpTotal = items.reduce((sum: number, item: any) => {
      const d = (item[displayKey] ?? '').replace(/[٠-٩]/g, (c: string) => String(c.charCodeAt(0) - 0x0660))
      return sum + (parseFloat(d.replace(/[^\d.]/g, '')) || 0)
    }, 0)
    return `${Math.round(egpTotal).toLocaleString('ar-EG')} ج.م`
  }
  return `${(rawTotal ?? 0).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`
}

/* ════════════════════════════════════════════════════════
   INSTRUCTOR OVERVIEW — PROFESSIONAL DESIGN
   ════════════════════════════════════════════════════════ */

function InstructorOverview() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const { user } = useAuthStore()

  const { data: stats } = useQuery({
    queryKey: ['instructor-stats'],
    queryFn: async () => {
      const res = await get('/courses/instructor/stats')
      const d = (res?.data as any)?.data ?? {}
      return { totalCourses: d.totalCourses ?? 0, totalStudents: d.totalStudents ?? 0, revenue: d.totalRevenue ?? 0, revenueDisplay: d.totalRevenueDisplay ?? null, completionRate: d.completionRate ?? 0 }
    },
  })

  const { data: courses = [] } = useQuery({
    queryKey: ['instructor-courses-preview'],
    queryFn: async () => {
      const res = await get('/courses/my-courses')
      const d = (res?.data as any)?.data ?? (res?.data as any)
      return Array.isArray(d) ? d.slice(0, 5) : []
    },
  })

  const firstName = user?.profile?.firstName || (isAr ? 'المحاضر' : 'Instructor')
  const arrow = { transform: isAr ? 'none' : 'rotate(180deg)' } as const
  const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`

  const statCards = [
    {
      Icon: TrendingUp, color: 'var(--primary)',
      label: isAr ? 'الكورسات' : 'Courses',
      value: stats?.totalCourses ?? courses?.length ?? 0,
      href: `/${locale}/dashboard/my-courses`,
    },
    {
      Icon: Users, color: 'var(--success)',
      label: isAr ? 'الطلاب' : 'Students',
      value: stats?.totalStudents ?? 0,
      href: `/${locale}/dashboard/my-courses`,
    },
    {
      Icon: DollarSign, color: 'var(--warning)',
      label: isAr ? 'الإيرادات' : 'Revenue',
      value: stats?.revenueDisplay ?? `${Number(stats?.revenue ?? 0).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`,
      href: `/${locale}/dashboard/revenue`,
    },
    {
      Icon: BarChart2, color: 'var(--info)',
      label: isAr ? 'معدل الإتمام' : 'Completion Rate',
      value: `${stats?.completionRate ?? 0}%`,
      href: `/${locale}/dashboard/analytics`,
    },
  ]

  const actions = [
    { Icon: Plus, label: isAr ? 'إنشاء كورس جديد' : 'Create New Course', href: `/${locale}/dashboard/create-course`, primary: true },
    { Icon: BookOpen, label: isAr ? 'كورساتي' : 'My Courses', href: `/${locale}/dashboard/my-courses`, primary: false },
    { Icon: DollarSign, label: isAr ? 'الإيرادات' : 'Revenue', href: `/${locale}/dashboard/revenue`, primary: false },
    { Icon: BarChart2, label: isAr ? 'الإحصائيات' : 'Analytics', href: `/${locale}/dashboard/analytics`, primary: false },
    { Icon: Settings, label: isAr ? 'الإعدادات' : 'Settings', href: `/${locale}/dashboard/settings`, primary: false },
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', width: '100%' }}>
      <style>{`
        .rd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .rd-main { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; }
        .rd-stat { transition: transform 0.15s ease, border-color 0.15s ease; }
        .rd-stat:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--primary) 35%, var(--line)); }
        .rd-row { transition: background 0.15s ease, border-color 0.15s ease; }
        a.rd-row:hover { background: color-mix(in srgb, var(--ink) 4%, transparent); border-color: color-mix(in srgb, var(--primary) 30%, var(--line)); }
        .rd-action { transition: border-color 0.15s ease, opacity 0.15s ease; }
        .rd-action:hover { border-color: color-mix(in srgb, var(--primary) 35%, var(--line)); }
        .rd-action.rd-primary:hover { opacity: 0.9; }
        @media (max-width: 900px) { .rd-stats { grid-template-columns: repeat(2, 1fr); } .rd-main { grid-template-columns: 1fr; } }
        @media (max-width: 520px) { .rd-stats { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 32, flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--primary)', marginBottom: 6 }}>
            {isAr ? 'لوحة تحكم المحاضر' : 'Instructor Dashboard'}
          </div>
          <h1 style={{ fontWeight: 900, fontSize: 26, lineHeight: 1.2, color: 'var(--ink)', margin: 0 }}>
            {isAr ? `مرحباً، ${firstName}` : `Welcome, ${firstName}`}
          </h1>
          <p style={{ fontWeight: 300, fontSize: 13, color: 'var(--ink-2)', margin: '4px 0 0' }}>
            {isAr ? 'إليك ملخص نشاطك اليوم' : "Here's your activity overview"}
          </p>
        </div>
        <a href={`/${locale}/dashboard/create-course`} className="rd-action rd-primary" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 10,
          background: 'var(--primary)', color: 'var(--primary-foreground)',
          fontWeight: 500, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          <Plus size={16} />
          {isAr ? 'إنشاء كورس' : 'New Course'}
        </a>
      </div>

      <div className="rd-stats">
        {statCards.map(({ Icon, color, label, value, href }) => (
          <a key={label} href={href} style={{ textDecoration: 'none', minWidth: 0 }}>
            <div className="rd-stat" style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 14, padding: '20px 20px 18px',
              display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: mix(color, 10),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} color={color} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 26, color: 'var(--ink)', lineHeight: 1.1, wordBreak: 'break-word' }}>
                  {value}
                </div>
                <div style={{ fontWeight: 300, fontSize: 12, color: 'var(--ink-2)', marginTop: 4 }}>
                  {label}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="rd-main">
        {/* Recent courses */}
        <section style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 16, padding: 24, minWidth: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontWeight: 500, fontSize: 16, color: 'var(--ink)', margin: 0 }}>
              {isAr ? 'آخر الكورسات' : 'Recent Courses'}
            </h2>
            <a href={`/${locale}/dashboard/my-courses`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontWeight: 300, fontSize: 13, color: 'var(--primary)', textDecoration: 'none',
            }}>
              {isAr ? 'عرض الكل' : 'View all'}
              <ChevronLeft size={14} style={arrow} />
            </a>
          </div>

          {courses.slice(0, 4).map((course: any) => {
            const thumb = getMediaUrl(course.thumbnail)
            const published = course.status === 'PUBLISHED'
            return (
              <a
                key={course.id}
                href={`/${locale}/dashboard/courses/${course.id}/manage`}
                className="rd-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, minWidth: 0,
                  padding: 12, borderRadius: 10, marginBottom: 10,
                  border: '1px solid var(--line)', textDecoration: 'none',
                }}
              >
                <div style={{
                  width: 56, height: 42, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                  background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {thumb
                    ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <BookOpen size={18} color="var(--ink-3)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 500, fontSize: 13, color: 'var(--ink)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {(isAr ? course.titleAr : course.titleEn) || course.titleAr || course.titleEn}
                  </div>
                  <div style={{ fontWeight: 300, fontSize: 11, color: 'var(--ink-2)', marginTop: 2 }}>
                    {course._count?.enrollments ?? 0}{isAr ? ' طالب' : ' students'} · {formatCoursePrice(course)}
                  </div>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, flexShrink: 0,
                  background: mix(published ? 'var(--success)' : 'var(--ink-3)', 12),
                  color: published ? 'var(--success)' : 'var(--ink-2)',
                }}>
                  {published ? (isAr ? 'منشور' : 'Live') : (isAr ? 'مسودة' : 'Draft')}
                </span>
              </a>
            )
          })}

          {courses.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-2)' }}>
              <BookOpen size={32} color="var(--ink-3)" style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ margin: 0, fontWeight: 300, fontSize: 13 }}>
                {isAr ? 'لا توجد كورسات بعد' : 'No courses yet'}
              </p>
            </div>
          )}
        </section>

        <aside style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 16, padding: 20, minWidth: 0,
        }}>
          <h2 style={{ fontWeight: 500, fontSize: 16, color: 'var(--ink)', margin: '0 0 16px' }}>
            {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
          </h2>
          {actions.map(({ Icon, label, href, primary }) => (
            <a
              key={label}
              href={href}
              className={primary ? 'rd-action rd-primary' : 'rd-action'}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 12px', borderRadius: 10, marginBottom: 8,
                border: primary ? 'none' : '1px solid var(--line)',
                background: primary ? 'var(--primary)' : 'var(--surface)',
                color: primary ? 'var(--primary-foreground)' : 'var(--ink)',
                textDecoration: 'none', fontWeight: primary ? 500 : 300, fontSize: 13,
              }}
            >
              <Icon size={16} color={primary ? 'var(--primary-foreground)' : 'var(--ink-3)'} />
              <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
              {!primary && <ChevronLeft size={14} color="var(--ink-3)" style={arrow} />}
            </a>
          ))}
        </aside>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   STUDENT OVERVIEW — ENHANCED
   ════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════
   BOOKING MODAL — same endpoints as /coaching and /coaching/[id]/book
   ════════════════════════════════════════════════════════ */

function mentorName(c: any): string {
  return `${c?.profile?.firstName || ''} ${c?.profile?.lastName || ''}`.trim() || c?.email || 'مرشد'
}

function BookingModal({ paths, initialIdx, onClose, onBooked }: {
  paths: any[]; initialIdx: number; onClose: () => void; onBooked: () => void
}) {
  const [tab, setTab] = useState(initialIdx)
  const [mentor, setMentor] = useState<any>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [dayKey, setDayKey] = useState<string | null>(null)
  const [topic, setTopic] = useState('')
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const path: any = paths[tab]
  const pathName: string = path ? (path.titleAr || path.titleEn || '') : ''

  const { data: mentors = [], isLoading: loadingMentors } = useQuery({
    queryKey: ['booking-modal-consultants'],
    queryFn: async () => {
      const res = await get('/consulting/consultants', { params: { limit: 50 } })
      const d = (res?.data as any)?.data
      return Array.isArray(d) ? d : []
    },
    staleTime: 60000,
  })

  // Mentors whose speciality / bio / areas mention the path title, slug or job titles
  const { matched, filtered } = useMemo(() => {
    const words = [
      path?.titleAr, path?.titleEn, ...(path?.jobTitlesAr ?? []), ...(path?.jobTitlesEn ?? []),
      ...String(path?.slug ?? '').split('-'),
    ]
      .map((w: any) => String(w ?? '').toLowerCase().trim())
      .filter((w: string) => w.length > 2)
    const list = (mentors as any[]).filter((c: any) => {
      const hay = [c.profile?.speciality, c.profile?.bio, ...(c.profile?.consultingAreas ?? [])].join(' ').toLowerCase()
      return words.some((w: string) => hay.includes(w))
    })
    return { matched: list.length > 0, filtered: list.length > 0 ? list : (mentors as any[]) }
  }, [mentors, path])

  const duration = Number(mentor?.profile?.sessionDuration ?? 60) || 60
  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['booking-modal-slots', mentor?.id, duration],
    queryFn: async () => {
      const from = new Date()
      const to = new Date(Date.now() + 7 * 86400000)
      const k = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const res = await get(`/consulting/consultants/${mentor.id}/slots`, { params: { from: k(from), to: k(to), duration } })
      const s = (res?.data as any)?.data?.slots
      return (Array.isArray(s) ? s : []).filter((x: any) => x.available && new Date(x.time).getTime() > Date.now())
    },
    enabled: !!mentor?.id,
    staleTime: 30000,
  })

  const pickTab = (i: number) => { setTab(i); setMentor(null); setSlot(null); setError(null) }

  const confirm = async () => {
    if (!mentor || !slot || booking) return
    const t = (topic.trim() || pathName || 'جلسة إرشادية')
    setBooking(true); setError(null)
    try {
      await post('/consulting/sessions/book', {
        consultantId: mentor.id, scheduledAt: slot, duration, topic: t, sessionName: t,
      })
      onBooked()
      onClose()
    } catch (e: any) {
      const m = e?.response?.data?.message
      setError((Array.isArray(m) ? m.join(' - ') : m) || 'تعذر حجز الجلسة، حاول مرة أخرى')
    } finally {
      setBooking(false)
    }
  }

  const dayKeyOf = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }
  const fmtDayTab = (iso: string) => new Date(iso).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' })
  const days: { key: string; label: string; slots: any[] }[] = []
  for (const s of slots as any[]) {
    const k = dayKeyOf(s.time)
    let g = days.find((x) => x.key === k)
    if (!g) { g = { key: k, label: fmtDayTab(s.time), slots: [] }; days.push(g) }
    g.slots.push(s)
  }
  const activeDay = days.find((x) => x.key === dayKey) ?? days[0]
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
  const canConfirm = !!mentor && !!slot && !booking

  return (
    <div className="book-overlay" onClick={onClose}>
      <div className="book-modal" dir="rtl" role="dialog" aria-modal="true" aria-label="احجز جلسة مع مرشد" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="book-close" onClick={onClose} aria-label="إغلاق">×</button>

        <div className="book-head">
          <span className="book-char" aria-hidden="true" dangerouslySetInnerHTML={{ __html: CHARACTERS.sa2 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3>احجز جلسة مع مرشد</h3>
            {pathName && <p>{pathName}</p>}
          </div>
        </div>

        {paths.length > 1 && (
          <div className="book-tabs" role="tablist">
            {paths.map((p: any, i: number) => (
              <button key={p.id ?? i} type="button" role="tab" aria-selected={i === tab} className={`book-tab${i === tab ? ' on' : ''}`} onClick={() => pickTab(i)}>
                {p.titleAr || p.titleEn}
              </button>
            ))}
          </div>
        )}

        {loadingMentors ? (
          <p className="book-note">جارٍ تحميل المرشدين...</p>
        ) : filtered.length === 0 ? (
          <p className="book-note">لا يوجد مرشدون متاحون حالياً</p>
        ) : (
          <>
            {!matched && <p className="book-note">لا يوجد مرشدون مطابقون لهذا المسار، عرض كل المرشدين</p>}
            <div className="mentor-grid">
              {filtered.map((c: any) => {
                const name = mentorName(c)
                const active = mentor?.id === c.id
                return (
                  <div key={c.id} role="button" tabIndex={0} className={`mentor-card${active ? ' on' : ''}`}
                    onClick={() => { setMentor(c); setSlot(null); setError(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMentor(c); setSlot(null); setError(null) } }}>
                    {c.profile?.avatar
                      ? <img src={c.profile.avatar} alt="" className="mentor-av" />
                      : <span className="mentor-av">{name[0]}</span>}
                    <span className="mentor-info">
                      <b>{name}</b>
                      <small>{c.profile?.speciality || 'إرشاد مهني'}</small>
                    </span>
                    <span className="mentor-pick">{active ? 'مختار' : 'اختر'}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {mentor && (
          <>
            <p className="book-section">المواعيد المتاحة</p>
            {loadingSlots ? (
              <p className="book-note">جارٍ تحميل المواعيد...</p>
            ) : slots.length === 0 ? (
              <p className="book-note">لا توجد مواعيد متاحة خلال الأسبوع القادم</p>
            ) : (
              <>
                <div className="book-tabs" role="tablist">
                  {days.map((d) => (
                    <button key={d.key} type="button" role="tab" aria-selected={d.key === activeDay?.key} className={`book-tab${d.key === activeDay?.key ? ' on' : ''}`} onClick={() => setDayKey(d.key)}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className="book-slots">
                  {(activeDay?.slots ?? []).map((s: any) => (
                    <button key={s.time} type="button" className={`slot-btn${slot === s.time ? ' on' : ''}`} onClick={() => setSlot(s.time)}>
                      <b>{fmtTime(s.time)}</b>
                    </button>
                  ))}
                </div>
              </>
            )}
            {slot && (
              <input className="book-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={`موضوع الجلسة (${pathName || 'جلسة إرشادية'})`} />
            )}
          </>
        )}

        {error && <p role="alert" className="book-error">{error}</p>}

        <button type="button" onClick={confirm} disabled={!canConfirm} className="book-confirm">
          {booking ? 'جارٍ الحجز...' : 'تأكيد الحجز'}
        </button>
      </div>
    </div>
  )
}

type DashboardData = {
  stats?: { enrolledCourses?: number; completedCourses?: number; certificatesEarned?: number }
  recommendedCourses?: CourseCardCourse[]
}

function StudentOverview() {
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const { user } = useAuthStore()
  const { toast } = useToast()

  const { data: statsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await get('/users/dashboard')
      const data = (res?.data as any)?.data ?? (res?.data as any)
      return unwrapData(data)
    },
    retry: 1, staleTime: 30000,
  })

  const { data: enrollmentData } = useQuery({
    queryKey: ['student-enrollments'],
    queryFn: async () => {
      // Same endpoint the student /dashboard/my-courses page uses
      const res = await get('/courses/enrolled')
      const raw = res?.data
      const d = (raw as any)?.data?.enrollments ?? (raw as any)?.data ?? raw ?? []
      return Array.isArray(d) ? d : (Array.isArray((d as any)?.courses) ? (d as any).courses : [])
    },
    enabled: !!user,
    retry: 1, staleTime: 30000,
  })

  const { data: certData } = useQuery({
    queryKey: ['student-certificates'],
    queryFn: async () => {
      const res = await get('/certificates/my')
      const d = (res?.data as any)?.data ?? (res?.data as any) ?? []
      return Array.isArray(d) ? d : []
    },
    enabled: !!user,
    retry: 1, staleTime: 30000,
  })

  // Payments: same endpoint as /dashboard/invoices (only the latest item + summary are used)
  const { data: paymentsData } = useQuery({
    queryKey: ['dash-payments'],
    queryFn: async () => {
      const res = await get('/payments/my/invoices', { params: { page: 1, limit: 1 } })
      const body = (res?.data as any)?.data ?? (res?.data as any) ?? {}
      return {
        last: Array.isArray(body.items) ? body.items[0] ?? null : null,
        total: Number(body.total ?? 0) || 0,
        totalSpent: body.summary?.totalSpent ?? null,
      }
    },
    enabled: !!user,
    retry: 1, staleTime: 30000,
  })

  // Sessions: same endpoint/cache key as /dashboard/my-sessions
  const { data: sessionsData } = useQuery({
    queryKey: ['my-sessions'],
    queryFn: async () => {
      const r = await get('/consulting/sessions')
      const data = r.data?.data
      return { mySessions: data?.mySessions ?? [], clientSessions: data?.clientSessions ?? [] }
    },
    enabled: !!user,
    retry: 1, staleTime: 30000,
  })

  // Career paths: same endpoints as /dashboard/career-path
  const { data: allPaths = [] } = useQuery({
    queryKey: ['dash-career-paths'],
    queryFn: async () => {
      const res = await get('/career/paths')
      const d = (res?.data as any)
      const arr = d?.data?.careerPaths ?? d?.data ?? d ?? []
      return Array.isArray(arr) ? arr : []
    },
    retry: 1, staleTime: 5 * 60 * 1000,
  })

  const { data: myPathIds = [] } = useQuery({
    queryKey: ['dash-my-path-ids'],
    queryFn: async () => {
      const res = await get('/career/paths/my')
      const d = (res?.data as any)
      const paths = d?.data?.paths ?? d?.data ?? []
      return Array.isArray(paths)
        ? (paths.map((p: any) => p.careerPathId ?? p.pathId ?? p.id).filter(Boolean) as string[])
        : []
    },
    enabled: !!user,
    retry: 1, staleTime: 30000,
  })

  const selectedPaths: any[] = allPaths.filter((p: any) => myPathIds.includes(p.id) || myPathIds.includes(p.slug))
  const [pathIdx, setPathIdx] = useState(0)
  const [showAllEnrolled, setShowAllEnrolled] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [careerPathOpen, setCareerPathOpen] = useState(false)
  const queryClient = useQueryClient()
  const safePathIdx = selectedPaths.length ? ((pathIdx % selectedPaths.length) + selectedPaths.length) % selectedPaths.length : 0
  const selectedPathRaw: any = selectedPaths[safePathIdx]

  const { data: pathCoursesData = [] } = useQuery({
    queryKey: ['dash-path-courses', selectedPathRaw?.slug, locale],
    queryFn: async () => {
      const res = await get('/courses', {
        params: { page: 1, limit: 100, language: locale === 'ar' ? 'ar' : 'en', careerPath: selectedPathRaw.slug },
      })
      const d = (res?.data as any)
      const arr = d?.data?.courses ?? d?.data ?? d ?? []
      return Array.isArray(arr) ? arr : []
    },
    enabled: !!selectedPathRaw?.slug,
    retry: 1, staleTime: 60000,
  })

  const enrollments = enrollmentData ?? []
  const certificates = certData ?? []
  const studentStats = statsData?.stats
  const mySessions: any[] = sessionsData?.mySessions ?? []

  // /auth/me does not return gender; /users/profile returns the full profile row
  const { data: fullProfile } = useQuery({
    queryKey: ['dash-full-profile'],
    queryFn: async () => {
      const res = await get('/users/profile')
      const d = (res?.data as any)?.data?.profile ?? {}
      return (d.profile ?? d) as { gender?: string | null; avatar?: string | null }
    },
    enabled: !!user,
    retry: 1, staleTime: 5 * 60 * 1000,
  })

  const [rasheedResult, setRasheedResult] = useState<{ topCareers: { name: string; nameEn: string; match: number }[] } | null>(null)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('rasheed_quiz_result')
      if (raw) setRasheedResult(JSON.parse(raw))
    } catch {}
  }, [])

  if (isLoading) {
    return (
      <DashboardShell title={isAr ? 'الملخص' : 'Overview'} subtitle="">
        <div className="space-y-6" aria-busy="true" aria-label={isAr ? 'جارٍ التحميل' : 'Loading'}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <div className="skeleton-shimmer mb-3 h-3 w-16 rounded" />
                <div className="skeleton-shimmer mb-2 h-7 w-24 rounded" />
                <div className="skeleton-shimmer h-3 w-20 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-64 rounded-2xl p-5 lg:col-span-2" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
              <div className="skeleton-shimmer mb-4 h-4 w-32 rounded" />
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="mb-3 flex items-center gap-3">
                  <div className="skeleton-shimmer h-10 w-10 flex-shrink-0 rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton-shimmer mb-2 h-3 w-3/4 rounded" />
                    <div className="skeleton-shimmer h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-64 rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
              <div className="skeleton-shimmer mb-4 h-4 w-24 rounded" />
              <div className="skeleton-shimmer mx-auto mb-4 h-32 w-32 rounded-full" />
              <div className="skeleton-shimmer mx-auto mb-2 h-3 w-3/4 rounded" />
              <div className="skeleton-shimmer mx-auto h-3 w-1/2 rounded" />
            </div>
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (isError) {
    return (
      <DashboardShell title={isAr ? 'الملخص' : 'Overview'} subtitle={isAr ? 'حدث خطأ' : 'Something went wrong'}>
        <div style={{ textAlign:'center', padding:'3rem 2rem',
          border:'1px solid var(--line)', borderRadius:'16px',
          background:'var(--surface)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="var(--error)" strokeWidth="2" strokeLinecap="round"
            style={{ margin:'0 auto 1rem', display:'block', opacity:0.5 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p style={{ fontSize:'0.9rem', color:'var(--ink-3)', marginBottom:'1rem' }}>
            {isAr ? 'فشل تحميل البيانات' : 'Failed to load data'}
          </p>
          <button onClick={() => refetch()} style={{
            padding:'10px 22px', borderRadius:'10px',
            background:'var(--primary)', color:'var(--primary-foreground)',
            border:'none', fontSize:'0.875rem', fontWeight:500, cursor:'pointer',
          }}>
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      </DashboardShell>
    )
  }

  const firstName = isAr
    ? (user?.profile?.firstName || 'الطالب')
    : (user?.profile?.firstName || 'Student')
  const progressOf = (e: any): number => Number(e.progress ?? e.enrollment?.progress ?? 0) || 0
  const courseOf = (e: any) => e.course || e
  const titleOf = (c: any): string =>
    (isAr ? (c?.titleAr || c?.title) : (c?.titleEn || c?.title)) || (isAr ? 'كورس' : 'Course')
  const completedCount = enrollments.filter((e: any) => progressOf(e) >= 100).length || studentStats?.completedCourses || 0
  const certificatesCount = certificates.length || studentStats?.certificatesEarned || 0

  const userName = user?.profile?.firstName || user?.email?.split('@')[0] || ''
  const avatarUrl: string | null = user?.profile?.avatar || fullProfile?.avatar || null
  const gender = String(fullProfile?.gender ?? '').toUpperCase()

  const progressForEnrollment = (e: any): number => {
    const p = progressOf(e)
    if (p > 0) return p
    return e?.totalLessons > 0 ? ((e.completedLessons ?? 0) / e.totalLessons) * 100 : 0
  }
  const enrollmentFor = (c: any) =>
    enrollments.find((e: any) => e.courseId === c.id || courseOf(e)?.id === c.id || e.id === c.id)

  const selectedPath: any = selectedPathRaw
    ? {
        name: (isAr ? selectedPathRaw.titleAr : selectedPathRaw.titleEn) || selectedPathRaw.titleEn || selectedPathRaw.titleAr || '',
        roles: (isAr ? selectedPathRaw.jobTitlesAr : selectedPathRaw.jobTitlesEn) ?? [],
        courses: pathCoursesData.map((c: any) => ({ id: c.id, name: titleOf(c) })),
      }
    : null

  const now = Date.now()
  const upcomingSession: any = [...mySessions]
    .filter((s: any) => ['CONFIRMED', 'IN_PROGRESS'].includes(s.status) && (s.status === 'IN_PROGRESS' || (parseSessionDate(s.scheduledAt)?.getTime() ?? 0) >= now))
    .sort((x: any, y: any) => (parseSessionDate(x.scheduledAt)?.getTime() ?? 0) - (parseSessionDate(y.scheduledAt)?.getTime() ?? 0))[0]
  const upcomingDate = parseSessionDate(upcomingSession?.scheduledAt)
  const upcomingMentor = `${upcomingSession?.consultant?.profile?.firstName || ''} ${upcomingSession?.consultant?.profile?.lastName || ''}`.trim()
  const completedSessionsCount = mySessions.filter((s: any) => s.status === 'COMPLETED').length
  const countBy = (statuses: string[]) => mySessions.filter((x: any) => statuses.includes(x.status)).length
  const upcomingCount = countBy(['CONFIRMED', 'IN_PROGRESS'])
  const pendingCount = countBy(['PENDING', 'PENDING_APPROVAL', 'AWAITING_PAYMENT', 'RESCHEDULE_REQUESTED'])
  const dateLocale = isAr ? 'ar-EG' : 'en-US'

  const userTracks: UserTrack[] = selectedPaths.map((p: any) => ({
    id: p.id,
    slug: p.slug,
    name: (isAr ? p.titleAr : p.titleEn) || p.titleEn || p.titleAr || '',
    description: (isAr ? p.descriptionAr : p.descriptionEn) || '',
    roles: (isAr ? p.jobTitlesAr : p.jobTitlesEn) ?? [],
    skills: p.skills ?? [],
    salaryRange: isAr ? p.salaryRangeAr : p.salaryRangeEn,
    progress: 0,
  }))
  const enrolledProgress: Record<string, number> = {}
  for (const e of enrollments) {
    const cid = courseOf(e)?.id
    if (cid) enrolledProgress[cid] = progressForEnrollment(e)
  }

  const OpenArrow = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isAr ? 'scaleX(-1)' : 'none' }} aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
  )
  const PlayIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 5v14l11-7Z"/></svg>
  )
  const Check = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>
  )

  return (
    <div className="dw-dash-wrap dw2-dash-wrap">

      {/* HEADER */}
      <div className="dw-dash-head">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="dw2-char-av dw2-char-photo" />
        ) : gender === 'FEMALE' || gender === 'MALE' ? (
          <span className="dw2-char-av" aria-hidden="true" dangerouslySetInnerHTML={{ __html: gender === 'FEMALE' ? CHARACTERS.sa2 : CHARACTERS.eg1 }} />
        ) : (
          <span className="dw2-char-av dw2-char-letter" aria-hidden="true">{userName?.[0]?.toUpperCase() ?? '?'}</span>
        )}
        <div className="dw2-grow">
          <p style={{ margin: '0 0 2px', fontSize: '13px', color: 'var(--ink-3)' }}>مرحباً بعودتك</p>
          <h1>{userName}</h1>
        </div>
      </div>

      <div className="dw2-dash-body">
        <div className="dw2-dash-right">
        <div className="dw-card dw2-card">
          <div className="dw-card-h">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            <h2 style={{ flex: 1 }}>المسار المهني</h2>
            {selectedPaths.length > 1 && (
              <div className="dw2-pager" role="group" aria-label="التنقل بين المسارات">
                <button type="button" onClick={() => setPathIdx(safePathIdx - 1)} aria-label="المسار السابق"><ChevronLeft size={14} style={{ transform: 'scaleX(-1)' }} /></button>
                <span>{safePathIdx + 1} / {selectedPaths.length}</span>
                <button type="button" onClick={() => setPathIdx(safePathIdx + 1)} aria-label="المسار التالي"><ChevronLeft size={14} /></button>
              </div>
            )}
            {selectedPaths.length > 1 && <span className="dw3-count-badge">لديك {selectedPaths.length} مسارات</span>}
            <button type="button" className="dw-open-btn" onClick={() => setCareerPathOpen(true)}>
              فتح المسار المهني
              <OpenArrow />
            </button>
          </div>

          {selectedPath ? (() => {
            const pathCourses: any[] = selectedPath.courses ?? []
            const done = pathCourses.filter((c: any) => {
              const e = enrollmentFor(c)
              return e && progressForEnrollment(e) >= 100
            }).length
            const pct = pathCourses.length > 0 ? Math.round((done / pathCourses.length) * 100) : 0
            return (
              <>
                <div className="dw-rec">
                  <span className="dw-big-ring">
                    <svg className="ring-svg" viewBox="0 0 132 132" style={{ width: '132px', height: '132px' }}>
                      <defs>
                        <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0" stopColor="#5414F6"/>
                          <stop offset="1" stopColor="#BF78FB"/>
                        </linearGradient>
                      </defs>
                      <circle className="bg" cx="66" cy="66" r="60" style={{ strokeWidth: 12 }}/>
                      <circle className="fg" cx="66" cy="66" r="60" style={{
                        strokeWidth: 12,
                        stroke: 'url(#rg)',
                        strokeDasharray: 376.99,
                        strokeDashoffset: 376.99 - (376.99 * pct / 100),
                      }}/>
                    </svg>
                    <b>{pct}%</b>
                    <small>اكتملت</small>
                  </span>
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800 }}>{selectedPath.name}</h3>
                    <p className="dw-muted">{(selectedPath.roles ?? []).slice(0, 3).join(' · ')}</p>
                    <div style={{ marginTop: '14px' }}>
                      <button type="button" onClick={() => setCareerPathOpen(true)} className="dw-btn dw-btn-primary dw-btn-sm">
                        تابع
                        <OpenArrow />
                      </button>
                    </div>
                  </div>
                </div>
                {/* Section 1: every course the student is enrolled in for this path */}
                <p className="dw-section-label">الكورسات المشترك فيها</p>
                {(() => {
                  // Same source as /dashboard/my-courses (/courses/enrolled); not filtered by path
                  const enrolledCourses = enrollments
                    .map((e: any) => ({ e, c: courseOf(e) }))
                    .filter(({ c }: any) => c && c.id)
                  if (enrolledCourses.length === 0) {
                    return (
                      <p style={{ fontSize: '13px', color: 'var(--ink-3)', padding: '8px 4px' }}>
                        لم تبدأ أي كورس بعد
                      </p>
                    )
                  }
                  const visibleEnrolled = showAllEnrolled ? enrolledCourses : enrolledCourses.slice(0, 3)
                  return (
                    <>
                    <div className="dw-clist" style={{ marginTop: 0 }}>
                      {visibleEnrolled.map(({ e, c: course }: any, i: number) => {
                        const c = { id: course.id, name: titleOf(course) }
                        const prog = progressForEnrollment(e)
                        const isDone = prog >= 100
                        const isDoing = !isDone && prog > 0
                        return (
                          <a key={c.id ?? i} href={c.id ? learnCourseLink(c.id, locale) : `/${locale}/dashboard/my-courses`} className={`dw-crow ${isDone ? 'done' : isDoing ? 'doing' : 'todo'}`}>
                            <span className="dw-dot">
                              {isDone ? <Check size={14} /> : isDoing ? <PlayIcon /> : i + 1}
                            </span>
                            <span className="dw-crow-info">
                              <h4>{c.name}</h4>
                              <small>{isDoing && <span className="dw-mini-prog"><span style={{ width: `${prog}%` }}/></span>}</small>
                            </span>
                            <span className={`dw-status ${isDone ? 'done' : isDoing ? 'doing' : 'todo'}`}>
                              {isDone ? 'مكتمل' : isDoing ? 'قيد التقدّم' : 'مشترك'}
                            </span>
                          </a>
                        )
                      })}
                    </div>
                    {enrolledCourses.length > 3 && (
                      <button
                        type="button"
                        className="dw-btn dw-btn-ghost dw-btn-sm"
                        style={{ marginTop: '10px' }}
                        onClick={() => setShowAllEnrolled((v) => !v)}
                      >
                        {showAllEnrolled ? 'عرض أقل' : `عرض المزيد (${enrolledCourses.length})`}
                      </button>
                    )}
                    </>
                  )
                })()}

                {/* Section 2: all courses of this path, enrolled or not */}
                <p className="dw-section-label" style={{ marginTop: '20px' }}>كورسات المسار</p>
                {pathCourses.length === 0 ? (
                  <div className="dw2-empty-courses">
                    <p>لا توجد كورسات مرتبطة بهذا المسار بعد.</p>
                    <a href={learnCoursesLink(locale)} className="dw-btn dw-btn-primary dw-btn-sm">تصفح كل الكورسات</a>
                  </div>
                ) : (
                  <div className="dw-clist dw2-scroll" style={{ marginTop: 0 }}>
                    {pathCourses.map((c: any, i: number) => {
                      const isEnrolled = !!enrollmentFor(c)
                      return (
                        <a key={c.id ?? i} href={c.id ? learnCourseLink(c.id, locale) : `/${locale}/dashboard/career-path`} className={`dw-crow ${isEnrolled ? 'doing' : 'todo'}`}>
                          <span className="dw-dot">{i + 1}</span>
                          <span className="dw-crow-info"><h4>{c.name}</h4></span>
                          <span className={`dw-status ${isEnrolled ? 'doing' : 'todo'}`}>
                            {isEnrolled ? 'مشترك' : 'متاح'}
                          </span>
                        </a>
                      )
                    })}
                  </div>
                )}
              </>
            )
          })() : (
            <div className="dw-empty-state">
              <p>لم تختر مساراً مهنياً بعد</p>
              <Link href={`/${locale}/dashboard/career-path`} className="dw-btn dw-btn-primary dw-btn-sm">
                اختر مسارك →
              </Link>
            </div>
          )}
        </div>
        </div>
        <div className="dw2-dash-left">

          {/* === DARK SESSION CARD (real data from /consulting/sessions) === */}
          <div className="dw-card dw2-card dw-live-card">
            <div className="dw-card-h">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>
              </svg>
              <h3>الجلسة المباشرة القادمة</h3>
              {upcomingSession && <span className="dw-live-dot"/>}
            </div>

            {upcomingSession ? (
              <>
                {upcomingDate && (
                  <p className="dw-lc-when">
                    {upcomingDate.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long' })}
                    {' · '}
                    {upcomingDate.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                <p className="dw-lc-sub">
                  {upcomingSession.topic ?? upcomingSession.sessionName ?? 'جلسة إرشادية'}
                </p>
                {upcomingMentor && (
                  <div className="dw2-lc-host">
                    {upcomingSession?.consultant?.profile?.avatar
                      ? <img src={upcomingSession.consultant.profile.avatar} alt="" className="dw2-av" />
                      : <span className="dw2-av">{upcomingMentor[0]}</span>}
                    <span className="dw2-host-name">{upcomingMentor}</span>
                  </div>
                )}
                <Link
                  href={upcomingSession.status === 'IN_PROGRESS'
                    ? `/${locale}/dashboard/consulting/${upcomingSession.id}/go-live`
                    : `/${locale}/dashboard/my-sessions`}
                  className="dw-btn dw-btn-light dw-btn-sm dw-btn-block"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 5v14l11-7Z"/>
                  </svg>
                  {upcomingSession.status === 'IN_PROGRESS' ? 'انضم إلى الجلسة' : 'تفاصيل الجلسة'}
                </Link>
                {upcomingCount > 1 && (
                  <Link href={`/${locale}/dashboard/my-sessions`} className="dw2-lc-more">
                    +{upcomingCount - 1} جلسات قادمة أخرى
                  </Link>
                )}
              </>
            ) : pendingCount > 0 ? (
              <>
                <p className="dw-lc-sub" style={{ marginBottom: '14px' }}>
                  لديك {pendingCount} {pendingCount === 1 ? 'جلسة' : 'جلسات'} بانتظار الموافقة أو الدفع
                </p>
                <Link href={`/${locale}/dashboard/my-sessions`} className="dw-btn dw-btn-light dw-btn-sm dw-btn-block">
                  عرض جلساتي
                </Link>
              </>
            ) : (
              <>
                <p className="dw-lc-sub" style={{ marginBottom: '14px' }}>
                  لا توجد جلسات قادمة
                </p>
                <Link href={`/${locale}/coaching`} className="dw-btn dw-btn-light dw-btn-sm dw-btn-block">
                  احجز جلستك الأولى
                </Link>
              </>
            )}
          </div>

          {/* === MENTOR SUPPORT CARD (real counts from the same sessions query) === */}
          <div className="dw-card dw2-card">
            <div className="dw-card-h">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <h3>دعم المرشدين</h3>
            </div>

            <Link href={`/${locale}/dashboard/my-sessions`} className="dw2-stats" aria-label="جلساتي">
              <span className="dw3-stat"><CalendarClock size={18} aria-hidden="true" /><b>{upcomingCount}</b><small>قادمة</small></span>
              <span className={`dw3-stat${pendingCount > 0 ? ' warn' : ''}`}><Clock size={18} aria-hidden="true" /><b>{pendingCount}</b><small>بانتظار الموافقة</small></span>
              <span className="dw3-stat good"><CheckCircle2 size={18} aria-hidden="true" /><b>{completedSessionsCount}</b><small>مكتملة</small></span>
            </Link>

            <button type="button" onClick={() => setBookingOpen(true)} className="dw-btn dw-btn-ghost dw-btn-sm dw-btn-block">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 5h16v16H4zM4 10h16M8 3v4M16 3v4"/>
              </svg>
              احجز جلسة جديدة
            </button>

            <Link href={`/${locale}/dashboard/my-sessions`} className="dw-link-sm">
              عرض كل جلساتي
            </Link>
          </div>
        </div>
      </div>

      <div className="dw2-dash-row2">
        <div className="dw-card dw2-card">
          <div className="dw-card-h">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <h3>ترشيحات رشيد</h3>
          </div>
          {rasheedResult?.topCareers?.length ? (
            <div className="dw-clist" style={{ marginTop: 0 }}>
              {rasheedResult.topCareers.slice(0, 3).map((c, k) => (
                <Link key={k} href={`/${locale}/dashboard/career-path`} className="dw-crow">
                  <span className="dw-dot">{k + 1}</span>
                  <span className="dw-crow-info">
                    <h4>{isAr ? c.name : (c.nameEn || c.name)}</h4>
                    <small>{c.match}% توافق</small>
                  </span>
                  <OpenArrow />
                </Link>
              ))}
            </div>
          ) : (
            <>
              <p style={{ margin: '0 0 20px', fontSize: '14px', color: 'var(--ink-2)', lineHeight: 1.7 }}>
                يحلّل مهاراتك ويرشدك لأفضل مسار مهني مناسب لك.
              </p>
              <Link href={`/${locale}/dashboard/ai-chat`} className="dw-btn dw-btn-primary dw-btn-sm dw-btn-block">
                ابدأ التقييم المجاني
              </Link>
            </>
          )}
        </div>

        <div className="dw-card dw2-card">
          <div className="dw-card-h">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>
            <h3>المحطات</h3>
          </div>
          <ol className="dw-ms">
            {(() => {
              const steps = [
                { label: 'إنشاء حسابك', done: true },
                { label: 'اختيار مسارك المهني', done: selectedPaths.length > 0 },
                { label: 'إكمال أول كورس', done: (completedCount ?? 0) > 0 },
                { label: 'حجز جلسة مع مرشد', done: (completedSessionsCount ?? 0) > 0 },
                { label: 'الحصول على شهادتك الأولى', done: (certificatesCount ?? 0) > 0 },
              ]
              const current = steps.findIndex((x) => !x.done)
              return steps.map((s, i) => (
                <li key={i} className={s.done ? 'done' : i === current ? 'doing' : ''}>
                  <span className="dw-m-dot">{s.done ? <Check size={13} /> : i + 1}</span>
                  <span>{s.label}</span>
                </li>
              ))
            })()}
          </ol>
        </div>
      </div>

      <div className="dw2-dash-row2">
        <div className="dw-card dw2-card">
          <div className="dw-card-h">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 2v20l3-2 2 2 3-2 3 2 2-2 3 2V2l-3 2-2-2-3 2-3-2-2 2z"/><path d="M8 8h8M8 12h8"/></svg>
            <h3>المدفوعات</h3>
          </div>
          {paymentsData?.last ? (
            <>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--ink-3)' }}>آخر عملية دفع</p>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700 }}>{paymentsData.last.itemName}</p>
              <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--ink-2)' }}>
                {formatMoney(paymentsData.last.amount)}
                {' · '}
                {new Date(paymentsData.last.date).toLocaleDateString('ar-EG-u-ca-gregory', { year: 'numeric', month: 'short', day: 'numeric' })}
                {paymentsData.total > 1 ? ` · ${paymentsData.total} عمليات` : ''}
              </p>
              <Link href={`/${locale}/dashboard/invoices`} className="dw-btn dw-btn-ghost dw-btn-sm dw-btn-block">
                عرض سجل المدفوعات
              </Link>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 14px', fontSize: '14px', color: 'var(--ink-2)', lineHeight: 1.7 }}>
                لا توجد مدفوعات بعد
              </p>
              <Link href={`/${locale}/dashboard/invoices`} className="dw-btn dw-btn-ghost dw-btn-sm dw-btn-block">
                سجل المدفوعات
              </Link>
            </>
          )}
        </div>

        <div className="dw-card dw2-card">
          <div className="dw-card-h">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5"/></svg>
            <h3>شهاداتي</h3>
          </div>
          {certificatesCount > 0 ? (
            <>
              <p style={{ margin: '0 0 14px', fontSize: '14px', color: 'var(--ink-2)', lineHeight: 1.7 }}>
                حصلت على <b style={{ color: 'var(--ink)', fontSize: '20px' }}>{certificatesCount}</b> {certificatesCount === 1 ? 'شهادة' : 'شهادات'}
              </p>
              <Link href={`/${locale}/dashboard/certificates`} className="dw-btn dw-btn-ghost dw-btn-sm dw-btn-block">
                عرض شهاداتي
              </Link>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 14px', fontSize: '14px', color: 'var(--ink-2)', lineHeight: 1.7 }}>
                لم تحصل على شهادات بعد
              </p>
              <Link href={`/${locale}/dashboard/my-courses`} className="dw-btn dw-btn-primary dw-btn-sm dw-btn-block">
                اكمل أول كورس
              </Link>
            </>
          )}
        </div>
      </div>

      <CareerPathModal
        isOpen={careerPathOpen}
        onClose={() => setCareerPathOpen(false)}
        tracks={userTracks}
        enrolledProgress={enrolledProgress}
        continueHref={`/${locale}/dashboard/my-courses`}
      />

      {bookingOpen && (
        <BookingModal
          paths={selectedPaths}
          initialIdx={safePathIdx}
          onClose={() => setBookingOpen(false)}
          onBooked={() => { queryClient.invalidateQueries({ queryKey: ['my-sessions'] }) }}
        />
      )}
    </div>
  )
}


/* Stat Component — Enhanced */
function Stat({ 
  label, 
  value, 
  icon, 
  color = 'from-primary to-violet-600',
  delay = 0 
}: { 
  label: string; 
  value: number; 
  icon?: React.ReactNode;
  color?: string;
  delay?: number;
}) {
  return (
    <div 
      className={`rounded-2xl p-4 md:p-6 border border-[var(--line)] bg-surface shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-up stagger-${delay + 1}`}
    >
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-md`}>
        {icon || <BookOpen className="h-5 w-5 text-white" />}
      </div>
      <p className="text-xs font-medium text-[var(--ink-2)] uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl md:text-3xl font-medium text-[var(--ink)]" style={{ fontFamily: 'var(--font-ui)' }}>
        {value}
      </p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   CONSULTANT OVERVIEW — PROFESSIONAL REDESIGN
   ════════════════════════════════════════════════════════ */

function ConsultantOverview() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const { user } = useAuthStore()

  const { data: sessions = [] } = useQuery({
    queryKey: ['consultant-sessions'],
    queryFn: async () => {
      try {
        const res = await get('/coaching/consulting/my-sessions')
        const d = (res?.data as any)?.data ?? (res?.data as any)
        return Array.isArray(d) ? d : []
      } catch { return [] }
    },
  })

  const pending = (sessions as any[]).filter((s: any) => s.status === 'PENDING' || s.status === 'PENDING_APPROVAL')
  const confirmed = (sessions as any[]).filter((s: any) => s.status === 'CONFIRMED')
  const completed = (sessions as any[]).filter((s: any) => s.status === 'COMPLETED')
  const totalRevenue = completed.reduce((sum: number, s: any) => sum + (s.price || 0), 0)
  const upcomingStatuses = ['CONFIRMED', 'SCHEDULED', 'RESCHEDULE_REQUESTED']
  const upcomingSessions = (sessions as any[]).filter((s: any) =>
    upcomingStatuses.includes(s.status) &&
    s.paymentStatus === 'PAID' &&
    s.status !== 'CANCELLED' &&
    s.status !== 'COMPLETED'
  )

  const firstName = user?.profile?.firstName || (isAr ? 'المرشد' : 'Coach')
  const arrow = { transform: isAr ? 'none' : 'rotate(180deg)' } as const
  const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`

  const statCards = [
    {
      Icon: Bell, color: 'var(--primary)',
      label: isAr ? 'طلبات جديدة' : 'New Requests',
      value: pending.length,
      href: `/${locale}/dashboard/client-sessions`,
    },
    {
      Icon: Calendar, color: 'var(--info)',
      label: isAr ? 'جلسات مؤكدة' : 'Confirmed',
      value: confirmed.length,
      href: `/${locale}/dashboard/my-sessions`,
    },
    {
      Icon: CheckCircle, color: 'var(--success)',
      label: isAr ? 'جلسات مكتملة' : 'Completed',
      value: completed.length,
      href: `/${locale}/dashboard/my-sessions`,
    },
    {
      Icon: DollarSign, color: 'var(--warning)',
      label: isAr ? 'الإيرادات' : 'Revenue',
      value: displayTotal(completed, 'priceDisplay', totalRevenue),
      href: `/${locale}/dashboard/revenue`,
    },
  ]

  const actions = [
    { Icon: Calendar, label: isAr ? 'إدارة الجلسات' : 'Manage Sessions', href: `/${locale}/dashboard/my-sessions`, primary: true },
    { Icon: Users, label: isAr ? 'طلبات العملاء' : 'Client Requests', href: `/${locale}/dashboard/client-sessions`, primary: false },
    { Icon: DollarSign, label: isAr ? 'الإيرادات' : 'Revenue', href: `/${locale}/dashboard/revenue`, primary: false },
    { Icon: Settings, label: isAr ? 'الإعدادات' : 'Settings', href: `/${locale}/dashboard/settings`, primary: false },
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', width: '100%' }}>
      <style>{`
        .rd-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .rd-main { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; }
        .rd-stat { transition: transform 0.15s ease, border-color 0.15s ease; }
        .rd-stat:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--primary) 35%, var(--line)); }
        .rd-row { transition: background 0.15s ease, border-color 0.15s ease; }
        a.rd-row:hover { background: color-mix(in srgb, var(--ink) 4%, transparent); border-color: color-mix(in srgb, var(--primary) 30%, var(--line)); }
        .rd-action { transition: border-color 0.15s ease, opacity 0.15s ease; }
        .rd-action:hover { border-color: color-mix(in srgb, var(--primary) 35%, var(--line)); }
        .rd-action.rd-primary:hover { opacity: 0.9; }
        @media (max-width: 900px) { .rd-stats { grid-template-columns: repeat(2, 1fr); } .rd-main { grid-template-columns: 1fr; } }
        @media (max-width: 520px) { .rd-stats { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 32, flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--primary)', marginBottom: 6 }}>
            {isAr ? 'لوحة تحكم المرشد' : 'Coach Dashboard'}
          </div>
          <h1 style={{ fontWeight: 900, fontSize: 26, lineHeight: 1.2, color: 'var(--ink)', margin: 0 }}>
            {isAr ? `مرحباً، ${firstName}` : `Welcome, ${firstName}`}
          </h1>
          <p style={{ fontWeight: 300, fontSize: 13, color: 'var(--ink-2)', margin: '4px 0 0' }}>
            {isAr ? 'تابع جلساتك واستشاراتك' : 'Track your sessions and consultations'}
          </p>
        </div>
        <a href={`/${locale}/dashboard/my-sessions`} className="rd-action" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 10,
          border: '1.5px solid var(--primary)', color: 'var(--primary)',
          fontWeight: 500, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          {isAr ? 'إدارة الجلسات' : 'Manage Sessions'}
          <ChevronLeft size={16} style={arrow} />
        </a>
      </div>

      <div className="rd-stats">
        {statCards.map(({ Icon, color, label, value, href }) => (
          <a key={label} href={href} style={{ textDecoration: 'none', minWidth: 0 }}>
            <div className="rd-stat" style={{
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 14, padding: '20px 20px 18px',
              display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: mix(color, 10),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} color={color} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 26, color: 'var(--ink)', lineHeight: 1.1, wordBreak: 'break-word' }}>
                  {value}
                </div>
                <div style={{ fontWeight: 300, fontSize: 12, color: 'var(--ink-2)', marginTop: 4 }}>
                  {label}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="rd-main">
        {/* Upcoming sessions */}
        <section style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 16, padding: 24, minWidth: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontWeight: 500, fontSize: 16, color: 'var(--ink)', margin: 0 }}>
              {isAr ? 'الجلسات القادمة' : 'Upcoming Sessions'}
            </h2>
            <a href={`/${locale}/dashboard/my-sessions`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontWeight: 300, fontSize: 13, color: 'var(--primary)', textDecoration: 'none',
            }}>
              {isAr ? 'عرض الكل' : 'View all'}
              <ChevronLeft size={14} style={arrow} />
            </a>
          </div>

          {upcomingSessions.length > 0 ? (
            upcomingSessions.slice(0, 4).map((session: any, i: number) => {
              const d = parseSessionDate(session.scheduledAt)
              const clientName = session.sessionName || session.user?.profile?.firstName || (isAr ? 'جلسة' : 'Session')
              return (
                <div key={session.id || i} className="rd-row" style={{
                  display: 'flex', alignItems: 'center', gap: 14, minWidth: 0,
                  padding: '14px 16px', borderRadius: 12, marginBottom: 10,
                  border: '1px solid var(--line)', background: 'var(--surface)',
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: mix('var(--primary)', 15),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 500, fontSize: 14, color: 'var(--primary)',
                  }}>
                    {session.user?.profile?.firstName?.[0] || (isAr ? 'ع' : 'C')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 500, fontSize: 13, color: 'var(--ink)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {clientName}
                    </div>
                    <div style={{ fontWeight: 300, fontSize: 11, color: 'var(--ink-2)', marginTop: 2 }}>
                      {d
                        ? d.toLocaleDateString(
                            isAr ? 'ar-EG-u-ca-gregory' : 'en-US',
                            { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
                          )
                        : (isAr ? 'تاريخ غير محدد' : 'Date TBD')}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, flexShrink: 0,
                    background: mix('var(--info)', 12), color: 'var(--info)',
                  }}>
                    {isAr ? 'مؤكدة' : 'Confirmed'}
                  </span>
                  {session.meetingLink && (
                    <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, flexShrink: 0,
                      textDecoration: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)',
                    }}>
                      {isAr ? 'انضم' : 'Join'}
                    </a>
                  )}
                </div>
              )
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-2)' }}>
              <Calendar size={32} color="var(--ink-3)" style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ margin: 0, fontWeight: 300, fontSize: 13 }}>
                {isAr ? 'لا توجد جلسات قادمة' : 'No upcoming sessions'}
              </p>
            </div>
          )}
        </section>

        <aside style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 16, padding: 20, minWidth: 0,
        }}>
          <h2 style={{ fontWeight: 500, fontSize: 16, color: 'var(--ink)', margin: '0 0 16px' }}>
            {isAr ? 'روابط سريعة' : 'Quick Links'}
          </h2>
          {actions.map(({ Icon, label, href, primary }) => (
            <a
              key={label}
              href={href}
              className={primary ? 'rd-action rd-primary' : 'rd-action'}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 12px', borderRadius: 10, marginBottom: 8,
                border: primary ? 'none' : '1px solid var(--line)',
                background: primary ? 'var(--primary)' : 'var(--surface)',
                color: primary ? 'var(--primary-foreground)' : 'var(--ink)',
                textDecoration: 'none', fontWeight: primary ? 500 : 300, fontSize: 13,
              }}
            >
              <Icon size={16} color={primary ? 'var(--primary-foreground)' : 'var(--ink-3)'} />
              <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
              {!primary && <ChevronLeft size={14} color="var(--ink-3)" style={arrow} />}
            </a>
          ))}
        </aside>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const { user } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const accountType = user?.accountType || 'STUDENT'

  const roleCard = useMemo(() => {
    if (accountType === 'ADMIN') return {
      icon: <Shield size={22} color="var(--primary-foreground)"/>,
      title: 'لوحة تحكم الإدارة',
      desc: 'إدارة المستخدمين والكورسات والإعدادات',
      href: `/${locale}/admin`,
      bg: 'linear-gradient(135deg,rgba(81,32,200,0.2),rgba(124,58,237,0.15))',
      border: 'rgba(81,32,200,0.3)',
      iconBg: 'linear-gradient(135deg,#5120c8,#7c3aed)',
      chevronColor: '#5120c8',
    }
    if (accountType === 'INSTRUCTOR') return {
      icon: <BookOpen size={22} color="var(--primary-foreground)"/>,
      title: 'إنشاء كورس جديد',
      desc: 'ابدأ في تدريس وإنشاء محتوى تعليمي احترافي',
      href: `/${locale}/dashboard/create-course`,
      bg: 'linear-gradient(135deg,rgba(43,191,163,0.15),rgba(5,150,105,0.1))',
      border: 'rgba(43,191,163,0.3)',
      iconBg: 'linear-gradient(135deg,#2BBFA3,#059669)',
      chevronColor: '#2BBFA3',
    }
    if (accountType === 'CONSULTANT') return {
      icon: <Calendar size={22} color="var(--primary-foreground)"/>,
      title: 'جلساتي القادمة',
      desc: 'إدارة مواعيد الجلسات الإرشادية',
      href: `/${locale}/dashboard/my-sessions`,
      bg: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(217,119,6,0.1))',
      border: 'rgba(245,158,11,0.3)',
      iconBg: 'linear-gradient(135deg,#f59e0b,#d97706)',
      chevronColor: '#f59e0b',
    }
    return null
  }, [accountType, locale])

  if (!mounted) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Skeleton Welcome Card */}
        <div className="rounded-2xl p-4 md:p-8 bg-surface border border-[var(--line)]">
          <div className="flex items-center gap-4 flex-wrap">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <Skeleton className="h-4 w-72 rounded-lg" />
            </div>
          </div>
        </div>
        
        {/* Skeleton Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <AuthGate>
      {roleCard && (
        <Link href={roleCard.href} style={{
          display:'flex',alignItems:'center',gap:16,
          padding:'18px 22px',borderRadius:16,marginBottom:24,
          background:roleCard.bg,border:`1px solid ${roleCard.border}`,
          textDecoration:'none',transition:'all 0.2s ease',
        }}
        onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')}
        onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}
        >
          <div style={{
            width:46,height:46,borderRadius:13,
            background:roleCard.iconBg,
            display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
          }}>
            {roleCard.icon}
          </div>
          <div style={{flex:1}}>
            <div style={{color:'var(--ink)',fontWeight:500,fontSize:15}}>{roleCard.title}</div>
            <div style={{color:'#6b7280',fontSize:13,marginTop:2}}>{roleCard.desc}</div>
          </div>
          <ChevronLeft size={18} color={roleCard.chevronColor}/>
        </Link>
      )}
      <ErrorBoundary>
      {user?.accountType === 'INSTRUCTOR' ? <InstructorOverview /> :
       user?.accountType === 'CONSULTANT' ? <ConsultantOverview /> :
        <StudentOverview />}
      </ErrorBoundary>
    </AuthGate>
  )
}