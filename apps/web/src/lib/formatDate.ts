import { browserTimeZone } from './time'

export function safeDate(value: unknown): Date | null {
  if (!value) return null

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    let d = new Date(value)
    if (!isNaN(d.getTime())) return d
    // Try adding Z for UTC if missing timezone
    d = new Date(value + 'Z')
    if (!isNaN(d.getTime())) return d
    return null
  }

  if (typeof value === 'number' && value > 0) {
    const d = new Date(value)
    return isNaN(d.getTime()) ? null : d
  }

  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>

    // { $date: "2026-10-15T..." } — MongoDB/Prisma format
    if (obj.$date) return safeDate(obj.$date)

    // { seconds: N, nanos: N } — Firestore Timestamp
    if (typeof obj.seconds === 'number') return new Date(obj.seconds * 1000)

    // Date-like object with toISOString method
    if (typeof obj.toISOString === 'function') {
      return safeDate((obj as { toISOString: () => string }).toISOString())
    }

    // Try common field names for nested date value
    for (const key of ['value', 'date', 'time', 'timestamp', 'iso', '_d']) {
      if (obj[key]) {
        const attempt = safeDate(obj[key])
        if (attempt) return attempt
      }
    }
  }

  return null
}

export function timeAgoAr(value: unknown): string {
  const d = safeDate(value)
  if (!d) return ''
  const diff  = Date.now() - d.getTime()
  const secs  = Math.floor(diff / 1000)
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (secs  < 30)  return 'الآن'
  if (mins  < 60)  return `منذ ${mins} دقيقة`
  if (hours < 24)  return `منذ ${hours} ساعة`
  if (days  === 1) return 'أمس'
  if (days  < 7)   return `منذ ${days} أيام`
  return formatDateAr(d)
}

export function formatDateAr(value: unknown): string {
  const d = safeDate(value)
  if (!d) return ''
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: browserTimeZone(),
  })
}

export function formatDateTimeAr(value: unknown): string {
  const d = safeDate(value)
  if (!d) return ''
  return d.toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: browserTimeZone(),
  })
}
