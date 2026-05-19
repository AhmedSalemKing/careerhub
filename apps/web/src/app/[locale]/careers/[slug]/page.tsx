'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { useToast } from '../../../../lib/toast'
import { Skeleton } from '../../../components/ui/Skeleton'
import { CourseCard, type CourseCardCourse } from '../../../components/CourseCard'

type CareerPath = {
  id: string
  slug: string
  title?: string | null
  titleAr?: string | null
  description?: string | null
  descriptionAr?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  skills?: string[] | null
}

function asArrayOfStrings(v: unknown): string[] | null {
  return Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : null
}

export default function CareerPathSlugPage() {
  const { slug } = useParams<{ slug: string }>()
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('careers')
  const c = useTranslations('common')
  const { toast } = useToast()

  const pathQuery = useQuery({
    queryKey: ['career-path', slug, locale],
    queryFn: async () => (await get<CareerPath>(`/api/career/paths/${encodeURIComponent(slug)}`)).data,
  })

  const coursesQuery = useQuery({
    queryKey: ['career-path-courses', slug],
    queryFn: async () =>
      (await get<CourseCardCourse[]>(`/api/career/paths/${encodeURIComponent(slug)}/courses`)).data,
  })

  const title =
    locale === 'ar'
      ? pathQuery.data?.titleAr || pathQuery.data?.title || ''
      : pathQuery.data?.title || pathQuery.data?.titleAr || ''
  const desc =
    locale === 'ar'
      ? pathQuery.data?.descriptionAr || pathQuery.data?.description || ''
      : pathQuery.data?.description || pathQuery.data?.descriptionAr || ''

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {pathQuery.isLoading ? <Skeleton className="h-8 w-72" /> : title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-[color:var(--muted)] sm:text-base">
            {pathQuery.isLoading ? <Skeleton className="h-5 w-[520px]" /> : desc}
          </p>
        </div>
        <Link
          href="/careers"
          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-foreground hover:bg-[color:var(--surface-2)]"
        >
          {c('back')}
        </Link>
      </div>

      {pathQuery.isError ? (
        <div className="mt-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
          <div className="text-sm font-semibold text-foreground">{t('title')}</div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">{c('empty')}</p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
            onClick={() => {
              toast({ title: c('loading'), description: c('loading') })
              pathQuery.refetch().catch(() => {})
            }}
          >
            {c('retry')}
          </button>
        </div>
      ) : null}

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm lg:col-span-1">
          <div className="text-sm font-bold text-foreground">{t('salary_range')}</div>
          <div className="mt-2 text-sm text-[color:var(--muted)]">
            {pathQuery.data?.salaryMin ?? '-'} - {pathQuery.data?.salaryMax ?? '-'} {t('monthly')}
          </div>

          <div className="mt-6 text-sm font-bold text-foreground">{t('skills_required')}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(asArrayOfStrings(pathQuery.data?.skills) || []).slice(0, 10).map((s) => (
              <span key={s} className="rounded-full bg-[color:var(--surface-2)] px-2 py-1 text-xs text-foreground">
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-lg font-extrabold text-foreground">{t('recommended_courses')}</h2>
          </div>

          {coursesQuery.isLoading ? (
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Skeleton className="h-56 w-full rounded-2xl" />
              <Skeleton className="h-56 w-full rounded-2xl" />
            </div>
          ) : coursesQuery.isError ? (
            <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
              <p className="text-sm text-[color:var(--muted)]">{c('empty')}</p>
              <button
                type="button"
                className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
                onClick={() => {
                  toast({ title: c('loading'), description: c('loading') })
                  coursesQuery.refetch().catch(() => {})
                }}
              >
                {c('retry')}
              </button>
            </div>
          ) : coursesQuery.data?.length ? (
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {coursesQuery.data.map((course) => (
                <CourseCard key={course.id} course={course} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
              {c('empty')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

