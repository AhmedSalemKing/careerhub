'use client'

import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { useToast } from '../../../../lib/toast'
import { Skeleton } from '../../../components/ui/Skeleton'

type VerifyResponse = {
  valid?: boolean
  certificate?: {
    serialNumber?: string | null
    issuedAt?: string | null
    courseTitle?: string | null
    courseTitleAr?: string | null
    userName?: string | null
  } | null
}

export default function VerifyCertificatePage() {
  const { serial } = useParams<{ serial: string }>()
  const t = useTranslations('verify')
  const c = useTranslations('common')
  const { toast } = useToast()

  const q = useQuery({
    queryKey: ['verify', serial],
    queryFn: async () => (await get<VerifyResponse>(`/certificates/${encodeURIComponent(serial)}/verify`)).data,
  })

  const cert = q.data?.certificate
  const isValid = Boolean(q.data?.valid)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{t('title')}</h1>
      <p className="mt-3 text-sm text-[color:var(--muted)] sm:text-base">{t('subtitle')}</p>

      {q.isLoading ? (
        <div className="mt-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-4 h-5 w-full" />
          <Skeleton className="mt-3 h-5 w-2/3" />
        </div>
      ) : q.isError ? (
        <div className="mt-8 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
          <p className="text-sm text-[color:var(--muted)]">{c('empty')}</p>
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
      ) : isValid ? (
        <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="text-sm font-bold text-foreground">{t('valid')}</div>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-[color:var(--muted)] sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-foreground">{t('serial')}</div>
              <div className="mt-1">{cert?.serialNumber || serial}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-foreground">{t('issued')}</div>
              <div className="mt-1">{cert?.issuedAt || '-'}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs font-semibold text-foreground">{t('course')}</div>
              <div className="mt-1">{cert?.courseTitleAr || cert?.courseTitle || '-'}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs font-semibold text-foreground">{t('owner')}</div>
              <div className="mt-1">{cert?.userName || '-'}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6">
          <div className="text-sm font-bold text-foreground">{t('invalid')}</div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">{t('invalid_hint')}</p>
        </div>
      )}
    </div>
  )
}

