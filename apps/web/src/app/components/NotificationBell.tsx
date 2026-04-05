'use client'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { get, patch } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'

type Notification = {
  id: string
  type: string
  titleEn: string
  titleAr: string
  contentEn: string
  contentAr: string
  isRead: boolean
  createdAt: string
}

function notifStyle(type: string) {
  switch (type) {
    case 'PAYMENT_CONFIRMED':
    case 'CERTIFICATE_EARNED':
    case 'LESSON_COMPLETED':
      return 'border-r-4 border-green-500 bg-green-500/5'
    case 'COACHING_REMINDER':
      return 'border-r-4 border-amber-500 bg-amber-500/5'
    default:
      return 'border-r-4 border-primary bg-primary/5'
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    enabled: !!token,
    queryFn: async () => {
      try {
        const res = await get('/notifications')
        const d = (res?.data as any)?.data
        return Array.isArray(d) ? d : (d?.notifications ?? [])
      } catch {
        return []
      }
    },
    refetchInterval: 30000,
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAllRead = useMutation({
    mutationFn: () => patch('/notifications/mark-all-read', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  if (!token) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[color:var(--surface-2)] transition"
        aria-label="الإشعارات"
      >
        <Bell className="h-5 w-5 text-[color:var(--muted)]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 z-50 mt-2 w-80 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-2xl overflow-hidden"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[color:var(--border)] p-4">
              <h3 className="font-bold font-madinet text-foreground">الإشعارات</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs text-primary hover:underline"
                >
                  تعليم الكل كمقروء
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[color:var(--muted)]">
                  <Bell className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">لا توجد إشعارات</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 border-b border-[color:var(--border)] last:border-0 transition ${
                      !n.isRead ? notifStyle(n.type) : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {n.titleAr || n.titleEn}
                        </p>
                        <p className="text-xs text-[color:var(--muted)] mt-0.5 leading-relaxed">
                          {n.contentAr || n.contentEn}
                        </p>
                        <p className="text-xs text-[color:var(--muted)] mt-1 opacity-60">
                          {new Date(n.createdAt).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
