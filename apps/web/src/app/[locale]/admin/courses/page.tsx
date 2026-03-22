'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery } from '@tanstack/react-query'
import { get, patch, post } from '../../../../lib/api'
import { unwrap } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { AdminShell } from '../../../components/AdminShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { useToast } from '../../../../lib/toast'
import { Plus, Search, ChevronLeft, ChevronRight, BookOpen, Layers, DollarSign, Users, Eye, EyeOff } from 'lucide-react'

type AdminCourse = {
  id: string
  titleAr: string
  titleEn: string
  status: 'DRAFT' | 'PUBLISHED'
  price: number
  currency: string
  careerPath?: { titleAr: string; titleEn: string }
  _count?: { enrollments: number }
}

export default function AdminCoursesPage() {
  const t = useTranslations('adminCourses')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const q = useQuery({
    queryKey: ['admin-courses', page, search],
    queryFn: async () => {
      const res = await get('/admin/courses', { params: { page, limit: 10, search } })
      return unwrap(res) as { courses: AdminCourse[], total: number }
    },
    placeholderData: (previousData) => previousData,
  })

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const endpoint = status === 'DRAFT' ? 'approve' : 'reject'
      return await patch(`/admin/courses/${encodeURIComponent(id)}/${endpoint}`, { reason: 'admin toggle' })
    },
    onSuccess: () => {
      toast({ variant: 'success', title: c('success'), description: t('status_updated') })
      q.refetch()
    },
    onError: () => toast({ variant: 'danger', title: c('error'), description: e('something_wrong') }),
  })

  const courses = q.data?.courses ?? []
  const total = q.data?.total ?? 0
  const totalPages = Math.ceil(total / 10)

  return (
    <AuthGate requireRole="ADMIN">
      <AdminShell title={t('title')} subtitle={t('subtitle')}>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
              <Input 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder={t('search_placeholder')} 
                className="pl-10 pr-4"
              />
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> {t('add_course')}
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right">
                <thead className="bg-gray-50 text-xs font-bold uppercase text-[color:var(--muted)] dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4">{t('th_title')}</th>
                    <th className="px-6 py-4">{t('th_path')}</th>
                    <th className="px-6 py-4">{t('th_price')}</th>
                    <th className="px-6 py-4">{t('th_enrollments')}</th>
                    <th className="px-6 py-4">{t('th_status')}</th>
                    <th className="px-6 py-4">{c('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {q.isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="px-6 py-4"><Skeleton className="h-8 w-full" /></td></tr>
                    ))
                  ) : courses.length > 0 ? courses.map((course) => (
                    <tr key={course.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div className="text-sm font-bold text-foreground">{course.titleAr}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[color:var(--muted)]">
                        <div className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {course.careerPath?.titleAr || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {course.price} {course.currency}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[color:var(--muted)]">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {course._count?.enrollments ?? 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest ${
                          course.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => toggleStatus.mutate({ id: course.id, status: course.status })}
                          disabled={toggleStatus.isPending}
                        >
                          {course.status === 'PUBLISHED' ? (
                            <><EyeOff className="mr-1 h-3 w-3" /> {t('unpublish')}</>
                          ) : (
                            <><Eye className="mr-1 h-3 w-3" /> {t('publish')}</>
                          )}
                        </Button>
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
