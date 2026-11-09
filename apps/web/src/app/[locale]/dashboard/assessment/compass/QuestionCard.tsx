'use client'
import type { CompassQuestion, AnswerInput } from '@/hooks/useCompassSession'

interface QuestionCardProps {
  question: CompassQuestion
  index: number
  value: AnswerInput | null
  isAnswered: boolean
  onChange: (answer: AnswerInput) => void
}

const DIMENSION_LABELS_AR: Record<string, string> = {
  CONTEXT: 'الملف الشخصي',
  INTERESTS: 'الاهتمامات',
  SKILLS: 'المهارات',
  BEHAVIORAL_INDICATORS: 'المؤشرات السلوكية',
  MOTIVATION: 'الدوافع',
  WORK_PREFERENCES: 'تفضيلات العمل',
  MARKET_READINESS: 'الاستعداد للسوق',
}

export function QuestionCard({ question, index, value, isAnswered, onChange }: QuestionCardProps) {
  const dimLabel = DIMENSION_LABELS_AR[question.dimension] ?? question.dimension

  return (
    <div style={{
      background: 'var(--card)',
      border: `1px solid ${isAnswered ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
      borderRadius: 14,
      padding: 20,
    }}>
      {/* Meta */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'rgba(99,102,241,0.12)',
          color: '#818cf8', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{index}</span>
        <span style={{
          padding: '2px 8px', borderRadius: 4,
          background: 'rgba(99,102,241,0.08)',
          color: '#818cf8', fontSize: 11,
        }}>{dimLabel}</span>
        {!question.isBaseline && (
          <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: 11 }}>
            سؤال إضافي
          </span>
        )}
      </div>

      {/* Question text */}
      <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: 'var(--foreground)', lineHeight: 1.6, fontFamily: 'var(--font-ui)' }}>
        {question.textAr}
      </p>
      {question.hintAr && (
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 14, fontStyle: 'italic' }}>{question.hintAr}</p>
      )}

      {/* Input by type */}
      {(question.type === 'SINGLE_CHOICE' || question.type === 'SCENARIO') && (
        <SingleChoiceInput question={question} value={value} onChange={onChange} />
      )}
      {question.type === 'MULTI_SELECT' && (
        <MultiSelectInput question={question} value={value} onChange={onChange} />
      )}
      {question.type === 'RATING_SCALE' && (
        <RatingInput question={question} value={value} onChange={onChange} />
      )}
      {(question.type === 'SHORT_TEXT' || question.type === 'PRACTICAL_MINI') && (
        <TextInput question={question} value={value} onChange={onChange} />
      )}
      {question.type === 'RANKING' && (
        <RankingInput question={question} value={value} onChange={onChange} />
      )}
    </div>
  )
}

function SingleChoiceInput({ question, value, onChange }: Pick<QuestionCardProps, 'question' | 'value' | 'onChange'>) {
  const selected = value?.selectedOptionIds?.[0]
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {question.options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange({ questionId: question.id, selectedOptionIds: [opt.id] })}
          style={{
            padding: '10px 16px', borderRadius: 10, textAlign: 'right', border: 'none',
            background: selected === opt.id ? 'rgba(99,102,241,0.15)' : 'var(--secondary)',
            outline: selected === opt.id ? '2px solid rgba(99,102,241,0.5)' : 'none',
            color: 'var(--foreground)', fontSize: 14, cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
            transition: 'all 0.15s',
          }}
        >
          {opt.textAr}
        </button>
      ))}
    </div>
  )
}

function MultiSelectInput({ question, value, onChange }: Pick<QuestionCardProps, 'question' | 'value' | 'onChange'>) {
  const selected = new Set(value?.selectedOptionIds ?? [])
  const max = question.maxAnswers ?? question.options.length
  const min = question.minAnswers ?? 1

  const toggle = (optId: string) => {
    const next = new Set(selected)
    if (next.has(optId)) { next.delete(optId) }
    else if (next.size < max) { next.add(optId) }
    onChange({ questionId: question.id, selectedOptionIds: Array.from(next) })
  }

  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 10 }}>
        اختر {min === max ? `${min}` : `من ${min} إلى ${max}`}
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {question.options.map(opt => (
          <button
            key={opt.id}
            onClick={() => toggle(opt.id)}
            style={{
              padding: '10px 16px', borderRadius: 10, textAlign: 'right', border: 'none',
              background: selected.has(opt.id) ? 'rgba(99,102,241,0.15)' : 'var(--secondary)',
              outline: selected.has(opt.id) ? '2px solid rgba(99,102,241,0.5)' : 'none',
              color: 'var(--foreground)', fontSize: 14, cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
            }}
          >
            {opt.textAr}
          </button>
        ))}
      </div>
    </div>
  )
}

function RatingInput({ question, value, onChange }: Pick<QuestionCardProps, 'question' | 'value' | 'onChange'>) {
  const rating = value?.ratingValue ?? 0
  const labels: Record<number, string> = { 1: 'مبتدئ', 2: 'أساسي', 3: 'متوسط', 4: 'متقدم', 5: 'خبير' }
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            onClick={() => onChange({ questionId: question.id, ratingValue: v })}
            style={{
              width: 44, height: 44, borderRadius: 10, border: 'none',
              background: rating >= v ? 'linear-gradient(135deg,#6366f1,#4338ca)' : 'var(--secondary)',
              color: rating >= v ? '#fff' : 'var(--foreground)',
              fontSize: 16, cursor: 'pointer', fontWeight: 600,
            }}
          >{v}</button>
        ))}
      </div>
      {rating > 0 && (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#818cf8' }}>{labels[rating]}</p>
      )}
    </div>
  )
}

function TextInput({ question, value, onChange }: Pick<QuestionCardProps, 'question' | 'value' | 'onChange'>) {
  const text = value?.textValue ?? ''
  return (
    <div>
      {question.type === 'PRACTICAL_MINI' && (
        <div style={{ padding: '8px 12px', marginBottom: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 7, fontSize: 11, color: 'var(--muted-foreground)' }}>
          هذا سؤال تقييم عملي — إجابتك ستُراجَع مقارنةً بالمعيار المعتمد.
        </div>
      )}
      <textarea
        value={text}
        onChange={e => onChange({ questionId: question.id, textValue: e.target.value.slice(0, 500) })}
        placeholder="اكتب إجابتك هنا..."
        rows={4}
        style={{
          width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--border)',
          background: 'var(--secondary)', color: 'var(--foreground)',
          fontSize: 14, resize: 'vertical', fontFamily: 'var(--font-ui)',
          outline: 'none', boxSizing: 'border-box',
        }}
      />
      <p style={{ marginTop: 4, fontSize: 11, color: 'var(--muted-foreground)', textAlign: 'left' }}>
        {text.length}/500
      </p>
    </div>
  )
}

function RankingInput({ question, value, onChange }: Pick<QuestionCardProps, 'question' | 'value' | 'onChange'>) {
  const ranking = value?.rankingOrder ?? []

  const move = (optId: string, direction: 'up' | 'down') => {
    const current = ranking.length > 0
      ? ranking
      : question.options.map((o, i) => ({ optionId: o.id, rank: i + 1 }))
    const idx = current.findIndex(r => r.optionId === optId)
    if (idx < 0) return
    const next = [...current]
    const swapWith = direction === 'up' ? idx - 1 : idx + 1
    if (swapWith < 0 || swapWith >= next.length) return
    const tmp = next[idx].rank
    next[idx] = { ...next[idx], rank: next[swapWith].rank }
    next[swapWith] = { ...next[swapWith], rank: tmp }
    onChange({ questionId: question.id, rankingOrder: next.sort((a, b) => a.rank - b.rank) })
  }

  const orderedOptions = [...question.options].sort((a, b) => {
    const ra = ranking.find(r => r.optionId === a.id)?.rank ?? Infinity
    const rb = ranking.find(r => r.optionId === b.id)?.rank ?? Infinity
    return ra - rb
  })

  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 10 }}>رتّب من الأهم إلى الأقل أهمية</p>
      <div style={{ display: 'grid', gap: 8 }}>
        {orderedOptions.map((opt, idx) => (
          <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--secondary)', borderRadius: 10, padding: '8px 12px' }}>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)', minWidth: 20 }}>{idx + 1}</span>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--foreground)', fontFamily: 'var(--font-ui)' }}>{opt.textAr}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => move(opt.id, 'up')} disabled={idx === 0}
                style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'var(--border)', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
              <button onClick={() => move(opt.id, 'down')} disabled={idx === orderedOptions.length - 1}
                style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'var(--border)', cursor: idx === orderedOptions.length - 1 ? 'default' : 'pointer', opacity: idx === orderedOptions.length - 1 ? 0.3 : 1 }}>↓</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
