'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { get, patch } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'

/* Notification pages live in the web app (cross-domain). */
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://deveway-teal.vercel.app'

type Notification = {
  id: string
  type: string
  titleEn: string
  titleAr: string
  contentEn: string
  contentAr: string
  data?: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

/** Same routing rules as the web app's notification bell (apps/web/src/lib/notification-url.ts). */
function notificationPath(n: Notification, locale: string, accountType?: string | null): string {
  const type = String(n.type || '')
  const data = (n.data && typeof n.data === 'object' ? n.data : {}) as Record<string, any>
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

function timeAgo(iso: string, isAr: boolean): string {
  const t = new Date(iso).getTime()
  if (isNaN(t)) return ''
  const diff = Math.max(0, Date.now() - t)
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (isAr) {
    if (mins < 1) return 'الآن'
    if (mins < 60) return `منذ ${mins} دقيقة`
    if (hours < 24) return `منذ ${hours} ساعة`
    if (days === 1) return 'أمس'
    if (days < 7) return `منذ ${days} أيام`
    return new Date(iso).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
  }
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  if (hours < 24) return `${hours} h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} d ago`
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function NotificationBell() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const token = useAuthStore((s) => s.token)
  const accountType = useAuthStore((s) => (s.user as { accountType?: string } | null)?.accountType)
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const { data: raw = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    enabled: !!token,
    refetchInterval: 60000,
    queryFn: async () => {
      try {
        const res = await get('/notifications')
        const d = (res?.data as any)?.data
        return Array.isArray(d) ? d : (d?.notifications ?? [])
      } catch {
        return []
      }
    },
  })
  const notifications = Array.isArray(raw) ? raw : []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAllRead = useMutation({
    mutationFn: () => patch('/notifications/mark-all-read', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const markRead = useMutation({
    mutationFn: (id: string) => patch(`/notifications/${encodeURIComponent(id)}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const openNotification = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.id)
    setOpen(false)
    window.location.href = `${WEB_URL}${notificationPath(n, locale, accountType)}`
  }

  if (!token) return null

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={isAr ? 'الإشعارات' : 'Notifications'}
        aria-haspopup="true"
        aria-expanded={open}
        title={isAr ? 'الإشعارات' : 'Notifications'}
      >
        <Bell className="icon" />
        {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div
          dir={isAr ? 'rtl' : 'ltr'}
          role="dialog"
          aria-label={isAr ? 'الإشعارات' : 'Notifications'}
          style={{
            position: 'absolute',
            top: '100%',
            [isAr ? 'left' : 'right']: 0,
            marginTop: 8,
            width: 320,
            maxWidth: 'calc(100vw - 1.5rem)',
            zIndex: 60,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            overflow: 'hidden',
            textAlign: isAr ? 'right' : 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: 16, borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{isAr ? 'الإشعارات' : 'Notifications'}</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: 'var(--brand)' }}
              >
                {isAr ? 'تعليم الكل كمقروء' : 'Mark all as read'}
              </button>
            )}
          </div>

          <div style={{ maxHeight: 384, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
                <Bell style={{ margin: '0 auto 8px', opacity: 0.3 }} size={32} />
                <p style={{ margin: 0, fontSize: 14 }}>{isAr ? 'لا توجد إشعارات' : 'No notifications'}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openNotification(n)}
                  onKeyDown={(e) => { if (e.key === 'Enter') openNotification(n) }}
                  style={{
                    padding: 14,
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    opacity: n.isRead ? 0.6 : 1,
                    background: n.isRead ? 'transparent' : 'color-mix(in srgb, var(--brand) 6%, transparent)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--foreground)', overflowWrap: 'anywhere' }}>
                      {isAr ? (n.titleAr || n.titleEn) : (n.titleEn || n.titleAr)}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, lineHeight: 1.6, color: 'var(--muted)', overflowWrap: 'anywhere' }}>
                      {isAr ? (n.contentAr || n.contentEn) : (n.contentEn || n.contentAr)}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--muted)', opacity: 0.7 }}>{timeAgo(n.createdAt, isAr)}</p>
                  </div>
                  {!n.isRead && <span aria-hidden="true" style={{ marginTop: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0 }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
