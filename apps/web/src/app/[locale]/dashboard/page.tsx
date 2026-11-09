'use client'

import { useEffect, useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  BookOpen, Users, PlusCircle, Calendar, ArrowLeft, ChevronLeft, Shield, AlertTriangle, Hand,
  CheckCircle, Award, Bookmark, CreditCard, Settings,
  TrendingUp, DollarSign, BarChart2, Plus, Bell,
} from 'lucide-react'
import { get } from '../../../lib/api'
import { unwrapData } from '../../../lib/unwrap'
import { getMediaUrl } from '../../../lib/media'
import { learnCoursesLink, learnCourseLink } from '../../../lib/learn-link'
import { AuthGate } from '../../components/AuthGate'
import { CHARACTERS } from '../../components/characters'
import { DashboardShell } from '../../components/DashboardShell'
import { CourseCard, type CourseCardCourse } from '../../components/CourseCard'
import { Skeleton } from '../../components/ui/Skeleton'
import VerifiedBadge from '../../../components/VerifiedBadge'
import { useToast } from '../../../lib/toast'
import { useAuthStore } from '../../../stores/authStore'
import { ErrorBoundary } from '../../../components/ErrorBoundary'
import { formatCoursePrice } from '../../../lib/market'

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
        .rd-stat:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--primary) 35%, var(--border)); }
        .rd-row { transition: background 0.15s ease, border-color 0.15s ease; }
        a.rd-row:hover { background: color-mix(in srgb, var(--foreground) 4%, transparent); border-color: color-mix(in srgb, var(--primary) 30%, var(--border)); }
        .rd-action { transition: border-color 0.15s ease, opacity 0.15s ease; }
        .rd-action:hover { border-color: color-mix(in srgb, var(--primary) 35%, var(--border)); }
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
          <h1 style={{ fontWeight: 900, fontSize: 26, lineHeight: 1.2, color: 'var(--foreground)', margin: 0 }}>
            {isAr ? `مرحباً، ${firstName}` : `Welcome, ${firstName}`}
          </h1>
          <p style={{ fontWeight: 300, fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
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
              background: 'var(--card)', border: '1px solid var(--border)',
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
                <div style={{ fontWeight: 900, fontSize: 26, color: 'var(--foreground)', lineHeight: 1.1, wordBreak: 'break-word' }}>
                  {value}
                </div>
                <div style={{ fontWeight: 300, fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
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
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24, minWidth: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontWeight: 500, fontSize: 16, color: 'var(--foreground)', margin: 0 }}>
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
                  border: '1px solid var(--border)', textDecoration: 'none',
                }}
              >
                <div style={{
                  width: 56, height: 42, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                  background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {thumb
                    ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <BookOpen size={18} color="var(--muted-foreground)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 500, fontSize: 13, color: 'var(--foreground)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {(isAr ? course.titleAr : course.titleEn) || course.titleAr || course.titleEn}
                  </div>
                  <div style={{ fontWeight: 300, fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {course._count?.enrollments ?? 0}{isAr ? ' طالب' : ' students'} · {formatCoursePrice(course)}
                  </div>
                </div>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, flexShrink: 0,
                  background: mix(published ? 'var(--success)' : 'var(--muted-foreground)', 12),
                  color: published ? 'var(--success)' : 'var(--muted)',
                }}>
                  {published ? (isAr ? 'منشور' : 'Live') : (isAr ? 'مسودة' : 'Draft')}
                </span>
              </a>
            )
          })}

          {courses.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)' }}>
              <BookOpen size={32} color="var(--muted-foreground)" style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ margin: 0, fontWeight: 300, fontSize: 13 }}>
                {isAr ? 'لا توجد كورسات بعد' : 'No courses yet'}
              </p>
            </div>
          )}
        </section>

        <aside style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 20, minWidth: 0,
        }}>
          <h2 style={{ fontWeight: 500, fontSize: 16, color: 'var(--foreground)', margin: '0 0 16px' }}>
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
                border: primary ? 'none' : '1px solid var(--border)',
                background: primary ? 'var(--primary)' : 'var(--card)',
                color: primary ? 'var(--primary-foreground)' : 'var(--foreground)',
                textDecoration: 'none', fontWeight: primary ? 500 : 300, fontSize: 13,
              }}
            >
              <Icon size={16} color={primary ? 'var(--primary-foreground)' : 'var(--muted-foreground)'} />
              <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
              {!primary && <ChevronLeft size={14} color="var(--muted-foreground)" style={arrow} />}
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
      const res = await get('/courses/my-courses')
      const raw = res?.data
      const d = (raw as any)?.data?.enrollments ?? (raw as any)?.data ?? raw ?? []
      return Array.isArray(d) ? d : []
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

  const [rasheedResult, setRasheedResult] = useState<{ topCareers: { name: string; nameEn: string; match: number }[] } | null>(null)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('rasheed_quiz_result')
      if (raw) setRasheedResult(JSON.parse(raw))
    } catch {}
  }, [])

  if (isLoading) {
    return (
      <DashboardShell title={isAr ? 'الملخص' : 'Overview'} subtitle={isAr ? 'البيانات قيد التحميل...' : 'Loading your data...'}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </DashboardShell>
    )
  }

  if (isError) {
    return (
      <DashboardShell title={isAr ? 'الملخص' : 'Overview'} subtitle={isAr ? 'حدث خطأ' : 'Something went wrong'}>
        <div style={{ textAlign:'center', padding:'3rem 2rem',
          border:'1px solid var(--border)', borderRadius:'16px',
          background:'var(--surface)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
            stroke="var(--error)" strokeWidth="2" strokeLinecap="round"
            style={{ margin:'0 auto 1rem', display:'block', opacity:0.5 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p style={{ fontSize:'0.9rem', color:'var(--muted-foreground)', marginBottom:'1rem' }}>
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
    <div className="dw-dash-wrap">

      {/* HEADER */}
      <div className="dw-dash-head">
        <span className="dw2-char-av" aria-hidden="true" dangerouslySetInnerHTML={{ __html: CHARACTERS.sa2 }} />
        <div className="dw2-grow">
          <p style={{ margin: '0 0 2px', fontSize: '13px', color: 'var(--ink-3)' }}>مرحباً بعودتك</p>
          <h1>{userName}</h1>
        </div>
      </div>

      <div className="dgrid">

        {/* ===== CAREER PATH CARD — s8 ===== */}
        <div className="dw-card s8">
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
            <Link href={`/${locale}/dashboard/career-path`} className="dw-open-btn">
              فتح المسار المهني
              <OpenArrow />
            </Link>
          </div>

          {selectedPath ? (() => {
            const pathCourses: any[] = selectedPath.courses ?? []
            const done = pathCourses.filter((c: any) => {
              const e = enrollmentFor(c)
              return e && progressForEnrollment(e) >= 100
            }).length
            const pct = pathCourses.length > 0 ? Math.round((done / pathCourses.length) * 100) : 0
            const C = 2 * Math.PI * 60
            const offset = C - (pct / 100) * C
            return (
              <>
                <div className="dw-rec">
                  <span className="dw-big-ring">
                    <svg viewBox="0 0 132 132" width="132" height="132" className="dw-ring-svg">
                      <defs>
                        <linearGradient id="dw-rg" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0" stopColor="#5414F6"/>
                          <stop offset="1" stopColor="#BF78FB"/>
                        </linearGradient>
                      </defs>
                      <circle className="dw-ring-bg" cx="66" cy="66" r="60" strokeWidth="12"/>
                      <circle className="dw-ring-fg" cx="66" cy="66" r="60" strokeWidth="12"
                        strokeDasharray={C} strokeDashoffset={offset}
                        style={{ stroke: 'url(#dw-rg)' }}/>
                    </svg>
                    <b>{pct}%</b>
                    <small>اكتملت</small>
                  </span>
                  <div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800 }}>{selectedPath.name}</h3>
                    <p className="dw-muted">{(selectedPath.roles ?? []).slice(0, 3).join(' · ')}</p>
                    <div style={{ marginTop: '14px' }}>
                      <Link href={`/${locale}/dashboard/career-path`} className="dw-btn dw-btn-primary dw-btn-sm">
                        تابع
                        <OpenArrow />
                      </Link>
                    </div>
                  </div>
                </div>
                {/* Section 1: every course the student is enrolled in for this path */}
                <p className="dw-section-label">الكورسات المشترك فيها</p>
                {(() => {
                  const enrolledInPath = pathCourses.filter((c: any) => enrollmentFor(c))
                  if (enrolledInPath.length === 0) {
                    return (
                      <p style={{ fontSize: '13px', color: 'var(--ink-3)', padding: '8px 4px' }}>
                        لم تبدأ أي كورس في هذا المسار بعد
                      </p>
                    )
                  }
                  return (
                    <div className="dw-clist" style={{ marginTop: 0 }}>
                      {enrolledInPath.map((c: any, i: number) => {
                        const e = enrollmentFor(c)
                        const prog = e ? progressForEnrollment(e) : 0
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
                  )
                })()}

                {/* Section 2: all courses of this path, enrolled or not */}
                <p className="dw-section-label" style={{ marginTop: '20px' }}>كورسات المسار</p>
                {pathCourses.length === 0 ? (
                  <div className="dw2-empty-courses">
                    <p>لا توجد كورسات مرتبطة بهذا المسار بعد.</p>
                    <a href={learnCoursesLink(locale)} className="dw-btn dw-btn-ghost dw-btn-sm">تصفح كل الكورسات</a>
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

        {/* ===== RIGHT COLUMN — s4 ===== */}
        <div className="s4-col">

          {/* === DARK SESSION CARD (real data from /consulting/sessions) === */}
          <div className="dw-card dw-live-card">
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
                  {upcomingSession.topic ?? upcomingSession.sessionName ?? 'جلسة استشارية'}
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
          <div className="dw-card">
            <div className="dw-card-h">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <h3>دعم المرشدين</h3>
            </div>

            <Link href={`/${locale}/dashboard/my-sessions`} className="dw2-stats" aria-label="جلساتي">
              <span><b>{upcomingCount}</b><small>قادمة</small></span>
              <span><b>{pendingCount}</b><small>بانتظار الموافقة</small></span>
              <span><b>{completedSessionsCount}</b><small>مكتملة</small></span>
            </Link>

            <Link href={`/${locale}/coaching`} className="dw-btn dw-btn-ghost dw-btn-sm dw-btn-block">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 5h16v16H4zM4 10h16M8 3v4M16 3v4"/>
              </svg>
              احجز جلسة جديدة
            </Link>

            <Link href={`/${locale}/dashboard/my-sessions`} className="dw-link-sm">
              عرض كل جلساتي
            </Link>
          </div>

        </div>

        {/* ===== MILESTONES — s6 ===== */}
        <div className="dw-card s6">
          <div className="dw-card-h">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>
            <h3>المحطات</h3>
          </div>
          <ol className="dw-ms">
            {[
              { label: 'إنشاء حسابك', done: true, doing: false },
              { label: 'اختيار مسارك المهني', done: !!selectedPath, doing: !selectedPath },
              { label: 'إكمال أول كورس', done: (completedCount ?? 0) > 0, doing: !!selectedPath && (completedCount ?? 0) === 0 },
              { label: 'حجز جلسة مع مرشد', done: (completedSessionsCount ?? 0) > 0, doing: (completedCount ?? 0) > 0 && (completedSessionsCount ?? 0) === 0 },
              { label: 'الحصول على شهادتك الأولى', done: (certificatesCount ?? 0) > 0, doing: false },
            ].map((s, i) => (
              <li key={i} className={s.done ? 'done' : s.doing ? 'doing' : ''}>
                <span className="dw-m-dot">{s.done && <Check size={11} />}</span>
                <span>{s.label}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ===== RASHEED RECOMMENDATIONS — s6 ===== */}
        <div className="dw-card s6">
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

      </div>
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
      className={`rounded-2xl p-4 md:p-6 border border-border bg-surface shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-up stagger-${delay + 1}`}
    >
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-md`}>
        {icon || <BookOpen className="h-5 w-5 text-white" />}
      </div>
      <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl md:text-3xl font-medium text-foreground" style={{ fontFamily: 'PingARLT, sans-serif' }}>
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

  const firstName = user?.profile?.firstName || (isAr ? 'المستشار' : 'Coach')
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
        .rd-stat:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--primary) 35%, var(--border)); }
        .rd-row { transition: background 0.15s ease, border-color 0.15s ease; }
        a.rd-row:hover { background: color-mix(in srgb, var(--foreground) 4%, transparent); border-color: color-mix(in srgb, var(--primary) 30%, var(--border)); }
        .rd-action { transition: border-color 0.15s ease, opacity 0.15s ease; }
        .rd-action:hover { border-color: color-mix(in srgb, var(--primary) 35%, var(--border)); }
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
            {isAr ? 'لوحة تحكم المستشار' : 'Coach Dashboard'}
          </div>
          <h1 style={{ fontWeight: 900, fontSize: 26, lineHeight: 1.2, color: 'var(--foreground)', margin: 0 }}>
            {isAr ? `مرحباً، ${firstName}` : `Welcome, ${firstName}`}
          </h1>
          <p style={{ fontWeight: 300, fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
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
              background: 'var(--card)', border: '1px solid var(--border)',
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
                <div style={{ fontWeight: 900, fontSize: 26, color: 'var(--foreground)', lineHeight: 1.1, wordBreak: 'break-word' }}>
                  {value}
                </div>
                <div style={{ fontWeight: 300, fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
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
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24, minWidth: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontWeight: 500, fontSize: 16, color: 'var(--foreground)', margin: 0 }}>
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
                  border: '1px solid var(--border)', background: 'var(--card)',
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
                      fontWeight: 500, fontSize: 13, color: 'var(--foreground)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {clientName}
                    </div>
                    <div style={{ fontWeight: 300, fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
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
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)' }}>
              <Calendar size={32} color="var(--muted-foreground)" style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ margin: 0, fontWeight: 300, fontSize: 13 }}>
                {isAr ? 'لا توجد جلسات قادمة' : 'No upcoming sessions'}
              </p>
            </div>
          )}
        </section>

        <aside style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 20, minWidth: 0,
        }}>
          <h2 style={{ fontWeight: 500, fontSize: 16, color: 'var(--foreground)', margin: '0 0 16px' }}>
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
                border: primary ? 'none' : '1px solid var(--border)',
                background: primary ? 'var(--primary)' : 'var(--card)',
                color: primary ? 'var(--primary-foreground)' : 'var(--foreground)',
                textDecoration: 'none', fontWeight: primary ? 500 : 300, fontSize: 13,
              }}
            >
              <Icon size={16} color={primary ? 'var(--primary-foreground)' : 'var(--muted-foreground)'} />
              <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
              {!primary && <ChevronLeft size={14} color="var(--muted-foreground)" style={arrow} />}
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
      desc: 'إدارة مواعيد الجلسات الاستشارية',
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
        <div className="rounded-2xl p-4 md:p-8 bg-surface border border-border">
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
            <div style={{color:'var(--foreground)',fontWeight:500,fontSize:15}}>{roleCard.title}</div>
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