'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'
import { ArrowRight, Clock, Send, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import { get, post } from '@/lib/api'
import StatusBadge from '@/components/quizzes/StatusBadge'

const inputCls = 'w-full rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors duration-150 placeholder:text-[color:var(--muted)]'

const TYPE_LABEL: Record<string, string> = {
  MCQ: 'اختيار من متعدد',
  SHORT_ANSWER: 'سؤال مقالي',
  FILE_UPLOAD: 'رفع ملف',
}

export default function TakeQuizPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const courseId = params.courseId as string
  const quizId = params.quizId as string
  const qc = useQueryClient()

  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [autoSaving, setAutoSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [endsAt, setEndsAt] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const { data: startData, isLoading } = useQuery({
    queryKey: ['student-start-quiz', quizId],
    queryFn: async () => {
      const res = await get(`/quizzes/${quizId}/start`)
      return (res?.data as any)?.data ?? null
    },
    enabled: !!quizId,
    staleTime: 0,
  })

  useEffect(() => {
    if (startData) {
      setAttemptId(startData.attemptId)
      setQuestions(startData.quiz.questions ?? [])
      setEndsAt(new Date(startData.endsAt))
    }
  }, [startData])

  // Timer
  useEffect(() => {
    if (!endsAt) return
    const tick = () => {
      const now = Date.now()
      const end = endsAt.getTime()
      const diff = end - now
      if (diff <= 0) {
        setTimeLeft(0)
        if (!submitting) {
          toast.error('انتهى وقت الاختبار، سيتم التسليم تلقائياً')
          handleSubmit(true)
        }
      } else {
        setTimeLeft(diff)
      }
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [endsAt, submitting])

  // Auto-save every 800ms for MCQ selection (debounced-ish behavior via effect)
  useEffect(() => {
    if (!attemptId) return
    const mcqAnswers: Array<[string, any]> = Object.entries(answers).filter(([qid]) => {
      const q = questions.find((x) => x.id === qid)
      return q && q.type === 'MCQ'
    })
    if (mcqAnswers.length === 0) return
    setAutoSaving(true)
    const t = setTimeout(async () => {
      try {
        for (const [questionId, ans] of mcqAnswers) {
          await post(`/quizzes/attempts/${attemptId}/answer`, { questionId, ...ans })
        }
      } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'فشل الحفظ التلقائي')
      } finally {
        setAutoSaving(false)
      }
    }, 800)
    return () => clearTimeout(t)
  }, [answers, attemptId, questions])

  const setMcq = (questionId: string, choiceId: string) => {
    const q = questions.find((x) => x.id === questionId)
    if (!q) return
    setAnswers((prev) => {
      const existing = prev[questionId]?.selectedChoiceIds ?? []
      if (q.allowMultipleAnswers) {
        const next = existing.includes(choiceId)
          ? existing.filter((id: string) => id !== choiceId)
          : [...existing, choiceId]
        return { ...prev, [questionId]: { selectedChoiceIds: next } }
      }
      return { ...prev, [questionId]: { selectedChoiceIds: [choiceId] } }
    })
  }

  const setText = (questionId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { textAnswer: text } }))
  }

  const setFileMeta = (questionId: string, meta: { fileUrl: string; fileName: string }) => {
    setAnswers((prev) => ({ ...prev, [questionId]: meta }))
  }

  const handleSubmit = async (auto = false) => {
    if (!attemptId) return
    if (!auto && submitting) return
    setSubmitting(true)
    try {
      await post(`/quizzes/attempts/${attemptId}/submit`)
      toast.success('تم تسليم الاختبار')
      router.push(`/${locale}/learn/${courseId}/quiz/${quizId}/result?aid=${attemptId}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'تعذر تسليم الاختبار')
    } finally {
      setSubmitting(false)
    }
  }

  const beforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault()
    e.returnValue = ''
  }

  useEffect(() => {
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [])

  const formatTime = (ms: number | null) => {
    if (ms == null || ms < 0) return '00:00'
    const total = Math.floor(ms / 1000)
    const min = Math.floor(total / 60)
    const sec = total % 60
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const getTimerColor = (ms: number | null) => {
    if (ms == null) return 'var(--foreground)'
    const totalMin = ms / (60 * 1000)
    if (totalMin < 1) return '#ef4444'
    if (totalMin < 5) return '#f59e0b'
    return '#10b981'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-10 w-64 animate-pulse rounded-[10px] bg-[color:var(--surface-2)]" />
          <div className="h-40 animate-pulse rounded-[14px] bg-[color:var(--surface-2)]" />
        </div>
      </div>
    )
  }

  if (!startData) {
    return (
      <div className="min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-2xl text-center text-sm text-[color:var(--muted)]">
          لا يمكن بدء الاختبار الآن
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-foreground" dir="rtl">
      <div className="sticky top-0 z-10 border-b border-[color:var(--border)] bg-[color:var(--surface)]">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="font-bold font-madinet text-foreground">{startData.quiz.titleAr || startData.quiz.title}</h1>
            <p className="text-xs text-[color:var(--muted)]">{questions.length} سؤال</p>
          </div>
          <div className="flex items-center gap-3">
            {autoSaving && <span className="text-xs text-[color:var(--muted)]">جارٍ الحفظ...</span>}
            <div className="flex items-center gap-2 rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2">
              <Clock className="h-4 w-4" style={{ color: getTimerColor(timeLeft) }} />
              <span className="text-sm font-bold" style={{ color: getTimerColor(timeLeft) }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="space-y-5">
          {questions.map((q, index) => {
            const ans = answers[q.id]
            const isMcq = q.type === 'MCQ'
            const selected = new Set(ans?.selectedChoiceIds ?? [])

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
                {q.note && <p className="mt-1 text-xs text-[color:var(--muted)]">{q.note}</p>}

                {isMcq && (
                  <div className="mt-4 space-y-2">
                    {(q.choices ?? []).map((c: any) => {
                      const checked = selected.has(c.id)
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setMcq(q.id, c.id)}
                          className={`flex w-full items-center gap-2 rounded-[10px] border px-3 py-2.5 text-right text-sm transition-colors duration-150 ${
                            checked
                              ? 'border-[#5120c8]/60 bg-[#5120c8]/10 text-foreground'
                              : 'border-[color:var(--border)] bg-[color:var(--surface-2)] text-foreground hover:opacity-80'
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              checked ? 'border-[#5120c8] bg-[#5120c8]' : 'border-[color:var(--border)]'
                            }`}
                          >
                            {checked && <span className="h-2 w-2 rounded-full bg-white" />}
                          </span>
                          <span>{c.text}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {q.type === 'SHORT_ANSWER' && (
                  <textarea
                    className={`${inputCls} mt-3 min-h-[90px] resize-y`}
                    value={ans?.textAnswer ?? ''}
                    onChange={(e) => setText(q.id, e.target.value)}
                    placeholder="اكتب إجابتك هنا..."
                  />
                )}

                {q.type === 'FILE_UPLOAD' && (
                  <div className="mt-3 rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface-2)]/60 p-4 text-sm text-[color:var(--muted)]">
                    <p className="mb-2">ارفع ملف إجابتك من الصفحة الرسمية لاحقاً أو استخدم رابط ملف (اختياري الآن)</p>
                    <input
                      className={inputCls}
                      value={ans?.fileUrl ?? ''}
                      onChange={(e) => setFileMeta(q.id, { fileUrl: e.target.value, fileName: e.target.value.split('/').pop() ?? 'file' })}
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>
            )
          })}

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="flex items-center gap-2 rounded-[10px] bg-[#10b981] px-5 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all duration-150"
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              تسليم الاختبار
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}