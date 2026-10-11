'use client'
import { useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { get } from '@/lib/api'
import { GraduationCap, BookOpen, CheckCircle2, XCircle, Clock, Filter } from 'lucide-react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import ScoreCircle from '@/components/quizzes/ScoreCircle'
import StatusBadge from '@/components/quizzes/StatusBadge'
import toast from 'react-hot-toast'

interface AttemptRow {
  id: string
  status: string
  percentage: number
  passed: boolean
  startedAt?: string
  submittedAt?: string | null
}

interface GradedQuiz {
  quizId: string
  quizTitle: string
  courseId: string
  courseTitle: string
  lessonTitle: string | null
  passingScore: number
  durationMinutes: number
  attemptCount: number
  attemptsRemaining: number | null
  canRetake: boolean
  bestAttempt: AttemptRow | null
  lastAttempt: AttemptRow | null
}

interface CourseGroup {
  courseId: string
  courseTitle: string
  quizzes: GradedQuiz[]
}

interface GradesResponse {
  summary: {
    total: number
    passed: number
    failed: number
    pending: number
    averageScore: number
  }
  courses: CourseGroup[]
}

export default function GradesPage() {
  const { user } = useAuth()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [courseFilter, setCourseFilter] = useState('')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['student-grades', courseFilter],
    queryFn: async () => {
      const res = await get('/quizzes/grades/mine', {
        params: courseFilter ? { courseId: courseFilter } : undefined,
      })
      return ((res?.data as any)?.data ?? null) as GradesResponse | null
    },
    enabled: !!user,
  })

  const summary = data?.summary
  const courses = useMemo(() => data?.courses ?? [], [data])

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="h-10 w-56 animate-pulse rounded-[10px] bg-[color:var(--surface-2)]" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-[14px] bg-[color:var(--surface-2)]" />
            ))}
          </div>
          <div className="h-56 animate-pulse rounded-[14px] bg-[color:var(--surface-2)]" />
        </div>
      </div>
    )
  }

  if (isError) {
    toast.error(
      (error as any)?.response?.data?.message ??
        (isAr ? 'تعذر تحميل الدرجات' : 'Failed to load grades'),
    )
  }

  const statCards = [
    { key: 'total', label: isAr ? 'إجمالي الاختبارات' : 'Total', value: summary?.total ?? 0, color: '#5120c8' },
    { key: 'passed', label: isAr ? 'ناجح' : 'Passed', value: summary?.passed ?? 0, color: '#10b981' },
    { key: 'failed', label: isAr ? 'راسب' : 'Failed', value: summary?.failed ?? 0, color: '#ef4444' },
    { key: 'pending', label: isAr ? 'قيد المراجعة' : 'Pending', value: summary?.pending ?? 0, color: '#f59e0b' },
    { key: 'avg', label: isAr ? 'المتوسط' : 'Average', value: `${summary?.averageScore ?? 0}%`, color: '#0d9488' },
  ]

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-foreground" dir="rtl">
      <div className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <h1 className="flex items-center gap-3 text-3xl font-bold font-madinet">
            <GraduationCap className="h-8 w-8" style={{ color: '#5120c8' }} />
            {isAr ? 'الدرجات' : 'Grades'}
          </h1>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {isAr ? 'نتائجك في اختبارات الكورسات التي التحقت بها' : 'Your quiz results across enrolled courses'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {statCards.map((s) => (
            <div
              key={s.key}
              className="rounded-[14px] border p-4"
              style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
            >
              <p className="text-xs font-semibold text-[color:var(--muted)]">{s.label}</p>
              <p className="mt-1 text-2xl font-extrabold" style={{ color: s.color }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {courses.length > 1 && (
          <div className="mt-6 flex items-center gap-2">
            <Filter className="h-4 w-4 text-[color:var(--muted)]" />
            <select
              className="rounded-[10px] border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--foreground)' }}
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="">{isAr ? 'كل الكورسات' : 'All courses'}</option>
              {courses.map((c) => (
                <option key={c.courseId} value={c.courseId}>
                  {c.courseTitle}
                </option>
              ))}
            </select>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="mt-8 rounded-[14px] border border-dashed p-12 text-center"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
            <GraduationCap className="mx-auto mb-3 h-10 w-10 text-[color:var(--muted)]" />
            <p className="text-sm text-[color:var(--muted)]">
              {isAr ? 'لا توجد نتائج اختبارات بعد' : 'No quiz results yet'}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {courses.map((course) => (
              <div key={course.courseId}>
                <div className="mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" style={{ color: '#5120c8' }} />
                  <h2 className="font-bold">{course.courseTitle}</h2>
                </div>
                <div className="space-y-3">
                  {course.quizzes.map((quiz) => (
                    <QuizGradeRow key={quiz.quizId} quiz={quiz} locale={locale} isAr={isAr} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function QuizGradeRow({ quiz, locale, isAr }: { quiz: GradedQuiz; locale: string; isAr: boolean }) {
  const base = `/${locale}/learn/${quiz.courseId}/quiz/${quiz.quizId}`
  const graded = quiz.bestAttempt?.status === 'GRADED'
  const inProgress = quiz.lastAttempt?.status === 'IN_PROGRESS' || quiz.lastAttempt?.status === 'SUBMITTED'

  let ctaLabel = isAr ? 'ابدأ الاختبار' : 'Start quiz'
  let ctaHref: string | null = base
  if (quiz.lastAttempt?.status === 'IN_PROGRESS') {
    ctaLabel = isAr ? 'أكمل الاختبار' : 'Resume quiz'
    ctaHref = base
  } else if (graded && quiz.bestAttempt) {
    ctaLabel = isAr ? 'عرض النتيجة' : 'View result'
    ctaHref = `${base}/result?aid=${quiz.bestAttempt.id}`
  } else if (quiz.lastAttempt?.status === 'SUBMITTED') {
    ctaLabel = isAr ? 'قيد المراجعة' : 'Awaiting review'
    ctaHref = null
  } else if (quiz.attemptCount > 0 && !quiz.canRetake) {
    ctaLabel = isAr ? 'لا يمكن الإعادة' : 'No retake'
    ctaHref = null
  } else if (quiz.attemptCount > 0) {
    ctaLabel = isAr ? 'إعادة المحاولة' : 'Retake'
    ctaHref = base
  }

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border p-4"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {graded && quiz.bestAttempt ? (
          <ScoreCircle percentage={quiz.bestAttempt.percentage} passed={quiz.bestAttempt.passed} size={64} />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
            style={{ background: 'var(--surface-2)' }}>
            <Clock className="h-6 w-6 text-[color:var(--muted)]" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-bold">{quiz.quizTitle}</h3>
            {quiz.lastAttempt && <StatusBadge status={quiz.lastAttempt.status} />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[color:var(--muted)]">
            {quiz.lessonTitle && <span>{quiz.lessonTitle}</span>}
            <span>{isAr ? 'درجة النجاح' : 'Passing'}: {quiz.passingScore}%</span>
            <span>
              {isAr ? 'المحاولات' : 'Attempts'}: {quiz.attemptCount}
              {quiz.attemptsRemaining === null
                ? ` (${isAr ? 'غير محدود' : 'unlimited'})`
                : ` (${isAr ? 'المتبقي' : 'left'}: ${quiz.attemptsRemaining})`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {graded && quiz.bestAttempt && (
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: quiz.bestAttempt.passed ? '#10b981' : '#ef4444' }}>
            {quiz.bestAttempt.passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {isAr ? 'أفضل نتيجة' : 'Best'}: {Math.round(quiz.bestAttempt.percentage)}%
          </span>
        )}
        {ctaHref ? (
          <Link
            href={ctaHref}
            className="rounded-[10px] px-4 py-2.5 text-sm font-bold text-white transition-opacity duration-150 hover:opacity-90"
            style={{ background: graded ? 'var(--surface-2)' : '#5120c8', color: graded ? 'var(--foreground)' : '#fff' }}
          >
            {ctaLabel}
          </Link>
        ) : (
          <span className="rounded-[10px] px-4 py-2.5 text-sm font-semibold text-[color:var(--muted)]"
            style={{ background: 'var(--surface-2)' }}>
            {ctaLabel}
          </span>
        )}
      </div>
    </div>
  )
}
