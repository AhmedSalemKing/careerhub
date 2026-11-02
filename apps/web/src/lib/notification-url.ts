/**
 * Where clicking a notification should take the user. Session notifications
 * go to a different page for consultants and students, so the account type
 * matters; everything unknown falls back to the dashboard home.
 */
export function getNotificationUrl(
  notification: { type?: string | null; data?: unknown },
  locale: string,
  accountType?: string | null,
): string {
  const type = String(notification.type || '')
  const data = (notification.data && typeof notification.data === 'object' ? notification.data : {}) as Record<string, any>
  const kind = String(data.kind || '')
  const base = `/${locale}/dashboard`
  const isConsultant = accountType === 'CONSULTANT'

  if (/SESSION|RESCHEDULE|BOOKING|COACHING/.test(type) || /SESSION|RESCHEDULE/.test(kind)) {
    return isConsultant ? `${base}/client-sessions` : `${base}/my-sessions`
  }
  if (/COURSE|LIVE|STREAM/.test(type)) {
    if (data.courseId && accountType === 'INSTRUCTOR') return `${base}/courses/${data.courseId}/manage`
    return `${base}/my-courses`
  }
  if (/PAYMENT|EARNING/.test(type)) {
    if (isConsultant) return `${base}/earnings`
    return accountType === 'INSTRUCTOR' ? `${base}/revenue` : `${base}/invoices`
  }
  if (/CERTIFICATE/.test(type)) return `${base}/certificates`
  return base
}
