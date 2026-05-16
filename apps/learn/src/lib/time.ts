export function localDateTimeToISO(date: string, time: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0).toISOString()
}

export function formatDate(date: string | Date, locale = 'en'): string {
  const d = new Date(date)
  const loc = locale === 'ar' ? 'ar-EG' : 'en-US'
  return d.toLocaleDateString(loc, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

export function formatTimeOnly(date: string | Date, locale = 'en'): string {
  return new Date(date).toLocaleTimeString(
    locale === 'ar' ? 'ar-EG' : 'en-US',
    { hour: 'numeric', minute: '2-digit', hour12: true }
  )
}

export function formatDateOnly(date: string | Date, locale = 'en'): string {
  return new Date(date).toLocaleDateString(
    locale === 'ar' ? 'ar-EG' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
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
