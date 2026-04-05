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
      className="rounded-2xl p-6 shadow-lg"
      style={{
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF' }}>
          {current}/{total}
        </div>
        <Button type="button" variant="secondary" onClick={onBack} disabled={backDisabled || isSubmitting}>
          {backLabel}
        </Button>
      </div>

      <div className="mt-4 text-lg font-extrabold" style={{ color: '#ffffff' }}>
        {model.question}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3">
        {model.options.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={isSubmitting}
            onClick={() => onSelect(opt)}
            className="rounded-2xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-60"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#E6E6E6',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </motion.div>
  )
}