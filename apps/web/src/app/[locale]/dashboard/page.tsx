'use client'

import { useEffect, useState, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { BookOpen, Users, DollarSign, PlusCircle, Calendar, Clock, CheckCircle, Target, ArrowLeft, ChevronLeft, Shield, CheckCircle2, XCircle, AlertTriangle, Hand } from 'lucide-react'
import { get, patch } from '../../../lib/api'
import { unwrapData } from '../../../lib/unwrap'
import { getMediaUrl } from '../../../lib/media'
import { AuthGate } from '../../components/AuthGate'
import { DashboardShell } from '../../components/DashboardShell'
import { CourseCard, type CourseCardCourse } from '../../components/CourseCard'
import { Skeleton } from '../../components/ui/Skeleton'
import VerifiedBadge from '../../../components/VerifiedBadge'
import { useToast } from '../../../lib/toast'
import { useAuthStore } from '../../../stores/authStore'

/* ════════════════════════════════════════════════════════
   INSTRUCTOR OVERVIEW — PROFESSIONAL DESIGN
   ════════════════════════════════════════════════════════ */

function InstructorOverview() {
  const locale = useLocale()
  const { user } = useAuthStore()
  const firstName = user?.profile?.firstName || 'المحاضر'

  const { data: stats } = useQuery({
    queryKey: ['instructor-stats'],
    queryFn: async () => {
      const res = await get('/courses/instructor/stats')
      const d = (res?.data as any)?.data ?? {}
      return { totalCourses: d.totalCourses ?? 0, totalStudents: d.totalStudents ?? 0, revenue: d.totalRevenue ?? 0 }
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
    { label: 'إجمالي الكورسات', value: stats?.totalCourses ?? 0, icon: BookOpen, color: 'from-purple-500 to-violet-600' },
    { label: 'إجمالي المستخدمين', value: stats?.totalStudents ?? 0, icon: Users, color: 'from-teal-500 to-emerald-600' },
    { label: 'الإيرادات', value: `${stats?.revenue ?? 0} ريال`, icon: DollarSign, color: 'from-amber-500 to-orange-600' },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-8" dir="rtl">
      
      {/* Welcome Banner — Enhanced */}
      <div className="card-welcome animate-fade-up">
        <div className="welcome-glow" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-[clamp(24px,3.5vw,34px)] font-bold text-foreground tracking-tight leading-tight flex items-center gap-2">
                مرحباً بك يا {firstName}
                {user?.isVerified && <VerifiedBadge size="sm" showTooltip={false} />}
              </h1>
              <p className="text-sm text-muted mt-1 font-medium">لوحة تحكم المحاضر — أدر كورساتك وطلابك بكل سهولة</p>
            </div>
          </div>
          
          <Link href={`/${locale}/dashboard/create-course`} className="btn-create-inline">
            <PlusCircle className="h-5 w-5" />
            بدء كورس جديد
          </Link>
        </div>
      </div>

      {/* Stats Grid — Modern Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, i) => (
          <div 
            key={i} 
            className={`card-stat animate-fade-up stagger-${i + 1}`}
          >
            <div className={`stat-icon-wrapper bg-gradient-to-br ${stat.color}`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <p className="stat-value">{stat.value}</p>
            <p className="stat-label">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Courses — Enhanced */}
      {courses.length > 0 && (
        <div className="animate-fade-up stagger-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              كورساتي الأخيرة
            </h2>
            <Link 
              href={`/${locale}/dashboard/my-courses`} 
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors group"
            >
              عرض الكل 
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </Link>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((course: any, idx: number) => (
              <div 
                key={course.id} 
                className={`course-card-mini animate-fade-up`}
                style={{ animationDelay: `${idx * 0.1}s`, opacity: 0 }}
              >
                <div className="course-thumb-mini">
                  {course.thumbnail ? (
                    <img 
                      src={getMediaUrl(course.thumbnail) ?? ''}
                      className="h-full w-full object-cover" 
                      alt={course.titleEn} 
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-surface-2 to-surface-3">
                      <BookOpen className="h-7 w-7 opacity-30 text-muted" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 relative z-10">
                  <h3 className="font-semibold text-[15px] text-foreground truncate mb-1">
                    {course.titleEn}
                  </h3>
                  <p className="text-xs text-muted font-medium">
                    {course._count?.enrollments ?? 0} مستخدم مسجل
                  </p>
<span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full mt-2 ${
                      course.status === 'PUBLISHED' 
                        ? 'bg-emerald-500/12 text-emerald-600 ring-1 ring-emerald-500/20' 
                        : 'bg-amber-500/12 text-amber-600 ring-1 ring-amber-500/20'
                    }`}>
                    {course.status === 'PUBLISHED' ? <><CheckCircle2 className="h-3 w-3 inline ml-1" />منشور</> : <><Clock className="h-3 w-3 inline ml-1" />مسودة</>}
                  </span>
                </div>
                
                <Link 
                  href={`/${locale}/dashboard/courses/${course.id}/manage`} 
                  className="shrink-0 relative z-10 text-xs font-bold px-4 py-2.5 rounded-xl bg-surface-2 text-foreground hover:bg-primary hover:text-white transition-all duration-200 border border-border hover:border-primary"
                >
                  إدارة
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State — Professional */}
      {courses.length === 0 && (
        <div className="rounded-2xl p-16 text-center border-2 border-dashed border-border-strong bg-surface/50 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-primary opacity-50" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">لا توجد كورسات بعد</h3>
          <p className="text-sm text-muted mb-6 max-w-xs mx-auto">ابدأ رحلتك في إنشاء المحتوى التعليمي وأنشئ كورسك الأول الآن</p>
          <Link 
            href={`/${locale}/dashboard/create-course`} 
            className="btn-create-inline"
          >
            <PlusCircle className="h-5 w-5" />
            أنشئ كورسك الأول
          </Link>
        </div>
      )}
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
  const t = useTranslations('dashboard')
  const c = useTranslations('common')
  const { toast } = useToast()

  const q = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await get('/users/dashboard')
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
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : q.isError ? (
        <div className="rounded-2xl p-8 border border-border bg-surface shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-sm text-muted mb-5 font-medium">{c('empty')}</p>
          <button 
            type="button"
            className="px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-all duration-200 shadow-md hover:shadow-lg"
            onClick={() => { 
              toast({ 
                title: c('loading'), 
                description: 'جاري إعادة تحميل البيانات...' 
              }) 
              q.refetch() 
            }}
          >
            {c('retry')}
          </button>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mb-8">
            <Stat 
              label={t('enrolled_courses')} 
              value={stats?.enrolledCourses ?? 0} 
              icon={<BookOpen className="h-5 w-5" />}
              color="from-[#5120c8] to-indigo-600"
              delay={0}
            />
            <Stat 
              label={t('completed_courses')} 
              value={stats?.completedCourses ?? 0} 
              icon={<CheckCircle className="h-5 w-5" />}
              color="from-emerald-500 to-green-600"
              delay={1}
            />
            <Stat 
              label={t('certificates_earned')} 
              value={stats?.certificatesEarned ?? 0} 
              icon={<Target className="h-5 w-5" />}
              color="from-amber-500 to-orange-600"
              delay={2}
            />
          </div>

          {/* Recommended Courses */}
          <div className="rounded-2xl p-6 lg:p-8 border border-border bg-surface shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-bold text-foreground">{t('courses')}</h3>
            </div>
            
            {courses.length ? (
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.slice(0, 6).map((course: CourseCardCourse, idx: number) => (
                  <div key={course.id} style={{ animationDelay: `${idx * 0.1}s` }} className="animate-fade-up" >
                    <CourseCard course={course} locale={locale} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-2 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-muted opacity-40" />
                </div>
                <p className="text-sm text-muted font-medium">{c('empty')}</p>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardShell>
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
      className={`rounded-2xl p-6 border border-border bg-surface shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-up stagger-${delay + 1}`}
    >
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-md`}>
        {icon || <BookOpen className="h-5 w-5 text-white" />}
      </div>
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-extrabold text-foreground" style={{ fontFamily: 'PingARLT, sans-serif' }}>
        {value}
      </p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   CONSULTANT OVERVIEW — PROFESSIONAL
   ════════════════════════════════════════════════════════ */

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

  const consultantStats = [
    { label: 'طلبات جديدة', value: pending.length, icon: Clock, color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-500/10' },
    { label: 'جلسات مؤكدة', value: confirmed.length, icon: CheckCircle, color: 'from-[#5120c8] to-indigo-600', bgColor: 'bg-[#5120c8]/10' },
    { label: 'جلسات مكتملة', value: completed.length, icon: Target, color: 'from-emerald-500 to-green-600', bgColor: 'bg-emerald-500/10' },
    { label: 'الإيرادات', value: `${totalRevenue} ريال`, icon: DollarSign, color: 'from-purple-500 to-violet-600', bgColor: 'bg-purple-500/10' },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-8" dir="rtl">
      
      {/* Welcome Header */}
      <div className="rounded-2xl p-8 border border-border bg-surface shadow-sm animate-fade-up relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-[clamp(24px,3.5vw,34px)] font-bold text-foreground tracking-tight flex items-center gap-2">
                مرحباً يا {firstName}
                {user?.isVerified && <VerifiedBadge size="sm" showTooltip={false} />}
              </h1>
              <p className="text-sm text-muted mt-1 font-medium">لوحة تحكم المستشار — تابع جلساتك واستشاراتك</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {consultantStats.map((s, i) => (
          <div 
            key={i} 
            className={`rounded-2xl p-5 border border-border bg-surface shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-up stagger-${i + 1}`}
          >
            <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} shadow-md`}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-foreground" style={{ fontFamily: 'PingARLT, sans-serif' }}>{s.value}</p>
            <p className="text-xs text-muted mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Sessions */}
      {pending.length > 0 && (
        <div className="animate-fade-up stagger-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-lg font-bold text-foreground">طلبات تحتاج موافقة ({pending.length})</h2>
          </div>
          
          <div className="space-y-4">
            {pending.map((s: any) => (
              <div key={s.id} className="rounded-2xl p-6 border border-amber-500/25 bg-gradient-to-r from-amber-500/[0.04] to-transparent hover:from-amber-500/[0.08] transition-all duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <p className="font-semibold text-foreground">{s.topic || 'جلسة استشارية'}</p>
                    </div>
                    <p className="text-sm text-muted">
                      {s.scheduledAt ? new Date(s.scheduledAt).toLocaleDateString('ar-SA', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : '—'} 
                      <span className="mx-2">•</span> 
                      <span className="font-medium text-foreground">{s.meetingMethod}</span>
                    </p>
                    <p className="font-bold text-amber-600 text-lg mt-2" style={{ fontFamily: 'PingARLT, sans-serif' }}>
                      {s.price} ريال
                    </p>
                  </div>
                  
                  <div className="flex gap-3 shrink-0">
                    <button 
                      onClick={() => confirmSession(s.id)} 
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <CheckCircle2 className="h-4 w-4 inline ml-1" />قبول
                    </button>
                    <button 
                      onClick={() => cancelSession(s.id)} 
                      className="px-5 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-sm font-bold border border-red-500/20 hover:bg-red-500/20 transition-all duration-200"
                    >
                      <XCircle className="h-4 w-4 inline ml-1" />رفض
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Sessions */}
      {confirmed.length > 0 && (
        <div className="animate-fade-up stagger-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-lg font-bold text-foreground">الجلسات القادمة ({confirmed.length})</h2>
          </div>
          
          <div className="space-y-3">
            {confirmed.slice(0, 5).map((s: any) => (
              <div key={s.id} className="rounded-2xl p-5 border border-border bg-surface hover:shadow-md hover:border-emerald-500/30 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground mb-1">{s.topic || 'جلسة استشارية'}</p>
                    <p className="text-sm text-muted">
                      {s.scheduledAt ? new Date(s.scheduledAt).toLocaleDateString('ar-SA') : '—'}
                    </p>
                  </div>
                  
                  <div className="text-left">
                    <span className="inline-block px-4 py-1.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                      {s.meetingMethod}
                    </span>
                    <p className="font-bold text-amber-600 text-base mt-2" style={{ fontFamily: 'PingARLT, sans-serif' }}>
                      {s.price} ريال
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {sessions.length === 0 && (
        <div className="rounded-2xl p-16 text-center border-2 border-dashed border-border-strong bg-surface/50 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-600/10 flex items-center justify-center">
            <Calendar className="h-10 w-10 text-primary opacity-50" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">لا توجد جلسات بعد</h3>
          <p className="text-sm text-muted">سيظهر هنا الجلسات الاستشارية عندما يتم حجزها</p>
        </div>
      )}
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
      icon: <Shield size={22} color="#fff"/>,
      title: 'لوحة تحكم الإدارة',
      desc: 'إدارة المستخدمين والكورسات والإعدادات',
      href: `/${locale}/admin`,
      bg: 'linear-gradient(135deg,rgba(81,32,200,0.2),rgba(124,58,237,0.15))',
      border: 'rgba(81,32,200,0.3)',
      iconBg: 'linear-gradient(135deg,#5120c8,#7c3aed)',
      chevronColor: '#5120c8',
    }
    if (accountType === 'INSTRUCTOR') return {
      icon: <BookOpen size={22} color="#fff"/>,
      title: 'إنشاء كورس جديد',
      desc: 'ابدأ في تدريس وإنشاء محتوى تعليمي احترافي',
      href: `/${locale}/dashboard/create-course`,
      bg: 'linear-gradient(135deg,rgba(43,191,163,0.15),rgba(5,150,105,0.1))',
      border: 'rgba(43,191,163,0.3)',
      iconBg: 'linear-gradient(135deg,#2BBFA3,#059669)',
      chevronColor: '#2BBFA3',
    }
    if (accountType === 'CONSULTANT') return {
      icon: <Calendar size={22} color="#fff"/>,
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
      <div className="p-6 lg:p-8 space-y-6">
        {/* Skeleton Welcome Card */}
        <div className="rounded-2xl p-8 bg-surface border border-border">
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <Skeleton className="h-4 w-72 rounded-lg" />
            </div>
          </div>
        </div>
        
        {/* Skeleton Stats */}
        <div className="grid gap-5 sm:grid-cols-3">
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
            <div style={{color:isAr?'#fff':'#0d0d0d',fontWeight:700,fontSize:15}}>{roleCard.title}</div>
            <div style={{color:'#6b7280',fontSize:13,marginTop:2}}>{roleCard.desc}</div>
          </div>
          <ChevronLeft size={18} color={roleCard.chevronColor}/>
        </Link>
      )}
      {user?.accountType === 'INSTRUCTOR' ? <InstructorOverview /> :
       user?.accountType === 'CONSULTANT' ? <ConsultantOverview /> :
       <StudentOverview />}
    </AuthGate>
  )
}