'use client'
import { useEffect, useState, useCallback } from 'react'
import { useCompassSession, type AnswerInput, type CompassQuestion } from '@/hooks/useCompassSession'
import { StageView } from './StageView'
import { DiscoveryReport } from './DiscoveryReport'

const STAGE_TITLES_AR: Record<number, string> = {
  1: 'الملف الشخصي والأكاديمي',
  2: 'الاهتمامات',
  3: 'المهارات',
  4: 'المؤشرات السلوكية',
  5: 'الدوافع وتفضيلات العمل',
  6: 'الاستعداد للسوق',
}

export function CompassFlow() {
  const {
    session, followUpQuestions, report,
    isLoading, error,
    startSession, submitAnswers, completeSession,
  } = useCompassSession()

  const [pendingAnswers, setPendingAnswers] = useState<Record<string, AnswerInput>>({})
  const [submitting, setSubmitting] = useState(false)

  // Start session on mount
  useEffect(() => {
    void startSession()
  }, [startSession])

  const handleAnswerChange = useCallback((answer: AnswerInput) => {
    setPendingAnswers(prev => ({ ...prev, [answer.questionId]: answer }))
  }, [])

  const handleSubmitStage = useCallback(async () => {
    if (!session || submitting) return
    const allQuestions: CompassQuestion[] = [
      ...(session.currentStageData?.questions ?? []),
      ...followUpQuestions,
    ]
    const answers = allQuestions
      .map(q => pendingAnswers[q.id])
      .filter((a): a is AnswerInput => a != null)

    setSubmitting(true)
    try {
      const result = await submitAnswers(session.currentStage, answers)
      if (result?.isComplete) {
        await completeSession()
      }
      // Clear pending answers for this stage
      const clearedIds = allQuestions.map(q => q.id)
      setPendingAnswers(prev => {
        const next = { ...prev }
        for (const id of clearedIds) delete next[id]
        return next
      })
    } finally {
      setSubmitting(false)
    }
  }, [session, followUpQuestions, pendingAnswers, submitAnswers, completeSession, submitting])

  if (error) {
    return (
      <div dir="rtl" style={{ padding: 24, textAlign: 'center', color: 'var(--muted-foreground)' }}>
        <p style={{ marginBottom: 16 }}>{error}</p>
        <button
          onClick={() => void startSession()}
          style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}
        >
          إعادة المحاولة
        </button>
      </div>
    )
  }

  if (isLoading && !session) {
    return (
      <div dir="rtl" style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}>
        جارٍ تحميل الاختبار...
      </div>
    )
  }

  if (!session) return null

  if (session.status === 'COMPLETED' && report) {
    return <DiscoveryReport report={report} />
  }

  const { currentStage, totalStages, progress, currentStageData } = session
  const progressPct = totalStages > 0
    ? Math.round(((currentStage - 1) / totalStages) * 100)
    : 0

  return (
    <div dir="rtl" style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--foreground)', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
            بوصلة المسار المهني
          </h1>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
            المرحلة {currentStage} من {totalStages}
          </span>
        </div>
        {/* Progress bar */}
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.4s ease', borderRadius: 4 }} />
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted-foreground)' }}>
          {STAGE_TITLES_AR[currentStage] ?? ''}
        </div>
        {/* Evidence notice */}
        <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: 11, color: 'var(--muted-foreground)' }}>
          النتائج مبنية على أدلة من إجاباتك — المسارات المقترحة مبدئية وتحتاج إلى مراجعة.
        </div>
      </div>

      {/* Stage questions */}
      {currentStageData && (
        <StageView
          stage={currentStageData}
          followUpQuestions={followUpQuestions}
          answeredIds={session.answeredQuestionIds ?? []}
          pendingAnswers={pendingAnswers}
          onAnswerChange={handleAnswerChange}
        />
      )}

      {/* Submit */}
      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => void handleSubmitStage()}
          disabled={submitting || isLoading}
          style={{
            padding: '12px 28px', borderRadius: 12, border: 'none',
            background: submitting ? 'var(--muted)' : 'linear-gradient(135deg,#6366f1,#4338ca)',
            color: '#fff', fontWeight: 600, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif',
          }}
        >
          {submitting ? 'جارٍ الحفظ...' : currentStage === totalStages ? 'إنهاء الاختبار' : 'التالي'}
        </button>
      </div>

      {/* Progress detail */}
      <p style={{ marginTop: 16, fontSize: 11, color: 'var(--muted-foreground)', textAlign: 'center' }}>
        تمت الإجابة على {progress.answeredBaseline} من {progress.totalBaseline} سؤالًا أساسيًا
        {progress.answeredFollowUp > 0 && ` + ${progress.answeredFollowUp} سؤال إضافي`}
      </p>
    </div>
  )
}
