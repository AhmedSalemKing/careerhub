'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../lib/unwrap'
import { AuthGate } from '../../components/AuthGate'
import { DashboardShell } from '../../components/DashboardShell'
import { CourseCard, type CourseCardCourse } from '../../components/CourseCard'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../../lib/toast'

type DashboardData = {
  stats?: {
    enrolledCourses?: number
    completedCourses?: number
    certificatesEarned?: number
  }
  recommendedCourses?: CourseCardCourse[]
  recommendedCareerPath?: { slug?: string; title?: string; titleAr?: string } | null
}

export default function DashboardPage() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('dashboard')
  const c = useTranslations('common')
  const { toast } = useToast()

  const q = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => unwrapData((await get<ApiEnvelope<DashboardData>>('/api/users/dashboard')).data),
  })

  const stats = q.data?.stats
  const courses = q.data?.recommendedCourses ?? []

  return (
    <AuthGate>
      <DashboardShell title={t('overview')} subtitle={t('assessment_prompt')}>
        {q.isLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        ) : q.isError ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <div className="text-sm text-[color:var(--muted)]">{c('empty')}</div>
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
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <Stat label={t('enrolled_courses')} value={stats?.enrolledCourses ?? 0} />
              <Stat label={t('completed_courses')} value={stats?.completedCourses ?? 0} />
              <Stat label={t('certificates_earned')} value={stats?.certificatesEarned ?? 0} />
            </div>

            <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
              <div className="flex items-end justify-between gap-4">
                <div className="text-sm font-extrabold text-foreground">{t('courses')}</div>
              </div>
              {courses.length ? (
                <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {courses.slice(0, 6).map((course) => (
                    <CourseCard key={course.id} course={course} locale={locale} />
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-sm text-[color:var(--muted)]">{c('empty')}</div>
              )}
            </div>
          </>
        )}
      </DashboardShell>
    </AuthGate>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm">
      <div className="text-xs font-semibold text-[color:var(--muted)]">{label}</div>
      <div className="mt-2 text-2xl font-extrabold text-foreground">{value}</div>
    </div>
  )
}

