'use client'

import { useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useAuthStore } from '../../stores/authStore'
import { Skeleton } from './ui/Skeleton'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const locale = useLocale() as 'ar' | 'en'
  const c = useTranslations('common')
  const token = useAuthStore((s) => s.token)
  const isLoading = useAuthStore((s) => s.isLoading)
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!isLoading && !token) {
      window.location.href = `/${locale}/login`
    }
  }, [isLoading, token, locale])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
          <div className="text-sm font-semibold text-foreground">{c('loading')}</div>
          <Skeleton className="mt-4 h-5 w-2/3" />
          <Skeleton className="mt-3 h-5 w-1/2" />
        </div>
      </div>
    )
  }

  if (!token) return null

  return <>{children}</>
}

