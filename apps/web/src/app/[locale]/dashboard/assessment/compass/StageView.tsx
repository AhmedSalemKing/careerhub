'use client'
import type { CompassStageData, CompassQuestion, AnswerInput } from '@/hooks/useCompassSession'
import { QuestionCard } from './QuestionCard'

interface StageViewProps {
  stage: CompassStageData
  followUpQuestions: CompassQuestion[]
  answeredIds: string[]
  pendingAnswers: Record<string, AnswerInput>
  onAnswerChange: (answer: AnswerInput) => void
}

export function StageView({ stage, followUpQuestions, answeredIds, pendingAnswers, onAnswerChange }: StageViewProps) {
  const allQuestions = [...stage.questions, ...followUpQuestions]

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {allQuestions.map((q, idx) => (
        <div key={q.id}>
          {!q.isBaseline && q.branchingReason && (
            <div style={{
              padding: '6px 12px', marginBottom: 6,
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 6,
              fontSize: 11, color: 'var(--muted-foreground)',
            }}>
              ↳ {q.branchingReason}
            </div>
          )}
          <QuestionCard
            question={q}
            index={idx + 1}
            value={pendingAnswers[q.id] ?? null}
            isAnswered={answeredIds.includes(q.id)}
            onChange={onAnswerChange}
          />
        </div>
      ))}
    </div>
  )
}
