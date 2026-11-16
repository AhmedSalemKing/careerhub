import { Briefcase, CheckCircle2 } from 'lucide-react'

/**
 * Trust signals for a mentor: years of experience and completed sessions.
 * Each item is hidden when its value is missing or zero, so a brand-new mentor shows nothing misleading.
 */
export function MentorStats({
  years,
  completed,
  isAr,
  center = false,
}: {
  years?: number | string | null
  completed?: number | string | null
  isAr: boolean
  center?: boolean
}) {
  const y = Number(years) || 0
  const c = Number(completed) || 0
  if (y <= 0 && c <= 0) return null
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
      style={{ color: 'var(--ink-2)', justifyContent: center ? 'center' : undefined }}
    >
      {y > 0 && (
        <span className="inline-flex items-center gap-1">
          <Briefcase size={13} aria-hidden="true" />
          {isAr ? `${y} سنة خبرة` : `${y} years of experience`}
        </span>
      )}
      {c > 0 && (
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 size={13} aria-hidden="true" style={{ color: 'var(--brand)' }} />
          {isAr ? `${c} جلسة مكتملة` : `${c} completed ${c === 1 ? 'session' : 'sessions'}`}
        </span>
      )}
    </div>
  )
}

export default MentorStats
