'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery } from '@tanstack/react-query'
import { get, post } from '../../../../lib/api'
import { unwrap } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { AdminShell } from '../../../components/AdminShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../../lib/toast'
import { DollarSign, User as UserIcon, Calendar, Hash, CreditCard, RotateCcw, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'

type AdminPayment = {
  id: string
  transactionId: string
  amount: number
  currency: string
  status: string
  method: string
  itemType: string
  createdAt: string
  user: { profile?: { firstName?: string; lastName?: string } }
}

export default function AdminPaymentsPage() {
  const t = useTranslations('adminPayments')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const q = useQuery({
    queryKey: ['admin-payments', page, search, status],
    queryFn: async () => {
      const res = await get('/payments/admin/all', {
        params: {
          page,
          limit: 10,
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
        },
      })
      return unwrap(res) as { payments: AdminPayment[]; total: number; stats: any[] }
    },
  })

  const refundMutation = useMutation({
    mutationFn: async (id: string) => (await post(`/payments/admin/${encodeURIComponent(id)}/refund`)),
    onSuccess: () => {
      toast({ variant: 'success', title: c('success'), description: t('refunded') })
      q.refetch()
    },
    onError: () => toast({ variant: 'danger', title: c('error'), description: e('something_wrong') }),
  })

  const payments = q.data?.payments ?? []
  const total = q.data?.total ?? 0
  const totalPages = Math.ceil(total / 10)
  
  // Calculate summary from stats provided by API
  const stats = q.data?.stats ?? []
  const summary = stats.reduce((acc: any, s: any) => {
    const key = s.currency.toUpperCase()
    if (!acc[key]) acc[key] = 0
    if (s.status === 'COMPLETED') acc[key] += s._sum.amount
    return acc
  }, {})

  return (
    <AuthGate requireRole="ADMIN">
      <AdminShell title={t('title')} subtitle={t('subtitle')}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label={t('total_egp')} value={`${summary.EGP || 0} EGP`} icon={<DollarSign className="h-5 w-5" />} color="blue" />
            <StatCard label={t('total_sar')} value={`${summary.SAR || 0} SAR`} icon={<DollarSign className="h-5 w-5" />} color="green" />
            <StatCard label={t('pending')} value={stats.find((s: any) => s.status === 'PENDING')?._sum.amount || 0} icon={<RotateCcw className="h-5 w-5" />} color="amber" />
            <StatCard label={t('refunded')} value={stats.find((s: any) => s.status === 'REFUNDED')?._sum.amount || 0} icon={<RotateCcw className="h-5 w-5" />} color="red" />
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
              <input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder={t('search_placeholder')} 
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] py-2 pl-10 pr-4 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[color:var(--muted)]" />
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">{t('all_statuses')}</option>
                <option value="PENDING">PENDING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="REFUNDED">REFUNDED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right">
                <thead className="bg-gray-50 text-xs font-bold uppercase text-[color:var(--muted)] dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4">{t('th_id')}</th>
                    <th className="px-6 py-4">{t('th_user')}</th>
                    <th className="px-6 py-4">{t('th_amount')}</th>
                    <th className="px-6 py-4">{t('th_method')}</th>
                    <th className="px-6 py-4">{t('th_status')}</th>
                    <th className="px-6 py-4">{c('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {q.isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="px-6 py-4"><Skeleton className="h-8 w-full" /></td></tr>
                    ))
                  ) : payments.length > 0 ? payments.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="text-xs font-bold text-foreground flex items-center gap-1">
                            <Hash className="h-3 w-3" /> {p.transactionId || p.id.slice(0, 8)}
                          </div>
                          <div className="text-[10px] text-[color:var(--muted)] flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5" /> {new Date(p.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                            <UserIcon className="h-4 w-4" />
                          </div>
                          <div className="text-sm font-bold text-foreground">
                            {p.user.profile?.firstName} {p.user.profile?.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground">
                        {p.amount} {p.currency}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
                          <CreditCard className="h-3 w-3" />
                          {p.method}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest ${
                          p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                          p.status === 'REFUNDED' ? 'bg-amber-100 text-amber-700' : 
                          p.status === 'PENDING' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {p.status === 'COMPLETED' && (
                          <Button size="sm" variant="secondary" onClick={() => { if(confirm(t('confirm_refund'))) refundMutation.mutate(p.id) }} disabled={refundMutation.isPending}>
                            <RotateCcw className="mr-1 h-3 w-3" /> {t('refund')}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-6 py-20 text-center text-[color:var(--muted)]">{c('empty')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[color:var(--border)] p-5">
              <div className="text-xs text-[color:var(--muted)]">{t('total_results', { count: total })}</div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-bold text-foreground">{page} / {totalPages || 1}</span>
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

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: 'blue' | 'green' | 'amber' | 'red' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  }
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <div className="text-xs font-bold text-[color:var(--muted)] uppercase tracking-wider">{label}</div>
          <div className="mt-1 text-xl font-black text-foreground">{value}</div>
        </div>
      </div>
    </div>
  )
}
