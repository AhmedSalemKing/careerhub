'use client'

import { motion } from 'framer-motion'
import { Button } from './ui/Button'

export type AssessmentQuestionModel = {
  id?: string
  question: string
  options: string[]
}

export function AssessmentQuestion({
  model,
  current,
  total,
  onSelect,
  onBack,
  backLabel,
  isSubmitting,
  backDisabled,
}: {
  model: AssessmentQuestionModel
  current: number
  total: number
  onSelect: (answer: string) => void
  onBack: () => void
  backLabel: string
  isSubmitting?: boolean
  backDisabled?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-[color:var(--muted)]">
          {current}/{total}
        </div>
        <Button type="button" variant="secondary" onClick={onBack} disabled={backDisabled || isSubmitting}>
          {backLabel}
        </Button>
      </div>

      <div className="mt-4 text-lg font-extrabold text-foreground">{model.question}</div>

      <div className="mt-5 grid grid-cols-1 gap-3">
        {model.options.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={isSubmitting}
            onClick={() => onSelect(opt)}
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm font-semibold text-foreground hover:bg-[color:var(--surface-2)] disabled:opacity-60"
          >
            {opt}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

