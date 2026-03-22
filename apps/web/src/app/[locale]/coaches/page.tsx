'use client'

import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../lib/api'
import { CoachCard } from '../../components/CoachCard'

type Coach = {
  id: string
  user?: {
    id: string
    firstName?: string | null
    lastName?: string | null
    avatar?: string | null
  }
  bio?: string | null
  specialties?: string[] | null
  rating?: number | null
  hourlyRate?: number | null
  available?: boolean | null
}

export default function CoachesPage() {
  const locale = useLocale()
  const ar = locale === 'ar'

  const { data: coaches, isLoading, isError } = useQuery<Coach[]>({
    queryKey: ['coaches'],
    queryFn: async () => {
      const res = await get('/coaching/coaches')
      const inner = (res as any)?.data?.data ?? (res as any)?.data
      return Array.isArray(inner) ? inner : (inner?.coaches ?? [])
    },
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-[color:var(--surface-2)] mb-8" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-[color:var(--surface-2)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded-lg bg-[color:var(--surface-2)]" />
                  <div className="h-3 w-1/3 rounded-lg bg-[color:var(--surface-2)]" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full rounded-lg bg-[color:var(--surface-2)]" />
                <div className="h-3 w-5/6 rounded-lg bg-[color:var(--surface-2)]" />
              </div>
              <div className="mt-6 flex gap-2">
                <div className="h-6 w-16 rounded-full bg-[color:var(--surface-2)]" />
                <div className="h-6 w-16 rounded-full bg-[color:var(--surface-2)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 text-center">
        <p className="text-red-500">{ar ? 'حدث خطأ أثناء تحميل المدربين.' : 'An error occurred while loading coaches.'}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-extrabold text-gray-900 dark:text-white">
        {ar ? 'المدربون المتاحون' : 'Available Coaches'}
      </h1>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {coaches?.map((coach) => (
          <CoachCard key={coach.id} coach={coach as any} />
        ))}
      </div>
    </div>
  )
}
