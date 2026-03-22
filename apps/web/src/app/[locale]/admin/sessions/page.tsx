'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { unwrap } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { AdminShell } from '../../../components/AdminShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../../lib/toast'
import { Calendar, User as UserIcon, Video, ChevronLeft, ChevronRight, Filter, Clock, CheckCircle, XCircle } from 'lucide-react'

type AdminSession = {
  id: string
  status: string
  startTime: string
  price: number
  zoomJoinUrl?: string
  user: { profile?: { firstName?: string; lastName?: string } }
  coach: { user: { profile?: { firstName?: string; lastName?: string } } }
}

export default function AdminSessionsPage() {
  const t = useTranslations('adminSessions')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const q = useQuery({
    queryKey: ['admin-sessions', page, status],
    queryFn: async () => {
      const res = await get('/coaching/admin/sessions', {
        params: { page, limit: 10, status: status || undefined },
      })
      return unwrap(res) as { sessions: AdminSession[]; total: number; totalPages: number }
    },
    placeholderData: (previousData) => previousData,
  })

  const sessions = q.data?.sessions ?? []
  const totalPages = q.data?.totalPages ?? 1

  return (
    <AuthGate requireRole="ADMIN">
      <AdminShell title={t('title')} subtitle={t('subtitle')}>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-[color:var(--muted)]" />
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">{t('all_statuses')}</option>
                <option value="PENDING">PENDING</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right">
                <thead className="bg-gray-50 text-xs font-bold uppercase text-[color:var(--muted)] dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4">{t('th_user')}</th>
                    <th className="px-6 py-4">{t('th_coach')}</th>
                    <th className="px-6 py-4">{t('th_time')}</th>
                    <th className="px-6 py-4">{t('th_status')}</th>
                    <th className="px-6 py-4">{c('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {q.isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="px-6 py-4"><Skeleton className="h-8 w-full" /></td></tr>
                    ))
                  ) : sessions.length > 0 ? sessions.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <div className="text-sm font-bold text-foreground">
                            {s.user.profile?.firstName} {s.user.profile?.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <div className="text-sm font-bold text-foreground">
                            {s.coach.user.profile?.firstName} {s.coach.user.profile?.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(s.startTime).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-[color:var(--muted)]">
                            <Clock className="h-3 w-3" />
                            {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest ${
                          s.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                          s.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 
                          s.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {s.status === 'COMPLETED' ? <CheckCircle className="h-3 w-3" /> : 
                           s.status === 'CANCELLED' ? <XCircle className="h-3 w-3" /> : 
                           <Clock className="h-3 w-3" />}
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {s.zoomJoinUrl && (
                          <Button size="sm" variant="secondary" onClick={() => window.open(s.zoomJoinUrl, '_blank')}>
                            <Video className="mr-1 h-3 w-3" /> {t('join')}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-20 text-center text-[color:var(--muted)]">{c('empty')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[color:var(--border)] p-5">
              <div className="text-xs text-[color:var(--muted)]">{t('total_results', { count: q.data?.total ?? 0 })}</div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-bold text-foreground">{page} / {totalPages}</span>
                <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AdminShell>
    </AuthGate>
  )
}
