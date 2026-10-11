'use client'
import { useEffect, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { CheckCircle2, XCircle, FileText, ExternalLink, RotateCcw, Target, BarChart3, TrendingUp, AlertCircle } from 'lucide-react'
import { get } from '@/lib/api'
import ScoreCircle from '@/components/quizzes/ScoreCircle'

const TYPE_LABEL: Record<string, string> = {
  MCQ: 'اختيار من متعدد',
  SHORT_ANSWER: 'سؤال مقالي',
  FILE_UPLOAD: 'رفع ملف',
}

export default function QuizResultPage() {
  const params = useParams()
  const router = useRouter()
  const search = useSearchParams()
  const locale = useLocale()
  const qc = useQueryClient()
  const courseId = params.courseId as string
  const quizId = params.quizId as string
  const aid = search.get('aid')

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['student-attempt-result', aid],
    queryFn: async () => {
      if (!aid) return null
      const res = await get(`/quizzes/attempts/${aid}/mine`)
      return (res?.data as any)?.data ?? null
    },
    enabled: !!aid,
    retry: false,
  })

  const attempt = data
  const finished = attempt?.status === 'GRADED' || attempt?.status === 'SUBMITTED'
  const errStatus = (error as any)?.response?.status

  useEffect(() => {
    if (!aid) return
    // Wait until the query has settled before deciding anything.
    if (isLoading || isFetching) return
    // The attempt really doesn't exist / isn't ours → go back to the course.
    if (errStatus === 404 || errStatus === 403) {
      router.replace(`/${locale}/learn/${courseId}`)
      return
    }
    // Attempt exists but is still in progress → resume it.
    if (data && data.status !== 'GRADED' && data.status !== 'SUBMITTED') {
      router.replace(`/${locale}/learn/${courseId}/quiz/${quizId}`)
    }
  }, [aid, isLoading, isFetching, errStatus, data, router, locale, courseId, quizId])

  // Refresh quiz queries so navigating back to the lesson shows fresh state.
  useEffect(() => {
    qc.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) && q.queryKey.some((k) => String(k).includes('quiz')),
    })
  }, [qc])

  const stats = useMemo(() => {
    const questions: any[] = attempt?.questions ?? []
    if (questions.length === 0) return null
    let correct = 0
    let wrong = 0
    let skipped = 0
    const needsReview: number[] = []
    const byType: Record<string, { total: number; correct: number; pending: number }> = {}

    questions.forEach((q, idx) => {
      const t = String(q?.type || '').toUpperCase()
      if (!byType[t]) byType[t] = { total: 0, correct: 0, pending: 0 }
      byType[t].total++

      const a = q.answer
      const isAnswered =
        (Array.isArray(a?.selectedChoiceIds) && a.selectedChoiceIds.length > 0) ||
        (typeof a?.textAnswer === 'string' && a.textAnswer.trim().length > 0) ||
        (typeof a?.fileUrl === 'string' && a.fileUrl.length > 0)

      if (!isAnswered) {
        skipped++
        needsReview.push(idx + 1)
        return
      }
      if (t === 'MCQ') {
        if (a?.autoGrade != null && a.autoGrade > 0) {
          correct++
          byType[t].correct++
        } else {
          wrong++
          needsReview.push(idx + 1)
        }
      } else if (a?.manualGrade != null) {
        if (a.manualGrade > 0) {
          correct++
          byType[t].correct++
        } else {
          wrong++
          needsReview.push(idx + 1)
        }
      } else {
        byType[t].pending++
        needsReview.push(idx + 1)
      }
    })

    return { total: questions.length, correct, wrong, skipped, needsReview, byType }
  }, [attempt])

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-10 w-64 animate-pulse rounded-[10px] bg-[color:var(--surface-2)]" />
          <div className="h-40 animate-pulse rounded-[14px] bg-[color:var(--surface-2)]" />
        </div>
      </div>
    )
  }

  if (error && !attempt && errStatus !== 404 && errStatus !== 403) {
    return (
      <div className="min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm text-[color:var(--muted)]">تعذر تحميل النتيجة</p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-[10px] bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:opacity-90"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-2xl text-center text-sm text-[color:var(--muted)]">
          النتيجة غير متاحة حالياً
        </div>
      </div>
    )
  }

  const pct = Math.round(attempt.scores.percentage)
  const isGradedStatus = attempt.status === 'GRADED'
  const passed = isGradedStatus ? attempt.scores.passed : null
  const circumference = 2 * Math.PI * 48
  const ringColor = !isGradedStatus ? '#f59e0b' : passed ? '#10b981' : '#ef4444'

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-foreground" dir="rtl">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-center">
          <h1 className="text-xl font-bold font-madinet text-foreground">{attempt.quiz.titleAr || attempt.quiz.title}</h1>
          <div className="mt-4 flex justify-center">
            <ScoreCircle percentage={attempt.scores.percentage} passed={attempt.status === 'GRADED' ? attempt.scores.passed : null} size={100} />
          </div>
          {attempt.status === 'SUBMITTED' && (
            <p className="mt-4 text-sm text-[#5120c8]">بانتظار التصحيح اليدوي من المعلم</p>
          )}
          {attempt.status === 'GRADED' && (
            <p className={`mt-4 text-sm font-semibold ${attempt.scores.passed ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
              {attempt.scores.passed ? 'تم اجتياز الاختبار' : 'لم يتم اجتياز الاختبار'}
            </p>
          )}
          {attempt.status === 'GRADED' && !attempt.scores.passed && (
            <div
              style={{
                marginTop: '20px',
                padding: '20px',
                borderRadius: '14px',
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.25)',
                textAlign: 'right',
              }}
            >
              <p style={{ color: '#EF4444', fontWeight: 700, marginBottom: '6px' }}>لم تجتز الاختبار</p>
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '14px' }}>
                {attempt.attemptsRemaining === null
                  ? `محاولاتك المتبقية: غير محدودة (${attempt.attemptCount} محاولة حتى الآن)`
                  : attempt.attemptsRemaining > 0
                    ? `المحاولات المتبقية: ${attempt.attemptsRemaining} من ${attempt.quiz.maxAttempts}`
                    : 'لا توجد محاولات متبقية — تواصل مع المحاضر'}
              </p>
              {attempt.canRetake ? (
                <a
                  href={`/${locale}/learn/${courseId}/quiz/${quizId}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: '#5120C8',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                >
                  <RotateCcw size={14} />
                  إعادة المحاولة
                </a>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: '12px' }}>لا يمكن إعادة المحاولة — تواصل مع المحاضر</p>
              )}
            </div>
          )}
          {attempt.teacherNotes && (
            <p className="mt-4 rounded-[10px] bg-[color:var(--surface-2)]/60 p-3 text-sm text-foreground">{attempt.teacherNotes}</p>
          )}
        </div>

        {stats && (
          <div
            style={{
              marginTop: '24px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            <div className="flex items-center gap-2" style={{ marginBottom: '20px' }}>
              <Target size={20} style={{ color: '#5120c8' }} />
              <h2 style={{ fontWeight: 800, fontSize: '17px', color: 'var(--foreground)' }}>تحليل النتيجة</h2>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8" style={{ marginBottom: '22px' }}>
              <div style={{ position: 'relative', width: 120, height: 120 }}>
                <svg width={120} height={120}>
                  <circle cx={60} cy={60} r={48} fill="none" stroke="var(--surface-2)" strokeWidth={10} />
                  <circle
                    cx={60}
                    cy={60}
                    r={48}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--foreground)' }}>{pct}%</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>النسبة</span>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div
                  className="flex items-center gap-2"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '999px',
                    fontWeight: 800,
                    fontSize: '14px',
                    background: !isGradedStatus ? 'rgba(245,158,11,0.12)' : passed ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                    color: !isGradedStatus ? '#f59e0b' : passed ? '#10b981' : '#ef4444',
                  }}
                >
                  {!isGradedStatus ? <AlertCircle size={16} /> : passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {!isGradedStatus ? 'بانتظار المراجعة' : passed ? 'نجحت' : 'لم تنجح'}
                </div>
                <p style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
                  درجة النجاح: {attempt.quiz.passingScore}%
                </p>
              </div>
            </div>

            {attempt.status === 'SUBMITTED' && (
              <div
                className="flex items-start gap-2"
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(81,32,200,0.06)',
                  border: '1px solid rgba(81,32,200,0.2)',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: 'var(--foreground)',
                }}
              >
                <AlertCircle size={16} style={{ color: '#5120c8', flexShrink: 0, marginTop: 2 }} />
                <span>
                  بعض الأسئلة تحتاج مراجعة يدوية. الإحصائيات أدناه تعرض الأسئلة التلقائية فقط — سيتم إشعارك عند اكتمال التصحيح.
                </span>
              </div>
            )}

            <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
              <BarChart3 size={16} style={{ color: '#5120c8' }} />
              <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--foreground)' }}>إحصائيات</h3>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '10px',
                marginBottom: '22px',
              }}
            >
              {[
                { label: 'إجمالي الأسئلة', value: stats.total, color: 'var(--foreground)' },
                { label: 'صحيحة', value: stats.correct, color: '#10b981' },
                { label: 'خاطئة', value: stats.wrong, color: '#ef4444' },
                { label: 'بدون إجابة', value: stats.skipped, color: 'var(--muted)' },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2" style={{ marginBottom: '12px' }}>
              <TrendingUp size={16} style={{ color: '#5120c8' }} />
              <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--foreground)' }}>حسب نوع السؤال</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '22px' }}>
              {Object.entries(stats.byType).map(([type, t]) => {
                const typePct = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0
                return (
                  <div key={type} className="flex items-center justify-between gap-3" style={{ fontSize: '13px' }}>
                    <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{TYPE_LABEL[type] ?? type}</span>
                    <span style={{ color: 'var(--muted)' }}>
                      {t.correct}/{t.total} صحيحة ({typePct}%)
                      {t.pending > 0 && ` · ${t.pending} بانتظار المراجعة`}
                    </span>
                  </div>
                )
              })}
            </div>

            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px',
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
                <AlertCircle size={16} style={{ color: '#5120c8' }} />
                <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--foreground)' }}>توصيات</span>
              </div>
              {stats.needsReview.length > 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7 }}>
                  راجع الأسئلة: {stats.needsReview.join('، ')}
                </p>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--muted)' }}>أداء ممتاز — لا توجد أسئلة تحتاج مراجعة.</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-5">
          {attempt.questions.map((q: any, index: number) => {
            const answer = q.answer
            const isMcq = q.type === 'MCQ'
            const selected = new Set(answer?.selectedChoiceIds ?? [])

            return (
              <div key={q.id} className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{index + 1}</span>
                  <span className="rounded-full bg-[color:var(--surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--muted)] border border-[color:var(--border)]">
                    {TYPE_LABEL[q.type] ?? q.type}
                  </span>
                  <span className="text-xs font-semibold text-[color:var(--muted)]">{q.points} نقطة</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{q.questionText}</p>
                {q.questionImage && (
                  <img
                    src={q.questionImage}
                    alt=""
                    style={{
                      maxWidth: '100%',
                      maxHeight: '400px',
                      borderRadius: '12px',
                      marginTop: '12px',
                      border: '1px solid var(--border)',
                      display: 'block',
                    }}
                  />
                )}

                {isMcq && finished && (
                  <div className="mt-3 space-y-2">
                    {q.choices.map((c: any) => {
                      const isSelected = selected.has(c.id)
                      const correct = c.isCorrect
                      let cls = 'border-[color:var(--border)] bg-[color:var(--surface-2)]'
                      if (correct) cls = 'border-[#10b981]/40 bg-[#10b981]/10'
                      else if (isSelected) cls = 'border-[#ef4444]/40 bg-[#ef4444]/10'
                      return (
                        <div key={c.id} className={`flex items-center gap-2 rounded-[10px] border px-3 py-2 text-sm ${cls}`}>
                          {correct ? (
                            <CheckCircle2 className="h-4 w-4 text-[#10b981]" />
                          ) : isSelected ? (
                            <XCircle className="h-4 w-4 text-[#ef4444]" />
                          ) : (
                            <span className="h-4 w-4 rounded-full border border-[color:var(--border)]" />
                          )}
                          <span className="text-foreground">{c.text}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {q.type === 'SHORT_ANSWER' && (
                  <div className="mt-3 rounded-[10px] bg-[color:var(--surface-2)]/60 p-3 text-sm text-foreground">
                    {answer?.textAnswer || <span className="text-xs text-[color:var(--muted)]">—</span>}
                  </div>
                )}

                {q.type === 'FILE_UPLOAD' && answer?.fileUrl && (
                  <a
                    href={answer.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-[10px] bg-[#5120c8]/10 px-4 py-2 text-sm font-semibold text-[#5120c8] hover:bg-[#5120c8]/20 transition-colors duration-150"
                  >
                    <FileText className="h-4 w-4" />
                    {answer.fileName || 'الملف المرفق'}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                {finished && answer && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {answer.autoGrade != null && (
                      <span className="rounded-full bg-[color:var(--surface-2)] px-2.5 py-1 border border-[color:var(--border)]">
                        تلقائي: {Math.round(answer.autoGrade)}/{q.points}
                      </span>
                    )}
                    {answer.manualGrade != null && (
                      <span className="rounded-full bg-[color:var(--surface-2)] px-2.5 py-1 border border-[color:var(--border)]">
                        يدوي: {Math.round(answer.manualGrade)}/{q.points}
                      </span>
                    )}
                    {answer.feedback && <span className="text-[color:var(--muted)]">{answer.feedback}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}