'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowRight, Save, CheckCircle2, XCircle, FileText, ExternalLink } from 'lucide-react'
import { get, post } from '@/lib/api'
import StatusBadge from '@/components/quizzes/StatusBadge'
import ScoreCircle from '@/components/quizzes/ScoreCircle'

const inputCls =
  'w-full rounded-[10px] border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors duration-150 placeholder:text-[color:var(--muted)]'
const labelCls = 'block text-sm font-semibold text-foreground mb-1.5'

const TYPE_LABEL: Record<string, string> = {
  MCQ: 'اختيار من متعدد',
  SHORT_ANSWER: 'سؤال مقالي',
  FILE_UPLOAD: 'رفع ملف',
}

interface GradeDraft {
  manualGrade: string
  feedback: string
}

export default function ReviewAttemptPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'ar'
  const courseId = params.id as string
  const aid = params.aid as string

  const { data: attempt, isLoading, refetch } = useQuery({
    queryKey: ['instructor-attempt', aid],
    queryFn: async () => {
      const res = await get(`/quizzes/attempts/${aid}`)
      return (res?.data as any)?.data ?? null
    },
    enabled: !!aid,
  })

  const [grades, setGrades] = useState<Record<string, GradeDraft>>({})
  const [teacherNotes, setTeacherNotes] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (attempt && !hydrated) {
      const map: Record<string, GradeDraft> = {}
      for (const q of attempt.questions ?? []) {
        if (q.answer) {
          map[q.answer.id] = {
            manualGrade: q.answer.manualGrade != null ? String(q.answer.manualGrade) : '0',
            feedback: q.answer.feedback ?? '',
          }
        }
      }
      setGrades(map)
      setTeacherNotes(attempt.teacherNotes ?? '')
      setHydrated(true)
    }
  }, [attempt, hydrated])

  const back = () => router.push(`/${locale}/dashboard/courses/${courseId}/manage/quizzes/${attempt?.quiz?.id ?? ''}/attempts`)

  const saveGrading = async () => {
    if (!attempt) return
    const answers: { answerId: string; manualGrade: number; feedback?: string }[] = []
    for (const q of attempt.questions ?? []) {
      if (!q.answer) continue
      const draft = grades[q.answer.id]
      answers.push({
        answerId: q.answer.id,
        manualGrade: Math.max(0, parseInt(draft?.manualGrade ?? '0', 10) || 0),
        feedback: (draft?.feedback ?? '').trim() ? draft.feedback.trim() : undefined,
      })
    }
    setSaving(true)
    try {
      await post(`/quizzes/attempts/${aid}/grade`, {
        answers,
        teacherNotes: teacherNotes.trim() ? teacherNotes.trim() : undefined,
      })
      toast.success('تم حفظ التصحيح')
      setHydrated(false)
      refetch()
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'تعذر حفظ التصحيح')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4" dir="rtl">
        <div className="h-10 w-64 animate-pulse rounded-[10px] bg-[color:var(--surface-2)]" />
        <div className="h-40 animate-pulse rounded-[14px] bg-[color:var(--surface-2)]" />
      </div>
    )
  }

  if (!attempt) {
    return (
      <div className="p-6 text-center" dir="rtl">
        <p className="text-[color:var(--muted)]">المحاولة غير موجودة</p>
      </div>
    )
  }

  const name = `${attempt.student?.profile?.firstName ?? ''} ${attempt.student?.profile?.lastName ?? ''}`.trim() || attempt.student?.email || '—'
  const startDate = attempt.startedAt ? new Date(attempt.startedAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

  const setGrade = (answerId: string, key: keyof GradeDraft, value: string) =>
    setGrades((g) => ({ ...g, [answerId]: { ...(g[answerId] ?? { manualGrade: '0', feedback: '' }), [key]: value } }))

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={back}
            className="flex items-center gap-2 rounded-[10px] bg-[color:var(--surface-2)] px-3 py-2 text-sm font-semibold text-[color:var(--muted)] hover:text-foreground transition-colors duration-150"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold font-madinet text-foreground">مراجعة محاولة</h1>
            <p className="text-sm text-[color:var(--muted)] mt-1">
              {attempt.quiz?.titleAr || attempt.quiz?.title || ''} — {name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-5 min-w-0">
          {attempt.questions?.map((q: any, index: number) => {
            const answer = q.answer
            const isMcq = q.type === 'MCQ'
            const needsManual = q.type === 'SHORT_ANSWER' || q.type === 'FILE_UPLOAD'
            const selected = new Set(answer?.selectedChoiceIds ?? [])
            const grade = answer ? grades[answer.id] : undefined

            return (
              <div key={q.id} className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{index + 1}</span>
                  <span className="rounded-full bg-[color:var(--surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--muted)] border border-[color:var(--border)]">
                    {TYPE_LABEL[q.type] ?? q.type}
                  </span>
                  <span className="text-xs font-semibold text-[color:var(--muted)]">{q.points} نقطة</span>
                  {answer?.autoGrade != null && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        answer.autoGrade >= q.points
                          ? 'bg-[#10b981]/15 text-[#10b981]'
                          : answer.autoGrade > 0
                            ? 'bg-[#f59e0b]/15 text-[#f59e0b]'
                            : 'bg-[#ef4444]/15 text-[#ef4444]'
                      }`}
                    >
                      تلقائي: {Math.round(answer.autoGrade)}
                    </span>
                  )}
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

                {isMcq && (
                  <div className="mt-3 space-y-2">
                    {(q.choices ?? []).map((c: any) => {
                      const isSelected = selected.has(c.id)
                      const correct = c.isCorrect
                      let cls = 'border-[color:var(--border)] bg-[color:var(--surface-2)]'
                      if (correct) cls = 'border-[#10b981]/40 bg-[#10b981]/10'
                      else if (isSelected) cls = 'border-[#ef4444]/40 bg-[#ef4444]/10'
                      return (
                        <div key={c.id} className={`flex items-center gap-2 rounded-[10px] border px-3 py-2 text-sm ${cls}`}>
                          {correct ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10b981]" />
                          ) : isSelected ? (
                            <XCircle className="h-4 w-4 shrink-0 text-[#ef4444]" />
                          ) : (
                            <span className="h-4 w-4 shrink-0 rounded-full border border-[color:var(--border)]" />
                          )}
                          <span className="text-foreground">{c.text}</span>
                        </div>
                      )
                    })}
                    {!answer && <p className="text-xs text-[#ef4444] mt-1">لم يجِب الطالب عن هذا السؤال</p>}
                  </div>
                )}

                {q.type === 'SHORT_ANSWER' && (
                  <div className="mt-3 rounded-[10px] bg-[color:var(--surface-2)]/60 p-3 text-sm text-foreground">
                    {answer?.textAnswer ? (
                      answer.textAnswer
                    ) : (
                      <span className="text-xs text-[#ef4444]">لم يُجب الطالب</span>
                    )}
                  </div>
                )}

                {q.type === 'FILE_UPLOAD' && (
                  <div className="mt-3">
                    {answer?.fileUrl ? (
                      <a
                        href={answer.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-[10px] bg-[#5120c8]/10 px-4 py-2 text-sm font-semibold text-[#5120c8] hover:bg-[#5120c8]/20 transition-colors duration-150"
                      >
                        <FileText className="h-4 w-4" />
                        {answer.fileName || 'الملف المرفق'}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <p className="text-xs text-[#ef4444]">لم يرفع الطالب ملفاً</p>
                    )}
                  </div>
                )}

                {needsManual && answer && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>الدرجة اليدوية (من {q.points})</label>
                      <input
                        className={inputCls}
                        type="number"
                        min={0}
                        max={q.points}
                        value={grade?.manualGrade ?? '0'}
                        onWheel={(e) => e.currentTarget.blur()}
                        onChange={(e) => setGrade(answer.id, 'manualGrade', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>ملاحظة (اختياري)</label>
                      <input
                        className={inputCls}
                        value={grade?.feedback ?? ''}
                        onChange={(e) => setGrade(answer.id, 'feedback', e.target.value)}
                        placeholder="تعليق يظهر للطالب"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="space-y-5 min-w-0">
          <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <h2 className="mb-1 font-bold text-foreground">{name}</h2>
            <p className="text-xs text-[color:var(--muted)]">{attempt.student?.email}</p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">بدأ في: {startDate}</p>
            <div className="mt-2">
              <StatusBadge status={attempt.status} />
            </div>
          </div>

          <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-center">
            <h2 className="mb-3 font-bold text-foreground">النتيجة</h2>
            <div className="flex justify-center">
              <ScoreCircle percentage={attempt.percentage ?? 0} passed={attempt.status === 'GRADED' ? attempt.passed : null} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-[10px] bg-[color:var(--surface-2)] p-2.5">
                <p className="text-lg font-extrabold text-foreground">{Math.round(attempt.autoScore ?? 0)}</p>
                <p className="text-xs text-[color:var(--muted)]">تلقائي</p>
              </div>
              <div className="rounded-[10px] bg-[color:var(--surface-2)] p-2.5">
                <p className="text-lg font-extrabold text-foreground">{Math.round(attempt.manualScore ?? 0)}</p>
                <p className="text-xs text-[color:var(--muted)]">يدوي</p>
              </div>
              <div className="rounded-[10px] bg-[color:var(--surface-2)] p-2.5">
                <p className="text-lg font-extrabold text-[#5120c8]">
                  {Math.round(attempt.totalScore ?? 0)}/{Math.round(attempt.maxScore ?? 0)}
                </p>
                <p className="text-xs text-[color:var(--muted)]">الإجمالي</p>
              </div>
            </div>
          </div>

          <div className="rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
            <label className={labelCls}>ملاحظات عامة للطالب</label>
            <textarea
              className={`${inputCls} min-h-[80px] resize-y`}
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              placeholder="اكتب ملاحظات تصحيح إجمالية هنا"
            />
            <button
              type="button"
              onClick={saveGrading}
              disabled={saving}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition-all duration-150"
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              حفظ التصحيح
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}