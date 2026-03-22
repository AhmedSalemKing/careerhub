'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { DashboardShell } from '../../../components/DashboardShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../../lib/toast'
import { CertificateView, type CertificateModel } from '../../../components/CertificateView'

type CertificatesList = { items?: CertificateModel[] } | { certificates?: CertificateModel[] }

export default function DashboardCertificatesPage() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('certificates')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()

  const q = useQuery({
    queryKey: ['my-certificates'],
    queryFn: async () => {
      const raw = (await get<ApiEnvelope<unknown>>('/api/certificates/my-certificates')).data
      return unwrapData(raw) as any
    },
  })

  const list = (q.data as CertificatesList) || {}
  const items: CertificateModel[] = (list as any).items || (list as any).certificates || (q.data?.data?.items as any) || []

  const download = async (serialNumber: string) => {
    try {
      const raw = (await get<ApiEnvelope<{ downloadUrl: string }>>(`/api/certificates/${encodeURIComponent(serialNumber)}/download`)).data
      const data = unwrapData(raw) as any
      const url = data?.downloadUrl || data?.data?.downloadUrl
      if (url) window.open(String(url), '_blank', 'noopener,noreferrer')
      else toast({ variant: 'danger', title: t('title'), description: e('something_wrong') })
    } catch {
      toast({ variant: 'danger', title: t('title'), description: e('something_wrong') })
    }
  }

  return (
    <AuthGate>
      <DashboardShell title={t('title')} subtitle={t('verify')}>
        {q.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
        ) : q.isError ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <div className="text-sm text-[color:var(--muted)]">{e('something_wrong')}</div>
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
        ) : items.length ? (
          <div className="space-y-4">
            {items.map((cert) => (
              <CertificateView key={cert.serialNumber} certificate={cert} onDownload={() => void download(cert.serialNumber)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            {t('empty')}
          </div>
        )}
      </DashboardShell>
    </AuthGate>
  )
}

