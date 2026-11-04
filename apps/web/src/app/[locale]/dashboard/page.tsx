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

  const enrollments = enrollmentData ?? []
  const certificates = certData ?? []
  const studentStats = statsData?.stats
  const [tab, setTab] = useState<'all' | 'active' | 'done'>('all')

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
  const arrow = { transform: isAr ? 'none' : 'rotate(180deg)' } as const
  const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`

  const progressOf = (e: any): number => Number(e.progress ?? e.enrollment?.progress ?? 0) || 0
  const courseOf = (e: any) => e.course || e
  const titleOf = (c: any): string =>
    (isAr ? (c?.titleAr || c?.title) : (c?.titleEn || c?.title)) || (isAr ? 'كورس' : 'Course')
  const levelLabel = (lvl?: string | null): string => {
    if (!lvl) return ''
    const map: Record<string, [string, string]> = {
      BEGINNER: ['مبتدئ', 'Beginner'],
      INTERMEDIATE: ['متوسط', 'Intermediate'],
      ADVANCED: ['متقدم', 'Advanced'],
    }
    const hit = map[String(lvl).toUpperCase()]
    return hit ? (isAr ? hit[0] : hit[1]) : String(lvl)
  }
  const lessonsLabel = (e: any): string =>
    `${e.completedLessons ?? 0}/${e.totalLessons ?? 0} ${isAr ? 'درس' : 'lessons'}`

  const enrolledCount = enrollments.length || studentStats?.enrolledCourses || 0
  const completedCount = enrollments.filter((e: any) => progressOf(e) >= 100).length || studentStats?.completedCourses || 0
  const certificatesCount = certificates.length || studentStats?.certificatesEarned || 0

  const visible = enrollments.filter((e: any) =>
    tab === 'all' ? true : tab === 'done' ? progressOf(e) >= 100 : progressOf(e) < 100,
  )
  // unfinished courses first, so the table reads as "what to do next"
  const upNext = [...enrollments].sort((x: any, y: any) => Number(progressOf(x) >= 100) - Number(progressOf(y) >= 100))

  // Side card: a recommended course if the API sends one, else the next unfinished enrollment
  const recommended: any = (statsData as any)?.recommendedCourses?.[0]
  const nextEnrollment: any = upNext[0]
  const sideCourse: any = recommended || (nextEnrollment ? courseOf(nextEnrollment) : null)
  const sideHref = sideCourse?.id ? learnCourseLink(sideCourse.id, locale) : learnCoursesLink(locale)
  const sideThumb = getMediaUrl(sideCourse?.thumbnail ?? sideCourse?.thumbnailUrl)
  const sideLevel = levelLabel(sideCourse?.level)

  const tabs: { key: 'all' | 'active' | 'done'; label: string }[] = [
    { key: 'all', label: isAr ? 'الكل' : 'All' },
    { key: 'active', label: isAr ? 'مسجل' : 'Active' },
    { key: 'done', label: isAr ? 'مكتمل' : 'Completed' },
  ]

  const sectionTitle: React.CSSProperties = { fontWeight: 500, fontSize: 16, color: 'var(--foreground)', margin: 0 }
  const viewAll: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontWeight: 300, fontSize: 12, color: 'var(--primary)', textDecoration: 'none',
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', width: '100%' }}>
      <style>{`
        .sd-layout { display: flex; gap: 24px; align-items: flex-start; }
        .sd-side { width: 280px; flex-shrink: 0; }
        .sd-cards { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; scroll-snap-type: x proximity; }
        .sd-card { flex: 0 0 230px; scroll-snap-align: start; transition: transform 0.15s ease; }
        .sd-card:hover { transform: translateY(-2px); }
        .sd-row { display: grid; grid-template-columns: 1fr 160px 90px; align-items: center; gap: 12px; }
        .sd-row-link { transition: background 0.15s ease; }
        .sd-row-link:hover { background: color-mix(in srgb, var(--foreground) 4%, transparent); }
        .sd-tab { transition: background 0.15s ease, color 0.15s ease; }
        @media (max-width: 1000px) {
          .sd-layout { flex-direction: column; }
          .sd-side { width: 100%; }
        }
        @media (max-width: 640px) {
          .sd-row { grid-template-columns: 1fr 70px; }
          .sd-mid { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontWeight: 900, fontSize: 26, lineHeight: 1.2, color: 'var(--foreground)', margin: 0 }}>
            {isAr ? `مرحباً بك، ${firstName}` : `Welcome back, ${firstName}`}
          </h1>
          <p style={{ fontWeight: 300, fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
            {isAr ? 'واصل رحلتك التعليمية' : 'Continue your learning journey'}
          </p>
        </div>
        <div style={{ fontWeight: 300, fontSize: 12, color: 'var(--muted)' }}>
          {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="sd-layout">
        {/* Main */}
        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          {/* Course cards */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <h2 style={sectionTitle}>{isAr ? 'كورساتي' : 'My Courses'}</h2>
                <div style={{ display: 'flex', gap: 4 }}>
                  {tabs.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      className="sd-tab"
                      onClick={() => setTab(t.key)}
                      style={{
                        padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        fontWeight: 500, fontSize: 12,
                        background: tab === t.key ? mix('var(--primary)', 12) : 'transparent',
                        color: tab === t.key ? 'var(--primary)' : 'var(--muted)',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <a href={`/${locale}/dashboard/my-courses`} style={viewAll}>
                {isAr ? 'عرض الكل' : 'View all'}
                <ChevronLeft size={14} style={arrow} />
              </a>
            </div>

            {visible.length > 0 ? (
              <div className="sd-cards">
                {visible.slice(0, 8).map((enrollment: any) => {
                  const course = courseOf(enrollment)
                  const progress = Math.min(100, Math.round(progressOf(enrollment)))
                  const courseId = course?.id || enrollment.courseId
                  const thumb = getMediaUrl(course?.thumbnail)
                  const level = levelLabel(course?.level)
                  return (
                    <a
                      key={enrollment.id || courseId}
                      href={learnCourseLink(courseId, locale)}
                      target="_blank" rel="noopener noreferrer"
                      className="sd-card"
                      style={{
                        minWidth: 220, maxWidth: 240, borderRadius: 14, overflow: 'hidden',
                        border: '1px solid var(--border)', background: 'var(--card)',
                        textDecoration: 'none', display: 'flex', flexDirection: 'column',
                      }}
                    >
                      <div style={{
                        width: '100%', height: 130, position: 'relative', flexShrink: 0, overflow: 'hidden',
                        background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {thumb
                          ? <img src={thumb} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <BookOpen size={28} color="var(--muted-foreground)" />}
                        {level && (
                          <span style={{
                            position: 'absolute', top: 10, insetInlineEnd: 10,
                            background: 'var(--overlay-strong)', color: 'var(--primary-foreground)',
                            borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 500,
                            backdropFilter: 'blur(4px)',
                          }}>
                            {level}
                          </span>
                        )}
                      </div>

                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                        <div style={{
                          fontWeight: 500, fontSize: 13, color: 'var(--foreground)', lineHeight: 1.4,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {titleOf(course)}
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 300, color: 'var(--muted)', marginBottom: 5 }}>
                            <span>{isAr ? 'تقدمك' : 'Progress'}</span>
                            <span>{lessonsLabel(enrollment)}</span>
                          </div>
                          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 2, width: `${progress}%`,
                              background: progress >= 100 ? 'var(--success)' : 'var(--primary)',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                        </div>

                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
                          padding: '5px 10px', borderRadius: 7, marginTop: 'auto',
                          background: 'var(--primary)', color: 'var(--primary-foreground)',
                          fontSize: 12, fontWeight: 500,
                        }}>
                          {progress >= 100 ? (isAr ? 'مراجعة' : 'Review') : (isAr ? 'متابعة' : 'Continue')}
                          <ChevronLeft size={12} style={arrow} />
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: '32px 0', color: 'var(--muted)',
                border: '1px dashed var(--border)', borderRadius: 16,
              }}>
                <BookOpen size={32} color="var(--muted-foreground)" style={{ margin: '0 auto 10px', display: 'block' }} />
                <p style={{ margin: '0 0 16px', fontWeight: 300, fontSize: 13 }}>
                  {enrollments.length === 0
                    ? (isAr ? 'لم تشترك في أي كورس بعد' : 'No courses yet')
                    : (isAr ? 'لا توجد كورسات في هذا التصنيف' : 'No courses in this view')}
                </p>
                {enrollments.length === 0 && (
                  <a href={learnCoursesLink(locale)} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-block', padding: '8px 20px', borderRadius: 8,
                    background: 'var(--primary)', color: 'var(--primary-foreground)',
                    textDecoration: 'none', fontSize: 13, fontWeight: 500,
                  }}>
                    {isAr ? 'ابدأ التعلم' : 'Start Learning'}
                  </a>
                )}
              </div>
            )}
          </section>

          {/* Stats grid */}
          <style>{`
            .sd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 32px; }
            .sd-tile { transition: border-color 0.15s ease; }
            .sd-tile:hover { border-color: color-mix(in srgb, var(--primary) 35%, var(--border)); }
            @media (max-width: 900px) { .sd-grid { grid-template-columns: repeat(2, 1fr); } }
            @media (max-width: 520px) { .sd-grid { grid-template-columns: 1fr; } }
          `}</style>
          <div className="sd-grid">
            {[
              {
                Icon: BookOpen, color: 'var(--primary)',
                label: isAr ? 'كورسات مسجلة' : 'Enrolled Courses',
                value: enrolledCount as number | null,
                sub: isAr ? 'إجمالي الكورسات' : 'Total courses',
                href: `/${locale}/dashboard/my-courses`,
              },
              {
                Icon: CheckCircle, color: 'var(--success)',
                label: isAr ? 'كورسات مكتملة' : 'Completed Courses',
                value: completedCount as number | null,
                sub: isAr
                  ? `${enrolledCount ? Math.round((completedCount / enrolledCount) * 100) : 0}% من إجمالي الكورسات`
                  : `${enrolledCount ? Math.round((completedCount / enrolledCount) * 100) : 0}% of all courses`,
                href: `/${locale}/dashboard/my-courses`,
              },
              {
                Icon: Award, color: 'var(--warning)',
                label: isAr ? 'شهادات محققة' : 'Certificates',
                value: certificatesCount as number | null,
                sub: isAr ? 'شهادة معتمدة' : 'Verified certificates',
                href: `/${locale}/dashboard/certificates`,
              },
              {
                Icon: CreditCard, color: 'var(--muted-foreground)',
                label: isAr ? 'المدفوعات' : 'Payments',
                value: null as number | null,
                sub: isAr ? 'عرض السجل' : 'View history',
                href: `/${locale}/dashboard/invoices`,
              },
              {
                Icon: Calendar, color: 'var(--muted-foreground)',
                label: isAr ? 'جلساتي' : 'My Sessions',
                value: null as number | null,
                sub: isAr ? 'جلسات الكوتشينج' : 'Coaching sessions',
                href: `/${locale}/dashboard/my-sessions`,
              },
              {
                Icon: Settings, color: 'var(--muted-foreground)',
                label: isAr ? 'الإعدادات' : 'Settings',
                value: null as number | null,
                sub: isAr ? 'إعدادات الحساب' : 'Account settings',
                href: `/${locale}/dashboard/settings`,
              },
            ].map(({ Icon, color, label, value, sub, href }) => (
              <a
                key={label}
                href={href}
                className="sd-tile"
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, minWidth: 0,
                  padding: '16px 18px', borderRadius: 12,
                  border: '1px solid var(--border)', background: 'var(--card)',
                  textDecoration: 'none',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: mix(color, 12),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  {value !== null && (
                    <div style={{ fontWeight: 900, fontSize: 22, color: 'var(--foreground)', lineHeight: 1 }}>
                      {value}
                    </div>
                  )}
                  <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--foreground)', marginTop: value !== null ? 2 : 0 }}>
                    {label}
                  </div>
                  <div style={{ fontWeight: 300, fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {sub}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Side card */}
        <aside className="sd-side" style={{
          background: 'color-mix(in srgb, var(--primary) 8%, var(--background))',
          border: '1px solid ' + mix('var(--primary)', 20),
          borderRadius: 16, padding: 20,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ fontWeight: 300, fontSize: 12, color: 'var(--muted)' }}>
            {recommended ? (isAr ? 'مقترح لك' : 'Recommended for you') : (isAr ? 'تابع من حيث توقفت' : 'Pick up where you left off')}
          </div>

          <a href={sideHref} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{
              height: 120, position: 'relative', overflow: 'hidden', background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {sideThumb
                ? <img src={sideThumb} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                : <BookOpen size={32} color="var(--primary-foreground)" />}
            </div>
            <div style={{
              padding: '10px 14px 14px', background: 'var(--card)',
              border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px',
            }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: 'var(--foreground)', lineHeight: 1.3 }}>
                {sideCourse ? titleOf(sideCourse) : (isAr ? 'ابدأ كورسك القادم' : 'Start your next course')}
              </div>
              {sideLevel && (
                <div style={{ fontWeight: 300, fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{sideLevel}</div>
              )}
            </div>
          </a>

          {[
            { label: isAr ? 'كورسات مسجلة' : 'Enrolled', value: enrolledCount, Icon: BookOpen, href: `/${locale}/dashboard/my-courses` },
            { label: isAr ? 'كورسات مكتملة' : 'Completed', value: completedCount, Icon: CheckCircle, href: `/${locale}/dashboard/my-courses` },
            { label: isAr ? 'شهادات' : 'Certificates', value: certificatesCount, Icon: Award, href: `/${locale}/dashboard/certificates` },
          ].map(({ label, value, Icon, href }) => (
            <a key={label} href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--foreground)' }}>
              <Icon size={15} color="var(--primary)" />
              <span style={{ flex: 1, fontWeight: 300, fontSize: 13 }}>{label}</span>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{value}</span>
            </a>
          ))}

          <a href={learnCoursesLink(locale)} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: 10, borderRadius: 10,
            background: 'var(--primary)', color: 'var(--primary-foreground)',
            fontWeight: 500, fontSize: 13, textDecoration: 'none', marginTop: 'auto',
          }}>
            {isAr ? 'استعرض الكل' : 'Browse all'}
            <ChevronLeft size={14} style={arrow} />
          </a>
        </aside>
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