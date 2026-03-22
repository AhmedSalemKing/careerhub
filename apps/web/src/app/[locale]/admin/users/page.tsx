'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery } from '@tanstack/react-query'
import { del, get, post } from '../../../../lib/api'
import { unwrap, unwrapList } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { AdminShell } from '../../../components/AdminShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../../lib/toast'
import { Search, Filter, X, Trash2, ShieldAlert, ShieldCheck, ChevronLeft, ChevronRight, User as UserIcon, Book, Calendar, CreditCard } from 'lucide-react'

type AdminUser = {
  id: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  profile?: { firstName?: string; lastName?: string; country?: string; phone?: string } | null
  _count?: { enrollments: number; sessions: number; payments: number }
}

export default function AdminUsersPage() {
  const t = useTranslations('adminUsers')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const q = useQuery({
    queryKey: ['admin-users', page, search, role, status],
    queryFn: async () => {
      const res = await get('/admin/users', {
        params: {
          page,
          limit: 10,
          ...(search ? { search } : {}),
          ...(role ? { role } : {}),
          ...(status ? { status } : {}),
        },
      })
      return unwrap(res) as { users: AdminUser[]; total: number }
    },
    placeholderData: (previousData) => previousData,
  })

  const userDetailsQ = useQuery({
    queryKey: ['admin-user-details', selectedUser],
    enabled: !!selectedUser,
    queryFn: async () => {
      const res = await get(`/admin/users/${encodeURIComponent(selectedUser!)}`)
      return unwrap(res) as any
    },
  })

  const suspend = useMutation({
    mutationFn: async (id: string) => (await post(`/admin/users/${encodeURIComponent(id)}/suspend`, { reason: 'admin' })),
    onSuccess: () => {
      toast({ variant: 'success', title: c('success'), description: t('suspended') })
      q.refetch()
    },
    onError: () => toast({ variant: 'danger', title: c('error'), description: e('something_wrong') }),
  })

  const activate = useMutation({
    mutationFn: async (id: string) => (await post(`/admin/users/${encodeURIComponent(id)}/unsuspend`)),
    onSuccess: () => {
      toast({ variant: 'success', title: c('success'), description: t('activated') })
      q.refetch()
    },
    onError: () => toast({ variant: 'danger', title: c('error'), description: e('something_wrong') }),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => (await del(`/admin/users/${encodeURIComponent(id)}`)),
    onSuccess: () => {
      toast({ variant: 'success', title: c('success'), description: t('deleted') })
      q.refetch()
    },
    onError: () => toast({ variant: 'danger', title: c('error'), description: e('something_wrong') }),
  })

  const users = q.data?.users ?? []
  const total = q.data?.total ?? 0
  const totalPages = Math.ceil(total / 10)

  return (
    <AuthGate requireRole="ADMIN">
      <AdminShell title={t('title')} subtitle={t('subtitle')}>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder={t('search_placeholder')} 
                className="pl-10 pr-4"
              />
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">{t('all_roles')}</option>
                <option value="USER">USER</option>
                <option value="COACH">COACH</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">{t('all_statuses')}</option>
                <option value="ACTIVE">{t('status_active')}</option>
                <option value="SUSPENDED">{t('status_suspended')}</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right">
                <thead className="bg-gray-50 text-xs font-bold uppercase text-[color:var(--muted)] dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4">{c('name')}</th>
                    <th className="px-6 py-4">{c('email')}</th>
                    <th className="px-6 py-4">{c('role')}</th>
                    <th className="px-6 py-4">{c('status')}</th>
                    <th className="px-6 py-4">{c('date')}</th>
                    <th className="px-6 py-4">{c('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {q.isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="px-6 py-4"><Skeleton className="h-8 w-full" /></td></tr>
                    ))
                  ) : users.length > 0 ? users.map((u) => (
                    <tr 
                      key={u.id} 
                      className="cursor-pointer transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                      onClick={() => setSelectedUser(u.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <UserIcon className="h-5 w-5" />
                          </div>
                          <div className="text-sm font-bold text-foreground">
                            {u.profile?.firstName} {u.profile?.lastName}
                            {u.profile?.country && <span className="ml-2 text-[10px] text-[color:var(--muted)]">{u.profile.country}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[color:var(--muted)]">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 
                          u.role === 'COACH' ? 'bg-amber-100 text-amber-700' : 
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest ${
                          u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.isActive ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                          {u.isActive ? t('status_active') : t('status_suspended')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[color:var(--muted)]">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {u.isActive ? (
                            <Button size="sm" variant="secondary" onClick={() => suspend.mutate(u.id)} disabled={suspend.isPending}>
                              <ShieldAlert className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="secondary" onClick={() => activate.mutate(u.id)} disabled={activate.isPending}>
                              <ShieldCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="danger" onClick={() => { if(confirm(c('confirm_delete'))) remove.mutate(u.id) }} disabled={remove.isPending}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

        {selectedUser && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
            <div className="h-full w-full max-w-xl animate-in slide-in-from-right bg-[color:var(--surface)] shadow-2xl overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[color:var(--border)] bg-[color:var(--surface)] p-6">
                <h3 className="text-lg font-black text-foreground">{t('user_details')}</h3>
                <button onClick={() => setSelectedUser(null)} className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="h-5 w-5 text-[color:var(--muted)]" />
                </button>
              </div>

              {userDetailsQ.isLoading ? (
                <div className="p-6 space-y-6">
                  <Skeleton className="h-32 rounded-2xl" />
                  <Skeleton className="h-64 rounded-2xl" />
                </div>
              ) : userDetailsQ.data ? (
                <div className="p-6 space-y-8">
                  <div className="flex items-center gap-5 rounded-2xl border border-[color:var(--border)] bg-gray-50/50 p-6 dark:bg-gray-800/50">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <UserIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-foreground">{userDetailsQ.data.profile?.firstName} {userDetailsQ.data.profile?.lastName}</h4>
                      <p className="text-sm text-[color:var(--muted)]">{userDetailsQ.data.email}</p>
                      <div className="mt-2 flex gap-2">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{userDetailsQ.data.role}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${userDetailsQ.data.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {userDetailsQ.data.isActive ? t('status_active') : t('status_suspended')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label={c('phone')} value={userDetailsQ.data.profile?.phone || c('none')} icon={<UserIcon className="h-4 w-4" />} />
                    <DetailItem label={c('country')} value={userDetailsQ.data.profile?.country || c('none')} icon={<UserIcon className="h-4 w-4" />} />
                  </div>

                  <div className="space-y-4">
                    <SectionTitle icon={<Book className="h-5 w-5" />} title={t('enrolled_courses')} />
                    <div className="space-y-3">
                      {userDetailsQ.data.enrollments?.length > 0 ? userDetailsQ.data.enrollments.map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between rounded-xl border border-[color:var(--border)] p-4">
                          <div className="text-sm font-bold text-foreground">{e.course?.titleAr || e.course?.titleEn}</div>
                          <div className="text-xs text-[color:var(--muted)]">{new Date(e.createdAt).toLocaleDateString()}</div>
                        </div>
                      )) : <p className="text-sm text-[color:var(--muted)]">{c('empty')}</p>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle icon={<Calendar className="h-5 w-5" />} title={t('sessions_history')} />
                    <div className="space-y-3">
                      {userDetailsQ.data.sessions?.length > 0 ? userDetailsQ.data.sessions.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between rounded-xl border border-[color:var(--border)] p-4">
                          <div>
                            <div className="text-sm font-bold text-foreground">{s.coach?.user?.profile?.firstName} {s.coach?.user?.profile?.lastName}</div>
                            <div className="text-[10px] text-[color:var(--muted)]">{s.status}</div>
                          </div>
                          <div className="text-xs text-[color:var(--muted)]">{new Date(s.scheduledAt).toLocaleDateString()}</div>
                        </div>
                      )) : <p className="text-sm text-[color:var(--muted)]">{c('empty')}</p>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle icon={<CreditCard className="h-5 w-5" />} title={t('payment_history')} />
                    <div className="space-y-3">
                      {userDetailsQ.data.payments?.length > 0 ? userDetailsQ.data.payments.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between rounded-xl border border-[color:var(--border)] p-4">
                          <div className="text-sm font-bold text-foreground">{p.amount} {p.currency}</div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-bold uppercase text-green-600">{p.status}</span>
                            <div className="text-xs text-[color:var(--muted)]">{new Date(p.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      )) : <p className="text-sm text-[color:var(--muted)]">{c('empty')}</p>}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </AdminShell>
    </AuthGate>
  )
}

function DetailItem({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] p-4">
      <div className="flex items-center gap-2 text-[10px] font-bold text-[color:var(--muted)] uppercase tracking-wider">
        {icon} {label}
      </div>
      <div className="mt-1 text-sm font-bold text-foreground">{value}</div>
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-[color:var(--border)] pb-2">
      <div className="text-primary">{icon}</div>
      <h5 className="text-sm font-black text-foreground uppercase tracking-widest">{title}</h5>
    </div>
  )
}
