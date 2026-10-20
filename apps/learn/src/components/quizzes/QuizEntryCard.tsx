'use client'
import { useParams, useRouter } from 'next/navigation'
import { Clock, FileQuestion, Play, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { get } from '@/lib/api'
import { useLocale } from 'next-intl'

interface AttemptSummary {
  id: string
  status: string
  percentage: number
  passed: boolean
}

interface QuizSummary {
  id: string
  title: string
  titleAr: string | null
  durationMinutes: number
  passingScore: number
  allowRetake: boolean
  maxAttempts: number
  canRetake?: boolean
  attemptsRemaining?: number | null
  attemptCount?: number
  bestAttempt?: AttemptSummary | null
  lastAttempt?: AttemptSummary | null
  _count: { questions: number }
}

export default function QuizEntryCard({
  lessonId,
  locked = false,
  lockHint,
}: {
  lessonId?: string | null
  /** When true, the quiz cannot be started yet (e.g. the lesson video is unwatched). */
  locked?: boolean
  /** Short explanation shown under the button while locked. */
  lockHint?: string
}) {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const courseId = params.courseId as string

  const { data } = useQuery({
    queryKey: ['lesson-quiz-active', lessonId],
    queryFn: async () => {
      if (!lessonId) return null
      const res = await get(`/quizzes/lesson/${lessonId}/active`)
      return (res?.data as any)?.data ?? null
    },
    enabled: !!lessonId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  const quiz: QuizSummary | null = data

  if (!quiz) return null

  const rawLast = quiz.lastAttempt ?? null
  // An abandoned attempt is treated as if it never happened (it does not count
  // against the retake cap), so it must not drive the card's label.
  const last = rawLast && rawLast.status !== 'ABANDONED' ? rawLast : null
  const best = quiz.bestAttempt ?? null
  const attemptCount = quiz.attemptCount ?? 0
  const canRetake = quiz.canRetake ?? false
  const remaining = quiz.attemptsRemaining

  const quizHref = `/${locale}/learn/${courseId}/quiz/${quiz.id}`
  const isGraded = best?.status === 'GRADED'
  // Prefer the student's most recent graded/submitted attempt, else fall back to
  // their best graded attempt. Only link to an attempt that is actually viewable
  // — an invalid/missing `aid` makes the result page redirect to the course page.
  const viewAttempt =
    last && (last.status === 'GRADED' || last.status === 'SUBMITTED')
      ? last
      : best && (best.status === 'GRADED' || best.status === 'SUBMITTED')
        ? best
        : null
  const canShowResult = !!viewAttempt?.id
  const resultHref = canShowResult
    ? `${quizHref}/result?aid=${viewAttempt!.id}`
    : quizHref

  let label = 'ابدأ الاختبار'
  let variant: 'primary' | 'secondary' | 'muted' = 'primary'
  let Icon = Play
  let disabled = false
  let helper: string | null = null
  let secondaryHref: string | null = null
  let onClick: () => void = () => router.push(quizHref)

  if (attemptCount === 0) {
    label = 'ابدأ الاختبار'
    variant = 'primary'
    Icon = Play
  } else if (last?.status === 'IN_PROGRESS') {
    label = 'أكمل الاختبار'
    variant = 'primary'
    Icon = Play
  } else if (last?.status === 'SUBMITTED') {
    label = 'قيد المراجعة…'
    variant = 'muted'
    disabled = true
    Icon = Clock
  } else if (isGraded && best?.passed) {
    label = 'عرض النتيجة'
    variant = 'secondary'
    Icon = CheckCircle2
    onClick = () => router.push(resultHref)
  } else if (isGraded && !best?.passed && canRetake) {
    label = `إعادة المحاولة (${remaining === null || remaining === undefined ? '∞' : remaining})`
    variant = 'primary'
    Icon = AlertCircle
  } else if (isGraded && !best?.passed && !canRetake) {
    label = 'لا يمكن الإعادة'
    variant = 'muted'
    disabled = true
    Icon = XCircle
    helper = 'لا يمكن إعادة المحاولة — تواصل مع المحاضر'
    secondaryHref = canShowResult ? resultHref : null
  }

  // The video gate applies only to actions that would START a quiz. Viewing an
  // already-submitted/graded result stays available while locked.
  const startsQuiz = !disabled && onClick !== undefined && label !== 'عرض النتيجة'
  if (locked && startsQuiz) {
    disabled = true
    helper = lockHint ?? 'يجب مشاهدة الفيديو أولاً'
  }

  const btnStyle: React.CSSProperties =
    variant === 'primary'
      ? { background: '#5120c8', color: '#fff' }
      : {
          background: 'var(--surface-2)',
          color: variant === 'muted' ? 'var(--muted)' : 'var(--foreground)',
          border: '1px solid var(--border)',
        }

  return (
    <div
      className="mb-6 rounded-2xl p-5 border"
      style={{
        background: 'color-mix(in srgb, var(--card), transparent 5%)',
        borderColor: 'var(--border)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.02)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'rgba(81,32,200,0.08)' }}>
            <FileQuestion className="h-6 w-6" style={{ color: '#5120c8' }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-foreground truncate">{quiz.titleAr || quiz.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]">
              <span className="flex items-center gap-1">
                <FileQuestion className="h-3.5 w-3.5" />
                {quiz._count.questions} سؤال
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {quiz.durationMinutes} دقيقة
              </span>
              <span>درجة النجاح: {quiz.passingScore}%</span>
              {isGraded && best && (
                <span className="font-semibold" style={{ color: best.passed ? '#10b981' : '#ef4444' }}>
                  أفضل نتيجة: {Math.round(best.percentage)}%
                </span>
              )}
              {isGraded && best && !best.passed && (
                <span>
                  {remaining === null || remaining === undefined
                    ? `محاولاتك المتبقية: غير محدودة (${attemptCount} محاولة حتى الآن)`
                    : remaining > 0
                      ? `المحاولات المتبقية: ${remaining} من ${quiz.maxAttempts}`
                      : 'لا توجد محاولات متبقية — تواصل مع المحاضر'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-opacity duration-150"
            style={{ ...btnStyle, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1 }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
          {helper && (
            <span className="text-[11px] text-[color:var(--muted)]">{helper}</span>
          )}
          {secondaryHref && (
            <a
              href={secondaryHref}
              className="text-[11px] font-semibold text-[#5120c8] hover:opacity-80 transition-opacity duration-150"
            >
              عرض نتيجتك
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
