'use client'
import { useLocale } from 'next-intl'

type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'PASSED' | 'FAILED'

const STATUS_CONFIG: Record<QuizStatus, { label: string; labelEn: string; classes: string }> = {
  DRAFT: { label: 'مسودة', labelEn: 'Draft', classes: 'bg-[color:var(--surface-2)] text-[color:var(--muted)] border border-[color:var(--border)]' },
  PUBLISHED: { label: 'منشور', labelEn: 'Published', classes: 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25' },
  IN_PROGRESS: { label: 'قيد التنفيذ', labelEn: 'In progress', classes: 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/25' },
  SUBMITTED: { label: 'بانتظار التصحيح', labelEn: 'Awaiting grading', classes: 'bg-[#5120c8]/15 text-[#5120c8] border border-[#5120c8]/25' },
  GRADED: { label: 'مصحّح', labelEn: 'Graded', classes: 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25' },
  PASSED: { label: 'ناجح', labelEn: 'Passed', classes: 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25' },
  FAILED: { label: 'راسب', labelEn: 'Failed', classes: 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/25' },
}

export default function StatusBadge({ status }: { status: string }) {
  const isAr = useLocale() === 'ar'
  const config = STATUS_CONFIG[status as QuizStatus] ?? { label: status, labelEn: status, classes: 'bg-[color:var(--surface-2)] text-[color:var(--muted)]' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${config.classes}`}>
      {isAr ? config.label : config.labelEn}
    </span>
  )
}