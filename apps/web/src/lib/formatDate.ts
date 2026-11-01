import { browserTimeZone } from './time'

export function safeDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  if (typeof value === 'number') {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }
  if (typeof value === 'string') {
    if (!value.trim()) return null
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }
  // Prisma artifact: { $date: "..." }
  if (typeof value === 'object' && '$date' in (value as object)) {
    const d = new Date((value as { $date: string }).$date)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

export function timeAgoAr(value: unknown): string {
  const d = safeDate(value)
  if (!d) return '—'
  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (diffMins < 1) return 'الآن'
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`
  if (diffHours < 24) return `منذ ${diffHours} ساعة`
  if (diffDays < 7) return `منذ ${diffDays} يوم`
  return formatDateAr(d)
}

export function formatDateAr(value: unknown): string {
  const d = safeDate(value)
  if (!d) return '—'
  return d.toLocaleDateString('ar-EG-u-ca-gregory', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: browserTimeZone(),
    calendar: 'gregory',
  })
}

export function formatDateTimeAr(value: unknown): string {
  const d = safeDate(value)
  if (!d) return '—'
  return d.toLocaleDateString('ar-EG-u-ca-gregory', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: browserTimeZone(),
    calendar: 'gregory',
  })
}
