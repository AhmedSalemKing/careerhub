/**
 * Timezone-aware formatters.
 *
 * Two rules every date/time display follows:
 *
 * 1. Force the Gregorian calendar. `toLocaleDateString('ar')` / `'ar-SA'`
 *    resolve to the Islamic (Hijri) calendar in most browsers, so a schedule
 *    shown to an instructor/student was in the wrong calendar. The locale is
 *    pinned to `ar-EG-u-ca-gregory` / `en-US-u-ca-gregory` so it can never fall
 *    back to the Hijri calendar.
 *
 * 2. Render in the browser's own timezone. The values are stored as UTC
 *    instants, so the only correct wall-clock time for a viewer is the one in
 *    their timezone. `Intl.DateTimeFormat().resolvedOptions().timeZone` is the
 *    browser's zone — a student abroad sees their local time, an instructor in
 *    Cairo sees Cairo time. Hardcoding a single zone would shift every date
 *    for everyone else.
 */

/**
 * The browser's own timezone. Falls back to 'UTC' when the runtime does not
 * expose one (some server/embedded engines return undefined).
 */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function localDateTimeToISO(date: string, time: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0).toISOString()
}

export function formatDate(date: string | Date, locale = 'en'): string {
  const d = new Date(date)
  const loc = locale === 'ar' ? 'ar-EG-u-ca-gregory' : 'en-US-u-ca-gregory'
  return d.toLocaleDateString(loc, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: browserTimeZone(), calendar: 'gregory',
  })
}

export function formatTimeOnly(date: string | Date, locale = 'en'): string {
  return new Date(date).toLocaleTimeString(
    locale === 'ar' ? 'ar-EG-u-ca-gregory' : 'en-US-u-ca-gregory',
    { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: browserTimeZone(), calendar: 'gregory' }
  )
}

export function formatDateOnly(date: string | Date, locale = 'en'): string {
  return new Date(date).toLocaleDateString(
    locale === 'ar' ? 'ar-EG-u-ca-gregory' : 'en-US-u-ca-gregory',
    { year: 'numeric', month: 'long', day: 'numeric', timeZone: browserTimeZone(), calendar: 'gregory' }
  )
}

export function formatRelative(date: string | Date, locale = 'en'): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  if (locale === 'ar') {
    if (diffMins < 1) return 'الآن'
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`
    if (diffHours < 24) return `منذ ${diffHours} ساعة`
    if (diffDays < 7) return `منذ ${diffDays} يوم`
    return formatDateOnly(d, 'ar')
  }
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDateOnly(d, 'en')
}

export function formatCertDate(date: string | Date, locale = 'en'): string {
  const formatted = formatDateOnly(date, locale)
  return locale === 'ar' ? `صدرت في ${formatted}` : `Issued on ${formatted}`
}

export function getNow(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
  })
}

export type DateLike = string | Date | null | undefined

export function formatFullDate(date: DateLike, locale?: string): string {
  if (!date) return '—'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(locale === 'ar' ? 'ar-EG-u-ca-gregory' : 'en-US-u-ca-gregory', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: browserTimeZone(),
  })
}

export function formatShortDate(date: DateLike, locale?: string): string {
  if (!date) return '—'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(locale === 'ar' ? 'ar-EG-u-ca-gregory' : 'en-US-u-ca-gregory', {
    year: 'numeric', month: 'short', day: 'numeric',
    timeZone: browserTimeZone(),
  })
}

export function formatTimeSafe(date: DateLike, locale?: string, fallback = '—'): string {
  if (!date) return fallback
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return fallback
  return d.toLocaleTimeString(locale === 'ar' ? 'ar-EG-u-ca-gregory' : 'en-US-u-ca-gregory', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: browserTimeZone(),
  })
}

export function formatTimeRange(start: DateLike, end: DateLike, locale?: string): string {
  return `${formatTimeSafe(start, locale)} — ${formatTimeSafe(end, locale)}`
}
