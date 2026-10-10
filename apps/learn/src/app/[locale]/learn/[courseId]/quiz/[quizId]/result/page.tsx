'use client'
import { useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { CheckCircle2, XCircle, FileText, ExternalLink } from 'lucide-react'
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
  const courseId = params.courseId as string
  const quizId = params.quizId as string
  const aid = search.get('aid')

  const { data, isLoading } = useQuery({
    queryKey: ['student-attempt-result', aid],
    queryFn: async () => {
      if (!aid) return null
      const res = await get(`/quizzes/attempts/${aid}/mine`)
      return (res?.data as any)?.data ?? null
    },
    enabled: !!aid,
  })

  const attempt = data
  const finished = attempt?.status === 'GRADED' || attempt?.status === 'SUBMITTED'

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

  if (!attempt) {
    return (
      <div className="min-h-screen p-6" dir="rtl">
        <div className="mx-auto max-w-2xl text-center text-sm text-[color:var(--muted)]">
          النتيجة غير متاحة حالياً
        </div>
      </div>
    )
  }

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
          {attempt.teacherNotes && (
            <p className="mt-4 rounded-[10px] bg-[color:var(--surface-2)]/60 p-3 text-sm text-foreground">{attempt.teacherNotes}</p>
          )}
        </div>

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