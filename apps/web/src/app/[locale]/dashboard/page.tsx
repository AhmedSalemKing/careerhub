'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { BookOpen, Users, DollarSign, PlusCircle, Calendar, Clock, CheckCircle, Target } from 'lucide-react'
import { get, patch } from '../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../lib/unwrap'
import { AuthGate } from '../../components/AuthGate'
import { DashboardShell } from '../../components/DashboardShell'
import { CourseCard, type CourseCardCourse } from '../../components/CourseCard'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../../lib/toast'
import { useAuthStore } from '../../../stores/authStore'

// ─── Styles Constants for Glossy Black Theme ───────────────────────────────────
const CARD_STYLE = {
  background: '#141414',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  color: '#E6E6E6'
}

const TEXT_MUTED = '#9CA3AF'
const TEXT_PRIMARY = '#E6E6E6'

// ─── Instructor Overview ────────────────────────────────────────────────────

function InstructorOverview() {
  const locale = useLocale()
  const { user } = useAuthStore()
  const firstName = user?.profile?.firstName || 'المحاضر'

  const { data: stats } = useQuery({
    queryKey: ['instructor-stats'],
    queryFn: async () => {
      const res = await get('/courses/instructor/stats')
      const d = (res?.data as any)?.data ?? {}
      return { totalCourses: d.totalCourses ?? 0, totalStudents: d.totalStudents ?? 0, revenue: d.revenue ?? 0 }
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

  const statCards = [
    { label: 'إجمالي الكورسات', value: stats?.totalCourses ?? 0, icon: BookOpen, bg: 'rgba(81,32,200,0.15)', color: '#818CF8' },
    { label: 'إجمالي الطلاب', value: stats?.totalStudents ?? 0, icon: Users, bg: 'rgba(43,191,163,0.15)', color: '#34D399' },
    { label: 'الإيرادات', value: `${stats?.revenue ?? 0} ريال`, icon: DollarSign, bg: 'rgba(245,166,35,0.15)', color: '#FCD34D' },
  ]

  return (
    <div className="p-6 space-y-6" dir="rtl" style={{ color: TEXT_PRIMARY }}>
      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{ 
          background: '#141414', 
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}
      >
        {/* Subtle glow effect inside banner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5120c8] opacity-5 blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <h1 className="text-3xl font-bold font-madinet relative z-10" style={{ color: '#ffffff' }}>
          مرحباً بك يا {firstName}
        </h1>
        <p className="mt-1 text-sm relative z-10" style={{ color: TEXT_MUTED }}>
          لوحة تحكم المحاضر — أدر كورساتك وطلابك بكل سهولة
        </p>
        <Link
          href={`/${locale}/dashboard/create-course`}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:-translate-y-0.5"
          style={{ 
            background: '#5120c8',
            fontSize: 14
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#4318a8'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#5120c8'}
        >
          <PlusCircle className="h-4 w-4" />
          بدء كورس جديد
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 relative overflow-hidden"
            style={CARD_STYLE}
          >
            <div
              className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: stat.bg }}
            >
              <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: '#ffffff' }}>{stat.value}</p>
            <p className="text-sm mt-0.5" style={{ color: TEXT_MUTED }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Courses */}
      {courses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-madinet" style={{ color: '#ffffff' }}>كورساتي الأخيرة</h2>
            <Link href={`/${locale}/dashboard/my-courses`} className="text-sm hover:underline" style={{ color: '#818CF8' }}>
              عرض الكل
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((course: any) => (
              <div
                key={course.id}
                className="flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-white/[0.02]"
                style={{ ...CARD_STYLE, padding: '16px' }}
              >
                <div
                  className="h-16 w-24 shrink-0 rounded-xl overflow-hidden border border-white/5"
                  style={{ background: '#0A0A0A' }}
                >
                  {course.thumbnail ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL || ''}${course.thumbnail}`}
                      className="h-full w-full object-cover"
                      alt={course.titleEn}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-6 w-6 opacity-30" style={{ color: TEXT_MUTED }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate" style={{ color: '#ffffff' }}>{course.titleEn}</h3>
                  <p className="text-sm mt-0.5" style={{ color: TEXT_MUTED }}>
                    {course._count?.enrollments ?? 0} طالب
                  </p>
                  <span
                    className="mt-1 inline-block text-xs rounded-full px-2 py-0.5 font-medium"
                    style={{
                      background: course.status === 'PUBLISHED' ? 'rgba(43,191,163,0.15)' : 'rgba(245,166,35,0.15)',
                      color: course.status === 'PUBLISHED' ? '#34D399' : '#FCD34D',
                    }}
                  >
                    {course.status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
                  </span>
                </div>
                <Link
                  href={`/${locale}/dashboard/courses/${course.id}/manage`}
                  className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: TEXT_PRIMARY }}
                >
                  إدارة
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ border: '1px dashed rgba(255,255,255,0.15)', background: 'transparent' }}
        >
          <BookOpen className="h-10 w-10 mx-auto mb-3" style={{ color: TEXT_MUTED, opacity: 0.3 }} />
          <p className="text-sm" style={{ color: TEXT_MUTED }}>لا توجد كورسات بعد.</p>
          <Link
            href={`/${locale}/dashboard/create-course`}
            className="mt-3 inline-flex items-center gap-2 text-sm font-bold hover:underline"
            style={{ color: '#818CF8' }}
          >
            <PlusCircle className="h-4 w-4" /> أنشئ كورسك الأول
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Student Overview (Fixed) ───────────────────────────────────────────────────────

type DashboardData = {
  stats?: { enrolledCourses?: number; completedCourses?: number; certificatesEarned?: number }
  recommendedCourses?: CourseCardCourse[]
}

function StudentOverview() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('dashboard')
  const c = useTranslations('common')
  const { toast } = useToast()

  const q = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      // FIX 1: Removed generic <ApiEnvelope<DashboardData>> from 'get'
      const res = await get('/users/dashboard')
      // Extract data safely following the pattern in InstructorOverview
      const data = (res?.data as any)?.data ?? (res?.data as any)
      return unwrapData(data)
    },
  })

  const stats = q.data?.stats
  const courses = q.data?.recommendedCourses ?? []

  return (
    <DashboardShell title={t('overview')} subtitle={t('assessment_prompt')}>
      {q.isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : q.isError ? (
        <div className="rounded-2xl p-6" style={CARD_STYLE}>
          <div className="text-sm" style={{ color: TEXT_MUTED }}>{c('empty')}</div>
          <button
            type="button"
            className="mt-4 btn-primary"
            style={{ fontSize: 13, padding: '8px 16px', background: '#5120c8', color: '#fff' }}
            onClick={() => {
              toast({ title: c('loading'), description: c('loading') })
              q.refetch()
            }}
          >
            {c('retry')}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Stat label={t('enrolled_courses')} value={stats?.enrolledCourses ?? 0} />
            <Stat label={t('completed_courses')} value={stats?.completedCourses ?? 0} />
            <Stat label={t('certificates_earned')} value={stats?.certificatesEarned ?? 0} />
          </div>
          <div className="mt-6 rounded-2xl p-6" style={CARD_STYLE}>
            <div className="text-sm font-extrabold" style={{ color: '#ffffff' }}>{t('courses')}</div>
            {courses.length ? (
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* FIX 2: Explicitly type 'course' */}
                {courses.slice(0, 6).map((course: CourseCardCourse) => (
                  <CourseCard key={course.id} course={course} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="mt-4 text-sm" style={{ color: TEXT_MUTED }}>{c('empty')}</div>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={CARD_STYLE}
    >
      <div className="text-xs font-semibold" style={{ color: TEXT_MUTED }}>{label}</div>
      <div className="mt-2 text-2xl font-extrabold" style={{ color: '#ffffff' }}>{value}</div>
    </div>
  )
}

// ─── Consultant Overview ─────────────────────────────────────────────────────

function ConsultantOverview() {
  const locale = useLocale()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const firstName = user?.profile?.firstName || 'المستشار'

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

  const pending = (sessions as any[]).filter((s) => s.status === 'PENDING')
  const confirmed = (sessions as any[]).filter((s) => s.status === 'CONFIRMED')
  const completed = (sessions as any[]).filter((s) => s.status === 'COMPLETED')
  const totalRevenue = completed.reduce((sum: number, s: any) => sum + (s.price || 0), 0)

  const confirmSession = async (id: string) => {
    await patch(`/coaching/consulting/${id}/confirm`, {})
    qc.invalidateQueries({ queryKey: ['consultant-sessions'] })
  }
  const cancelSession = async (id: string) => {
    await patch(`/coaching/consulting/${id}/cancel`, {})
    qc.invalidateQueries({ queryKey: ['consultant-sessions'] })
  }

  const statItems = [
    { label: 'طلبات جديدة', value: pending.length, bg: 'rgba(245,166,35,0.15)', color: '#FCD34D', IconComp: Clock },
    { label: 'جلسات مؤكدة', value: confirmed.length, bg: 'rgba(81,32,200,0.15)', color: '#818CF8', IconComp: CheckCircle },
    { label: 'جلسات مكتملة', value: completed.length, bg: 'rgba(43,191,163,0.15)', color: '#34D399', IconComp: Target },
    { label: 'الإيرادات', value: `${totalRevenue} ريال`, bg: 'rgba(81,32,200,0.15)', color: '#818CF8', IconComp: DollarSign },
  ]

  return (
    <div className="p-6 space-y-6" dir="rtl" style={{ color: TEXT_PRIMARY }}>
      {/* Welcome */}
      <div
        className="rounded-2xl p-6"
        style={{ ...CARD_STYLE, background: '#141414' }}
      >
        <h1 className="text-3xl font-bold font-madinet" style={{ color: '#ffffff' }}>مرحباً يا {firstName}</h1>
        <p className="mt-1 text-sm" style={{ color: TEXT_MUTED }}>لوحة تحكم المستشار</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {statItems.map((s, i) => (
          <div
            key={i}
            className="rounded-2xl p-5"
            style={CARD_STYLE}
          >
            <div
              className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: s.bg }}
            >
              <s.IconComp className="h-6 w-6" style={{ color: s.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: '#ffffff' }}>{s.value}</p>
            <p className="text-sm" style={{ color: TEXT_MUTED }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending sessions */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-xl font-bold font-madinet mb-4" style={{ color: '#ffffff' }}>طلبات تحتاج موافقة ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((s: any) => (
              <div
                key={s.id}
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(245,166,35,0.08)',
                  border: '1px solid rgba(245,166,35,0.15)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold" style={{ color: '#ffffff' }}>{s.topic || 'جلسة استشارية'}</p>
                    <p className="text-sm mt-1" style={{ color: TEXT_MUTED }}>
                      {s.scheduledAt ? new Date(s.scheduledAt).toLocaleDateString('ar-SA') : '—'} — {s.meetingMethod}
                    </p>
                    <p className="font-bold mt-1" style={{ color: '#FCD34D' }}>{s.price} ريال</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => confirmSession(s.id)}
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
                      style={{ background: '#10B981' }}
                    >
                      قبول
                    </button>
                    <button
                      onClick={() => cancelSession(s.id)}
                      className="rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}
                    >
                      رفض
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed sessions */}
      {confirmed.length > 0 && (
        <div>
          <h2 className="text-xl font-bold font-madinet mb-4" style={{ color: '#ffffff' }}>الجلسات القادمة</h2>
          <div className="space-y-3">
            {confirmed.slice(0, 5).map((s: any) => (
              <div
                key={s.id}
                className="rounded-2xl p-5"
                style={CARD_STYLE}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: '#ffffff' }}>{s.topic || 'جلسة استشارية'}</p>
                    <p className="text-sm mt-1" style={{ color: TEXT_MUTED }}>
                      {s.scheduledAt ? new Date(s.scheduledAt).toLocaleDateString('ar-SA') : '—'}
                    </p>
                  </div>
                  <div className="text-left">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{ background: 'rgba(43,191,163,0.15)', color: '#34D399' }}
                    >
                      {s.meetingMethod}
                    </span>
                    <p className="font-bold mt-1" style={{ color: '#FCD34D' }}>{s.price} ريال</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ border: '1px dashed rgba(255,255,255,0.15)', background: 'transparent' }}
        >
          <Calendar className="h-10 w-10 mx-auto mb-3" style={{ color: TEXT_MUTED, opacity: 0.3 }} />
          <p className="text-sm" style={{ color: TEXT_MUTED }}>لا توجد جلسات بعد.</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-32 rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <AuthGate>
      {user?.accountType === 'INSTRUCTOR' ? <InstructorOverview /> :
       user?.accountType === 'CONSULTANT' ? <ConsultantOverview /> :
       <StudentOverview />}
    </AuthGate>
  )
}