/**
 * Safe date formatter - never returns "Invalid Date".
 * Uses Africa/Cairo timezone for all displays.
 */
function toDate(raw: unknown): Date | null {
  if (!raw) return null
  const d = raw instanceof Date ? raw : new Date(raw as string)
  return isNaN(d.getTime()) ? null : d
}

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
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'الآن'
  if (minutes < 60) return `منذ ${minutes} دقيقة`
  if (hours < 24) return `منذ ${hours} ساعة`
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
