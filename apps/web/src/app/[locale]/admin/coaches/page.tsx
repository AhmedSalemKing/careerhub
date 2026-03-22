'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery } from '@tanstack/react-query'
import { get, post, patch } from '../../../../lib/api'
import { unwrap } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { AdminShell } from '../../../components/AdminShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../../lib/toast'
import { Plus, Star, X, Check, ChevronLeft, ChevronRight, User as UserIcon, Calendar, MessageSquare, Briefcase } from 'lucide-react'

type AdminCoach = {
  id: string
  user: {
    id: string
    email: string
    isActive: boolean
    profile?: { firstName?: string; lastName?: string; avatar?: string }
  }
  specialties: string[]
  hourlyRate: number
  rating: number
  totalSessions: number
  totalReviews: number
  bioEn: string
  bioAr: string
  experience: number
}

export default function AdminCoachesPage() {
  const t = useTranslations('adminCoaches')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const q = useQuery({
    queryKey: ['admin-coaches', page],
    queryFn: async () => {
      const res = await get('/coaching/admin/all', { params: { page, limit: 10 } })
      return unwrap(res) as { coaches: AdminCoach[], total: number, totalPages: number }
    },
    placeholderData: (previousData) => previousData,
  })

  const coachDetailsQ = useQuery({
    queryKey: ['admin-coach-details', selectedCoachId],
    enabled: !!selectedCoachId,
    queryFn: async () => {
      const res = await get(`/coaching/coaches/${encodeURIComponent(selectedCoachId!)}`)
      return unwrap(res) as any
    },
  })

  const coaches = q.data?.coaches ?? []
  const totalPages = q.data?.totalPages ?? 1

  return (
    <AuthGate requireRole="ADMIN">
      <AdminShell title={t('title')} subtitle={t('subtitle')}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-foreground">{t('all_coaches')}</h3>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> {t('add_coach')}
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right">
                <thead className="bg-gray-50 text-xs font-bold uppercase text-[color:var(--muted)] dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4">{c('name')}</th>
                    <th className="px-6 py-4">{t('th_specialties')}</th>
                    <th className="px-6 py-4">{t('th_rate')}</th>
                    <th className="px-6 py-4">{t('th_rating')}</th>
                    <th className="px-6 py-4">{t('th_sessions')}</th>
                    <th className="px-6 py-4">{c('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--border)]">
                  {q.isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="px-6 py-4"><Skeleton className="h-8 w-full" /></td></tr>
                    ))
                  ) : coaches.length > 0 ? coaches.map((coach) => (
                    <tr 
                      key={coach.id} 
                      className="cursor-pointer transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                      onClick={() => setSelectedCoachId(coach.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <UserIcon className="h-5 w-5" />
                          </div>
                          <div className="text-sm font-bold text-foreground">
                            {coach.user.profile?.firstName} {coach.user.profile?.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {coach.specialties?.slice(0, 2).map((s, idx) => (
                            <span key={idx} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              {s}
                            </span>
                          ))}
                          {coach.specialties?.length > 2 && (
                            <span className="text-[10px] text-[color:var(--muted)]">+{coach.specialties.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground">{coach.hourlyRate} EGP</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-amber-500" />
                          {coach.rating || '0.0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[color:var(--muted)]">{coach.totalSessions}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest ${
                          coach.user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {coach.user.isActive ? t('status_active') : t('status_inactive')}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-6 py-20 text-center text-[color:var(--muted)]">{c('empty')}</td></tr>
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

        {selectedCoachId && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
            <div className="h-full w-full max-w-xl animate-in slide-in-from-right bg-[color:var(--surface)] shadow-2xl overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[color:var(--border)] bg-[color:var(--surface)] p-6">
                <h3 className="text-lg font-black text-foreground">{t('coach_details')}</h3>
                <button onClick={() => setSelectedCoachId(null)} className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <X className="h-5 w-5 text-[color:var(--muted)]" />
                </button>
              </div>

              {coachDetailsQ.isLoading ? (
                <div className="p-6 space-y-6">
                  <Skeleton className="h-32 rounded-2xl" />
                  <Skeleton className="h-64 rounded-2xl" />
                </div>
              ) : coachDetailsQ.data ? (
                <div className="p-6 space-y-8">
                  <div className="flex items-center gap-5 rounded-2xl border border-[color:var(--border)] bg-gray-50/50 p-6 dark:bg-gray-800/50">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <UserIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-foreground">
                        {coachDetailsQ.data.user?.firstName} {coachDetailsQ.data.user?.lastName}
                      </h4>
                      <p className="text-sm text-[color:var(--muted)]">{coachDetailsQ.data.user?.email}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                          <Star className="h-4 w-4 fill-amber-500" />
                          {coachDetailsQ.data.rating}
                        </div>
                        <span className="text-[color:var(--muted)]">•</span>
                        <span className="text-xs font-bold text-[color:var(--muted)]">{coachDetailsQ.data.totalSessions} {t('th_sessions')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label={t('th_rate')} value={`${coachDetailsQ.data.hourlyRate} EGP`} icon={<DollarSignIcon className="h-4 w-4" />} />
                    <DetailItem label={t('th_experience')} value={`${coachDetailsQ.data.experience} ${c('years')}`} icon={<Briefcase className="h-4 w-4" />} />
                  </div>

                  <div className="space-y-4">
                    <SectionTitle icon={<UserIcon className="h-5 w-5" />} title={t('bio')} />
                    <p className="text-sm leading-relaxed text-[color:var(--muted)]">
                      {coachDetailsQ.data.bio || c('none')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <SectionTitle icon={<MessageSquare className="h-5 w-5" />} title={t('reviews')} />
                    <div className="space-y-4">
                      {coachDetailsQ.data.reviews?.length > 0 ? coachDetailsQ.data.reviews.map((r: any) => (
                        <div key={r.id} className="rounded-xl border border-[color:var(--border)] p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-bold text-foreground">{r.user?.firstName} {r.user?.lastName}</div>
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                              <Star className="h-3 w-3 fill-amber-500" />
                              {r.rating}
                            </div>
                          </div>
                          <p className="text-xs text-[color:var(--muted)]">{r.comment}</p>
                          <div className="text-[10px] text-[color:var(--muted)]">{new Date(r.createdAt).toLocaleDateString()}</div>
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

function DollarSignIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
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
