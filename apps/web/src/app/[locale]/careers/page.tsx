'use client'

import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { get } from '../../../lib/api'
import { useToast } from '../../../lib/toast'

type CareerPath = { id: string; slug: string; title: string; description?: string; color?: string | null; skills?: string[] }

export default function CareersPage() {
  const t = useTranslations('careers')
  const common = useTranslations('common')
  const { toast } = useToast()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['career', 'paths'],
    queryFn: async () => {
      const res = await get<unknown>('/career/paths')
      const payload: unknown = res.data
      const obj = payload && typeof payload === 'object' && !Array.isArray(payload) ? (payload as Record<string, unknown>) : null
      const items = obj && obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : null
      const paths = items && Array.isArray(items.careerPaths) ? (items.careerPaths as CareerPath[]) : []
      return paths
    },
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t('title')}</h1>
      </div>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]" />
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

