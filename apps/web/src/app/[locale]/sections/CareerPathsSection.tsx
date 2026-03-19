'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { get } from '../../../lib/api'
import { useToast } from '../../../lib/toast'

type CareerPath = {
  id: string
  slug: string
  title: string
  description?: string
  skills?: string[]
  salaryRange?: unknown
  jobTitles?: string[]
  demandLevel?: string
  icon?: string | null
  color?: string | null
  stats?: { totalCourses?: number; totalAssessments?: number; popularCourses?: unknown[] }
}

export function CareerPathsSection() {
  const t = useTranslations('careers')
  const common = useTranslations('common')
  const { toast } = useToast()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['careerPaths'],
    queryFn: async () => {
      const res = await get<unknown>('/career/paths')
      const payload: unknown = res.data
      const maybeObj = payload && typeof payload === 'object' && !Array.isArray(payload) ? (payload as Record<string, unknown>) : null
      const items = (maybeObj && Array.isArray(maybeObj.data) ? maybeObj.data : payload) as unknown
      return Array.isArray(items) ? (items as CareerPath[]) : []
    },
  })

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{t('title')}</h2>
      </div>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
          <div className="text-sm font-semibold text-foreground">{t('title')}</div>
          <div className="mt-2 text-sm text-[color:var(--muted)]">{common('network_error')}</div>
          <button
            type="button"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
            onClick={async () => {
              const r = await refetch()
              if (r.error) toast({ variant: 'danger', description: common('network_error') })
            }}
          >
            {common('confirm')}
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold text-foreground">{p.title}</div>
                  {p.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-[color:var(--muted)]">{p.description}</p>
                  ) : null}
                </div>
                <div
                  className="h-10 w-10 shrink-0 rounded-xl"
                  style={{ background: p.color || 'rgba(37,99,235,0.12)' }}
                />
              </div>

              {Array.isArray(p.skills) && p.skills.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.skills.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1 text-xs font-semibold text-foreground"
                    >
                      {s}
                    </span>
                  ))}
                  {p.skills.length > 4 ? (
                    <span className="px-2 py-1 text-xs font-semibold text-[color:var(--muted)]">
                      +{p.skills.length - 4}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-5 flex items-center justify-between gap-3">
                <Link
                  href={`/careers/${p.slug}`}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-[color:var(--primary)]/90"
                >
                  {t('explore')}
                </Link>
                <div className="text-xs font-semibold text-[color:var(--muted)]">
                  {p.stats?.totalCourses ? `${p.stats.totalCourses} ${common('view')}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

