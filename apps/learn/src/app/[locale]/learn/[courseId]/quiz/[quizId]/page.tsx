'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { toast } from 'sonner'
import { ArrowRight, Clock, Send, CheckCircle2, AlertCircle, FileText, Upload } from 'lucide-react'
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
  const search = useSearchParams()
  const aidParam = search.get('aid')
  const qc = useQueryClient()

  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [autoSaving, setAutoSaving] = useState(false)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [endsAt, setEndsAt] = useState<Date | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [starting, setStarting] = useState(false)
  const autoSubmittedRef = useRef(false)

  // Read-only quiz metadata for the pre-start screen. This does NOT create an
  // attempt — the attempt is only created when the student clicks "ابدأ الاختبار".
  const { data: meta, isLoading: metaLoading } = useQuery({
    queryKey: ['student-quiz-meta', quizId],
    queryFn: async () => {
      const res = await get(`/quizzes/${quizId}/meta`)
      return (res?.data as any)?.data ?? null
    },
    enabled: !!quizId && !aidParam,
    staleTime: 60_000,
  })

  // When an attempt id is in the URL (back-navigation / refresh) verify its
  // status before rendering anything. Cache-Control disables browser caching.
  const { data: existingAttempt, isLoading: existingLoading } = useQuery({
    queryKey: ['student-attempt-mine', aidParam],
    queryFn: async () => {
      const res = await get(`/quizzes/attempts/${aidParam}/mine`, {
        headers: { 'Cache-Control': 'no-cache' },
      })
      return (res?.data as any)?.data ?? null
    },
    enabled: !!aidParam,
    staleTime: 0,
    retry: false,
  })

  const snapshot = existingAttempt
  const quizInfo = existingAttempt?.quiz ?? meta
  const showPreStart = !aidParam && !attemptId
  const isLoading = !attemptId && (aidParam ? existingLoading : metaLoading)
  const isFinished = !!existingAttempt && existingAttempt.status !== 'IN_PROGRESS'

  useEffect(() => {
    if (!aidParam || !existingAttempt) return
    // Finished attempt: never render the questions again — send to results.
    if (existingAttempt.status !== 'IN_PROGRESS') {
      router.replace(`/${locale}/learn/${courseId}/quiz/${quizId}/result?aid=${aidParam}`)
      return
    }
    setAttemptId(aidParam)
    setQuestions(existingAttempt.questions ?? [])
    setEndsAt(new Date(existingAttempt.endsAt))
    const hydrated: Record<string, any> = {}
    for (const q of existingAttempt.questions ?? []) {
      if (q.answer) {
        hydrated[q.id] = {
          selectedChoiceIds: q.answer.selectedChoiceIds ?? [],
          textAnswer: q.answer.textAnswer ?? undefined,
          fileUrl: q.answer.fileUrl ?? undefined,
          fileName: q.answer.fileName ?? undefined,
        }
      }
    }
    setAnswers(hydrated)
  }, [aidParam, existingAttempt, router, locale, courseId, quizId])

  // Browser Back/Forward must not restore a stale quiz view.
  useEffect(() => {
    const onPop = () => location.reload()
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Timer
  useEffect(() => {
    if (!endsAt) return
    const tick = () => {
      const now = Date.now()
      const end = endsAt.getTime()
      const diff = end - now
      if (diff <= 0) {
        setTimeLeft(0)
        if (!submitting && !autoSubmittedRef.current) {
          autoSubmittedRef.current = true
          toast.error('انتهى وقت الاختبار — جاري التسليم')
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

  const persistAnswer = async (questionId: string, payload: any) => {
    if (!attemptId) return
    await post(`/quizzes/attempts/${attemptId}/answer`, { questionId, ...payload })
  }

  // Auto-save every 800ms (debounced-ish behavior via effect)
  useEffect(() => {
    if (!attemptId) return
    const entries = Object.entries(answers)
    if (entries.length === 0) return
    setAutoSaving(true)
    const t = setTimeout(async () => {
      try {
        for (const [questionId, ans] of entries) {
          await post(`/quizzes/attempts/${attemptId}/answer`, { questionId, ...ans })
        }
      } catch (e: any) {
        toast.error(e?.response?.data?.message ?? 'فشل الحفظ التلقائي')
      } finally {
        setAutoSaving(false)
      }
    }, 800)
    return () => clearTimeout(t)
  }, [answers, attemptId])

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

  const onFileChange = async (questionId: string, file: File) => {
    if (!attemptId) return
    if (file.size > 20 * 1024 * 1024) {
      toast.error('حجم الملف يجب أن يكون أقل من 20 ميجا')
      return
    }
    setUploading((prev) => ({ ...prev, [questionId]: true }))
    try {
      const form = new FormData()
      form.append('file', file)
      const res = (await post('/upload/file', form)) as any
      const d = res?.data?.data
      const url: string | undefined = d?.url
      const name: string = d?.fileName || file.name
      if (!url) {
        toast.error('فشل رفع الملف')
        return
      }
      await persistAnswer(questionId, { fileUrl: url, fileName: name })
      setFileMeta(questionId, { fileUrl: url, fileName: name })
      toast.success(`تم رفع: ${name}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'فشل رفع الملف')
    } finally {
      setUploading((prev) => ({ ...prev, [questionId]: false }))
    }
  }

  const removeFile = async (questionId: string) => {
    setAnswers((prev) => {
      const next = { ...prev }
      delete next[questionId]
      return next
    })
    try {
      await persistAnswer(questionId, { selectedChoiceIds: [], textAnswer: null, fileUrl: null, fileName: null })
    } catch {
      // best effort — local state is what matters for submission blocking
    }
  }

  const isAnsweredLocally = (q: any, a: any) => {
    if (!a) return false
    if (Array.isArray(a.selectedChoiceIds) && a.selectedChoiceIds.length > 0) return true
    if (typeof a.textAnswer === 'string' && a.textAnswer.trim().length > 0) return true
    if (typeof a.fileUrl === 'string' && a.fileUrl.length > 0) return true
    return false
  }

  const handleSubmit = async (auto = false) => {
    if (!attemptId) return
    if (!auto && submitting) return

    if (!auto) {
      const missingIdx: number[] = []
      questions.forEach((q, i) => {
        if (!isAnsweredLocally(q, answers[q.id])) missingIdx.push(i + 1)
      })
      if (missingIdx.length > 0) {
        toast.warning(`لم تجب على ${missingIdx.length} سؤال: ${missingIdx.join('، ')}`)
        const first = questions.find((q) => !isAnsweredLocally(q, answers[q.id]))
        if (first) document.getElementById(`q-${first.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }

    setSubmitting(true)
    try {
      for (const [questionId, ans] of Object.entries(answers)) {
        try {
          await post(`/quizzes/attempts/${attemptId}/answer`, { questionId, ...ans })
        } catch {
          // non-blocking — the submit endpoint revalidates
        }
      }
      await post(`/quizzes/attempts/${attemptId}/submit`)
      // Refresh every quiz-related query so the lesson entry card reflects the
      // new attempt state immediately (no 5-minute stale window).
      await qc.invalidateQueries({ queryKey: ['lesson-quiz-active'] })
      await qc.invalidateQueries({ queryKey: ['student-quiz-meta', quizId] })
      await qc.invalidateQueries({ queryKey: ['student-attempt-mine'] })
      await qc.invalidateQueries({ queryKey: ['student-attempt-result'] })
      await qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) && q.queryKey.some((k) => String(k).includes('quiz')),
      })
      toast.success('تم تسليم الاختبار')
      router.push(`/${locale}/learn/${courseId}/quiz/${quizId}/result?aid=${attemptId}`)
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'تعذر تسليم الاختبار')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStart = async () => {
    if (starting) return
    setStarting(true)
    try {
      const res = await get(`/quizzes/${quizId}/start`)
      const data = (res?.data as any)?.data ?? null
      if (!data?.attemptId) throw new Error('NO_ATTEMPT')
      setAttemptId(data.attemptId)
      setQuestions(data.quiz?.questions ?? [])
      setEndsAt(new Date(data.endsAt))
      autoSubmittedRef.current = false
      router.replace(`/${locale}/learn/${courseId}/quiz/${quizId}?aid=${data.attemptId}`)
    } catch (e: any) {
      const code = e?.response?.data?.code
      const reason = e?.response?.data?.reason
      if (code === 'RETAKE_NOT_ALLOWED') {
        toast.error(
          reason === 'MAX_ATTEMPTS_REACHED'
            ? 'لا يمكن إعادة المحاولة — استنفدت عدد المحاولات'
            : reason === 'PASSED'
              ? 'لقد اجتزت هذا الاختبار بالفعل'
              : 'لا يمكن بدء الاختبار الآن',
        )
      } else {
        toast.error('تعذر بدء الاختبار، حاول مرة أخرى')
      }
    } finally {
      setStarting(false)
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

  if (isFinished) {
    return (
      <div className="min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-2xl rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-center">
          <p className="text-lg font-bold text-foreground">انتهت هذه المحاولة</p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            تم تسليم هذا الاختبار بالفعل ولا يمكن تعديل الإجابات.
          </p>
          <a
            href={`/${locale}/learn/${courseId}/quiz/${quizId}/result?aid=${aidParam}`}
            className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-[#5120c8] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity duration-150"
          >
            عرض النتيجة
          </a>
        </div>
      </div>
    )
  }

  if (showPreStart) {
    if (!quizInfo) {
      return (
        <div className="min-h-screen p-6" dir="rtl">
          <div className="mx-auto max-w-2xl text-center text-sm text-[color:var(--muted)]">
            لا يمكن عرض الاختبار الآن
          </div>
        </div>
      )
    }
    return (
      <div
        dir="rtl"
        style={{
          maxWidth: '560px',
          margin: '80px auto',
          padding: '32px',
          background: 'var(--card-bg)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--foreground)', marginBottom: '8px' }}>
          {quizInfo.titleAr || quizInfo.title}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
          {quizInfo.durationMinutes} دقيقة · {quizInfo.questions?.length ?? 0} سؤال · النجاح {quizInfo.passingScore}%
        </p>
        <button
          type="button"
          onClick={handleStart}
          disabled={starting}
          className="transition-opacity duration-150 hover:opacity-90"
          style={{
            padding: '12px 32px',
            borderRadius: '12px',
            background: '#5120C8',
            color: '#fff',
            border: 'none',
            fontSize: '15px',
            fontWeight: 700,
            cursor: starting ? 'wait' : 'pointer',
            boxShadow: '0 4px 20px rgba(81,32,200,0.4)',
          }}
        >
          {starting ? 'جاري البدء...' : 'ابدأ الاختبار'}
        </button>
      </div>
    )
  }

  if (!attemptId && !snapshot) {
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
            <h1 className="font-bold font-madinet text-foreground">{quizInfo?.titleAr || quizInfo?.title}</h1>
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
              <div key={q.id} id={`q-${q.id}`} className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{index + 1}</span>
                  <span className="rounded-full bg-[color:var(--surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--muted)] border border-[color:var(--border)]">
                    {TYPE_LABEL[q.type] ?? q.type}
                  </span>
                  <span className="text-xs font-semibold text-[color:var(--muted)]">{q.points} نقطة</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">{q.questionText}</p>
                {q.note && <p className="mt-1 text-xs text-[color:var(--muted)]">{q.note}</p>}
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
                  <div className="mt-3 rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface-2)]/60 p-4 text-sm">
                    {ans?.fileUrl ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2 text-foreground">
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">تم رفع: {ans.fileName || 'الملف'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(q.id)}
                          className="shrink-0 text-xs font-semibold text-[#ef4444] hover:opacity-80"
                        >
                          حذف الملف
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-2 text-xs text-[color:var(--muted)]">
                          ارفع ملف إجابتك (PDF، Word، أو صورة — أقل من 20 ميجا)
                        </p>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-foreground hover:opacity-80 transition-opacity duration-150">
                          {uploading[q.id] ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              جارٍ الرفع...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              اختيار ملف
                            </>
                          )}
                          <input
                            type="file"
                            className="hidden"
                            disabled={!!uploading[q.id]}
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) onFileChange(q.id, f)
                              e.target.value = ''
                            }}
                          />
                        </label>
                      </div>
                    )}
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