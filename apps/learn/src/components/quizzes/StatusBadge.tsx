'use client'

type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'PASSED' | 'FAILED'

const STATUS_CONFIG: Record<QuizStatus, { label: string; classes: string }> = {
  DRAFT: { label: 'مسودة', classes: 'bg-[color:var(--surface-2)] text-[color:var(--muted)] border border-[color:var(--border)]' },
  PUBLISHED: { label: 'منشور', classes: 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25' },
  IN_PROGRESS: { label: 'قيد التنفيذ', classes: 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/25' },
  SUBMITTED: { label: 'بانتظار التصحيح', classes: 'bg-[#5120c8]/15 text-[#5120c8] border border-[#5120c8]/25' },
  GRADED: { label: 'مصحّح', classes: 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25' },
  PASSED: { label: 'ناجح', classes: 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25' },
  FAILED: { label: 'راسب', classes: 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/25' },
}

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as QuizStatus] ?? { label: status, classes: 'bg-[color:var(--surface-2)] text-[color:var(--muted)]' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${config.classes}`}>
      {config.label}
    </span>
  )
}