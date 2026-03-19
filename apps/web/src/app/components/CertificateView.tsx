'use client'

import { useTranslations } from 'next-intl'
import { Button } from './ui/Button'

export type CertificateModel = {
  id?: string
  serialNumber: string
  issuedAt?: string | null
  courseTitle?: string | null
  courseTitleAr?: string | null
  userName?: string | null
}

export function CertificateView({
  certificate,
  onDownload,
}: {
  certificate: CertificateModel
  onDownload: () => void
}) {
  const t = useTranslations('certificates')

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold text-foreground">{certificate.courseTitleAr || certificate.courseTitle || '-'}</div>
          <div className="mt-1 text-xs text-[color:var(--muted)]">
            {t('serial')}: {certificate.serialNumber}
          </div>
          <div className="mt-1 text-xs text-[color:var(--muted)]">
            {t('issued')}: {certificate.issuedAt || '-'}
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={onDownload}>
          {t('download')}
        </Button>
      </div>
    </div>
  )
}

