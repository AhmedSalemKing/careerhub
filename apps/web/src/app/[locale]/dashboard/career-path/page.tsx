'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { unwrapList, unwrap } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { DashboardShell } from '../../../components/DashboardShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../../lib/toast'
import { CourseCard, type CourseCardCourse } from '../../../components/CourseCard'

type AssessmentItem = {
  id: string
  status?: string | null
  completedAt?: string | null
  result?: {
    recommendedCareerPath?: { slug?: string; title?: string | null; titleAr?: string | null } | null
    matchingSkills?: string[] | null
    confidence?: number | null
    recommendedCourses?: CourseCardCourse[] | null
  } | null
} & Record<string, unknown>

type RoadmapStep = { title?: string | null; titleAr?: string | null; description?: string | null; descriptionAr?: string | null }

export default function DashboardCareerPathPage() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('careerPath')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()

  const historyQ = useQuery({
    queryKey: ['assessment-history'],
    queryFn: async () => {
      const res = await get('/career/assessment/history')
      return unwrapList<AssessmentItem>(res, 'assessments')
    },
  })

  const items = historyQ.data || []
  const latest = items.length > 0 ? (items.find((x) => (x?.status || '').toString().toLowerCase().includes('complete')) ?? items[0]) : null

  const slug = latest?.result?.recommendedCareerPath?.slug

  const roadmapQ = useQuery({
    queryKey: ['roadmap', slug, locale],
    enabled: Boolean(slug),
    queryFn: async () => {
      const res = await get(`/career/paths/${encodeURIComponent(String(slug))}/roadmap`, { params: { language: locale } })
      const data = unwrap(res) as any
      return (data?.roadmap?.steps ?? data?.steps ?? []) as RoadmapStep[]
    },
  })

  const courses = latest?.result?.recommendedCourses || []

  return (
    <AuthGate>
      <DashboardShell title={t('title')} subtitle={t('roadmap')}>
        {historyQ.isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : historyQ.isError ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <div className="text-sm text-[color:var(--muted)]">{e('something_wrong')}</div>
            <button
              type="button"
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
              onClick={() => {
                toast({ title: c('loading'), description: c('loading') })
                historyQ.refetch()
              }}
            >
              {c('retry')}
            </button>
          </div>
        ) : !latest ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            {t('empty')}
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                  <div className="text-xs font-semibold text-[color:var(--muted)]">{t('recommended_path')}</div>
                  <div className="mt-2 text-sm font-extrabold text-foreground">
                    {locale === 'ar'
                      ? latest.result?.recommendedCareerPath?.titleAr || latest.result?.recommendedCareerPath?.title || '-'
                      : latest.result?.recommendedCareerPath?.title || latest.result?.recommendedCareerPath?.titleAr || '-'}
                  </div>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                  <div className="text-xs font-semibold text-[color:var(--muted)]">{t('confidence')}</div>
                  <div className="mt-2 text-sm font-extrabold text-foreground">
                    {typeof latest.result?.confidence === 'number' ? `${Math.round(latest.result.confidence)}%` : '-'}
                  </div>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                  <div className="text-xs font-semibold text-[color:var(--muted)]">{t('completed_at')}</div>
                  <div className="mt-2 text-sm font-extrabold text-foreground">{latest.completedAt || '-'}</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm font-extrabold text-foreground">{t('skills')}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(latest.result?.matchingSkills ?? []).slice(0, 20).map((s) => (
                    <span key={s} className="rounded-full bg-[color:var(--surface-2)] px-2 py-1 text-xs text-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
                  <div className="text-sm font-extrabold text-foreground">{t('roadmap')}</div>
                  {roadmapQ.isLoading ? (
                    <div className="mt-4 space-y-3">
                      <Skeleton className="h-16 rounded-2xl" />
                      <Skeleton className="h-16 rounded-2xl" />
                      <Skeleton className="h-16 rounded-2xl" />
                    </div>
                  ) : roadmapQ.isError ? (
                    <div className="mt-4 text-sm text-[color:var(--muted)]">{e('something_wrong')}</div>
                  ) : roadmapQ.data?.length ? (
                    <ol className="mt-4 space-y-3">
                      {roadmapQ.data.slice(0, 10).map((step, idx) => (
                        <li key={idx} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                          <div className="text-xs font-semibold text-[color:var(--muted)]">{t('step', { n: idx + 1 })}</div>
                          <div className="mt-1 text-sm font-extrabold text-foreground">
                            {locale === 'ar'
                              ? step.titleAr || step.title || '-'
                              : step.title || step.titleAr || '-'}
                          </div>
                          <div className="mt-2 text-sm text-[color:var(--muted)]">
                            {locale === 'ar'
                              ? step.descriptionAr || step.description || ''
                              : step.description || step.descriptionAr || ''}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="mt-4 text-sm text-[color:var(--muted)]">{t('roadmap_empty')}</div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
                  <div className="text-sm font-extrabold text-foreground">{t('recommended_courses')}</div>
                  {Array.isArray(courses) && courses.length ? (
                    <div className="mt-4 space-y-4">
                      {courses.slice(0, 4).map((course) => (
                        <CourseCard key={course.id} course={course} locale={locale} />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-[color:var(--muted)]">{c('empty')}</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </DashboardShell>
    </AuthGate>
  )
}

