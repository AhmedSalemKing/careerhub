/**
 * Safe date formatter - never returns "Invalid Date".
 * Uses Africa/Cairo timezone for all displays.
 */
/** Parses ISO strings, timestamps, Date objects and {$date} wrappers; null when unusable. */
export function parseDate(raw: unknown): Date | null {
  if (!raw) return null
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw
  if (typeof raw === 'string' || typeof raw === 'number') {
    const d = new Date(raw)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (typeof obj.$date === 'string') return parseDate(obj.$date)
    if (typeof obj.toISOString === 'function') return parseDate((obj as unknown as Date).toISOString())
  }
  return null
}

const toDate = parseDate

export function formatDate(raw: unknown, options?: Intl.DateTimeFormatOptions): string {
  const d = toDate(raw)
  if (!d) return '—'

  return d.toLocaleDateString('ar-EG', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

export function formatDateTime(raw: unknown): string {
  const d = toDate(raw)
  if (!d) return '—'

  return d.toLocaleString('ar-EG', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatRelative(raw: unknown): string {
  const d = toDate(raw)
  if (!d) return '—'

  const diff = Date.now() - d.getTime()
  if (diff < 0) return formatDate(raw)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  if (hours < 24) return `منذ ${hours} ساعة`
  if (days === 1) return 'أمس'
  if (days < 30) return `منذ ${days} يوم`
  return formatDate(raw)
}

export function formatTime(raw: unknown): string {
  const d = toDate(raw)
  if (!d) return '—'

  return d.toLocaleTimeString('ar-EG', {
    timeZone: 'Africa/Cairo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}
