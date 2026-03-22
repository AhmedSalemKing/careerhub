'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { get } from '../../../lib/api'
import { useToast } from '../../../lib/toast'
import { unwrapList } from '../../../lib/unwrap'

type CareerPath = { id: string; slug: string; title: string; description?: string; color?: string | null; skills?: string[] }

export default function CareersPage() {
  const t = useTranslations('careers')
  const common = useTranslations('common')
  const { toast } = useToast()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['career', 'paths'],
    queryFn: async () => {
      const res = await get<unknown>('/career/paths')
      return unwrapList<CareerPath>(res, 'careerPaths')
    },
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t('title')}</h1>
      </div>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-3/4 rounded-lg bg-[color:var(--surface-2)]" />
                  <div className="h-3 w-full rounded-lg bg-[color:var(--surface-2)]" />
                  <div className="h-3 w-5/6 rounded-lg bg-[color:var(--surface-2)]" />
                </div>
                <div className="h-10 w-10 shrink-0 rounded-xl bg-[color:var(--surface-2)]" />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <div className="h-6 w-16 rounded-full bg-[color:var(--surface-2)]" />
                <div className="h-6 w-20 rounded-full bg-[color:var(--surface-2)]" />
                <div className="h-6 w-14 rounded-full bg-[color:var(--surface-2)]" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="mt-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
          <div className="text-sm font-semibold">{common('network_error')}</div>
          <button
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
            <Link
              key={p.id}
              href={`/careers/${p.slug}`}
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold">{p.title}</div>
                  {p.description ? <p className="mt-1 line-clamp-2 text-sm text-[color:var(--muted)]">{p.description}</p> : null}
                </div>
                <div className="h-10 w-10 rounded-xl" style={{ background: p.color || 'rgba(37,99,235,0.12)' }} />
              </div>
              {p.skills?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.skills.slice(0, 4).map((s) => (
                    <span key={s} className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1 text-xs font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-5 text-sm font-semibold text-primary">{t('explore')} ←</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

