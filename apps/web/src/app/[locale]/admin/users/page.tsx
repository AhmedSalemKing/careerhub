'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery } from '@tanstack/react-query'
import { del, get, post } from '../../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { AdminShell } from '../../../components/AdminShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../../lib/toast'

type AdminUser = {
  id: string
  email?: string | null
  role?: string | null
  isActive?: boolean | null
  profile?: { firstName?: string | null; lastName?: string | null } | null
} & Record<string, unknown>

export default function AdminUsersPage() {
  const t = useTranslations('adminUsers')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'email' | 'role' | 'status'>('email')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const q = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: async () => {
      const raw = (await get<ApiEnvelope<unknown>>('/api/admin/users', { params: { page, limit: 20, search } })).data
      return unwrapData(raw) as any
    },
  })

  const data = (q.data ?? null) as any
  const items: AdminUser[] = data?.items || data?.users || data?.data?.items || data?.data?.users || []
  const total = Number(data?.total || data?.data?.total || 0)

  const sorted = useMemo(() => {
    const arr = [...items]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const aEmail = String(a.email ?? '')
      const bEmail = String(b.email ?? '')
      const aRole = String(a.role ?? '')
      const bRole = String(b.role ?? '')
      const aStatus = a.isActive ? '1' : '0'
      const bStatus = b.isActive ? '1' : '0'
      const key = sortKey
      const av = key === 'email' ? aEmail : key === 'role' ? aRole : aStatus
      const bv = key === 'email' ? bEmail : key === 'role' ? bRole : bStatus
      return av.localeCompare(bv) * dir
    })
    return arr
  }, [items, sortKey, sortDir])

  const suspend = useMutation({
    mutationFn: async (id: string) => (await post(`/api/admin/users/${encodeURIComponent(id)}/suspend`, { reason: 'admin' })).data,
    onSuccess: () => q.refetch(),
    onError: () => toast({ variant: 'danger', title: t('title'), description: e('something_wrong') }),
  })

  const activate = useMutation({
    mutationFn: async (id: string) => (await post(`/api/admin/users/${encodeURIComponent(id)}/unsuspend`)).data,
    onSuccess: () => q.refetch(),
    onError: () => toast({ variant: 'danger', title: t('title'), description: e('something_wrong') }),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => (await del(`/api/admin/users/${encodeURIComponent(id)}`)).data,
    onSuccess: () => q.refetch(),
    onError: () => toast({ variant: 'danger', title: t('title'), description: e('something_wrong') }),
  })

  const toggleSort = (k: typeof sortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir('asc')
    }
  }

  return (
    <AuthGate>
      <AdminShell title={t('title')} subtitle={t('subtitle')}>
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-extrabold text-foreground">{t('search_label')}</div>
            <div className="flex w-full max-w-md gap-2">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search_placeholder')} />
              <Button type="button" variant="secondary" onClick={() => q.refetch()}>
                {c('search')}
              </Button>
            </div>
          </div>
        </div>

        {q.isLoading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-12 rounded-2xl" />
          </div>
        ) : q.isError ? (
          <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <div className="text-sm text-[color:var(--muted)]">{e('something_wrong')}</div>
            <button
              type="button"
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
              onClick={() => {
                toast({ title: c('loading'), description: c('loading') })
                q.refetch()
              }}
            >
              {c('retry')}
            </button>
          </div>
        ) : sorted.length ? (
          <>
            <div className="mt-6 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--surface-2)] text-[color:var(--muted)]">
                  <tr>
                    <Th onClick={() => toggleSort('email')}>{t('th_email')}</Th>
                    <Th onClick={() => toggleSort('role')}>{t('th_role')}</Th>
                    <Th onClick={() => toggleSort('status')}>{t('th_status')}</Th>
                    <th className="px-4 py-3 text-right font-semibold">{t('th_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((u) => (
                    <tr key={u.id} className="border-t border-[color:var(--border)]">
                      <td className="px-4 py-3 font-semibold text-foreground">{u.email || '-'}</td>
                      <td className="px-4 py-3 text-[color:var(--muted)]">{u.role || '-'}</td>
                      <td className="px-4 py-3 text-[color:var(--muted)]">
                        {u.isActive ? t('active') : t('suspended')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {u.isActive ? (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => suspend.mutate(u.id)}
                              disabled={suspend.isPending}
                            >
                              {t('suspend')}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => activate.mutate(u.id)}
                              disabled={activate.isPending}
                            >
                              {t('activate')}
                            </Button>
                          )}
                          <Button type="button" variant="danger" onClick={() => remove.mutate(u.id)} disabled={remove.isPending}>
                            {c('delete')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-[color:var(--muted)]">
                {t('total', { n: total || sorted.length })}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  {c('previous')}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={sorted.length < 20}>
                  {c('next')}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            {c('empty')}
          </div>
        )}
      </AdminShell>
    </AuthGate>
  )
}

function Th({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <th className="cursor-pointer px-4 py-3 text-right font-semibold" onClick={onClick}>
      {children}
    </th>
  )
}

