'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { Calendar, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '../../../../stores/authStore'

export default function DashboardCoachingPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const { user } = useAuthStore()

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['my-sessions-preview'],
    queryFn: async () => {
      const res = await get('/sessions/my-sessions')
      const d = (res?.data as any)?.data ?? []
      return Array.isArray(d) ? d.slice(0, 3) : []
    }
  })

  const statusLabel: Record<string, string> = {
    PENDING: isAr ? 'معلقة' : 'Pending',
    CONFIRMED: isAr ? 'مؤكدة' : 'Confirmed',
    RESCHEDULED: isAr ? 'تغيير موعد' : 'Rescheduled',
    COMPLETED: isAr ? 'مكتملة' : 'Completed',
    CANCELLED: isAr ? 'ملغية' : 'Cancelled',
    REJECTED: isAr ? 'مرفوضة' : 'Rejected',
  }
  const statusColor: Record<string, string> = {
    PENDING: 'bg-amber-500/20 text-amber-400',
    CONFIRMED: 'bg-green-500/20 text-green-400',
    RESCHEDULED: 'bg-blue-500/20 text-blue-400',
    COMPLETED: 'bg-gray-500/20 text-gray-400',
    CANCELLED: 'bg-red-500/20 text-red-400',
    REJECTED: 'bg-red-500/20 text-red-400',
  }

  const isConsultant = user?.accountType === 'CONSULTANT'

  return (
    <div className="p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isConsultant ? (isAr ? 'جلساتي الاستشارية' : 'My Sessions') : (isAr ? 'الاستشارات المهنية' : 'Professional Consulting')}
          </h1>
          <p className="text-[color:var(--muted)] text-sm mt-1">
            {isConsultant ? (isAr ? 'إدارة وقبول طلبات الاستشارة' : 'Manage and accept consultation requests') : (isAr ? 'احجز جلسة مع مستشار مهني متخصص' : 'Book a session with a professional consultant')}
          </p>
        </div>
        {!isConsultant && (
          <Link
            href={`/${locale}/coaching`}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition shadow-sm shadow-primary/20"
          >
            {isAr ? 'احجز استشارة' : 'Book Session'}
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Recent sessions preview */}
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--border)]">
          <h2 className="font-semibold text-foreground">{isAr ? 'آخر الجلسات' : 'Recent Sessions'}</h2>
          <Link href={`/${locale}/dashboard/my-sessions`}
            className="text-sm text-primary hover:underline flex items-center gap-1">
            {isAr ? 'عرض الكل' : 'View All'} <ChevronLeft className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1,2,3].map(i => <div key={i} className="h-12 animate-pulse rounded-xl bg-[color:var(--surface-2)]" />)}
          </div>
        ) : (sessions as any[]).length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 opacity-20" />
            <p className="text-[color:var(--muted)] text-sm">{isAr ? 'لا توجد جلسات بعد' : 'No sessions yet'}</p>
            {!isConsultant && (
              <Link href={`/${locale}/coaching`}
                className="mt-3 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">
                {isAr ? 'احجز أول استشارة' : 'Book First Session'}
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[color:var(--border)]">
            {(sessions as any[]).map((s: any) => {
              const other = isConsultant ? s.student : s.consultant
              const name = `${other?.profile?.firstName || ''} ${other?.profile?.lastName || ''}`.trim() || other?.email || '—'
              return (
                <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="font-medium text-foreground text-sm">{name}</p>
                    <p className="text-xs text-[color:var(--muted)] mt-0.5">
                      {new Date(s.scheduledAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {s.topic ? ` — ${s.topic}` : ''}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor[s.status] || ''}`}>
                    {statusLabel[s.status] || s.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* CTA for students */}
      {!isConsultant && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground mb-1">{isAr ? 'تحتاج توجيه مهني؟' : 'Need career guidance?'}</h3>
            <p className="text-sm text-[color:var(--muted)]">{isAr ? 'تواصل مع مستشار متخصص للحصول على خارطة طريق واضحة' : 'Connect with a specialist for a clear roadmap'}</p>
          </div>
          <Link href={`/${locale}/coaching`}
            className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition">
            {isAr ? 'تصفح المستشارين' : 'Browse Consultants'}
          </Link>
        </div>
      )}
    </div>
  )
}
