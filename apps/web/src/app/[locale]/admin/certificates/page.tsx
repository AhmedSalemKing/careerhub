'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { AdminShell } from '../../../components/AdminShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../../lib/toast'
import { Award, ExternalLink } from 'lucide-react'

type AdminCert = {
  id: string
  serialNumber: string
  issuedAt: string
  certificateUrl: string
  user?: { profile?: { firstName?: string; lastName?: string } | null; email?: string } | null
  course?: { titleAr?: string | null; titleEn?: string | null } | null
}

export default function AdminCertificatesPage() {
  const t = useTranslations('adminCertificatesPage')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()

  const q = useQuery({
    queryKey: ['admin-certificates'],
    queryFn: async () => {
      const raw = (await get<ApiEnvelope<unknown>>('/certificates/admin/all')).data
      return unwrapData(raw) as any
    },
  })

  const data = (q.data ?? null) as any
  const items: AdminCert[] =
    data?.items ?? data?.certificates ?? data?.data?.items ?? data?.data?.certificates ?? (Array.isArray(data) ? data : [])

  const studentName = (cert: AdminCert) => {
    const p = cert.user?.profile
    if (p?.firstName || p?.lastName) return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()
    return cert.user?.email ?? '-'
  }

  const courseTitle = (cert: AdminCert) =>
    cert.course?.titleAr ?? cert.course?.titleEn ?? '-'

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <AuthGate>
      <AdminShell title={t('title')} subtitle={t('subtitle')}>
        {q.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 rounded-2xl" />
            ))}
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
          <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)]">
            <table className="w-full text-sm">
              <thead className="bg-[color:var(--surface-2)] text-[color:var(--muted)]">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold">{t('th_serial')}</th>
                  <th className="px-4 py-3 text-right font-semibold">المستخدم</th>
                  <th className="px-4 py-3 text-right font-semibold">الكورس</th>
                  <th className="px-4 py-3 text-right font-semibold">{t('th_issued')}</th>
                  <th className="px-4 py-3 text-right font-semibold">عرض</th>
                </tr>
              </thead>
              <tbody>
                {items.map((cert) => (
                  <tr key={cert.id} className="border-t border-[color:var(--border)] hover:bg-[color:var(--surface-2)] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{cert.serialNumber}</td>
                    <td className="px-4 py-3 text-[color:var(--muted)]">{studentName(cert)}</td>
                    <td className="px-4 py-3 text-[color:var(--muted)]">{courseTitle(cert)}</td>
                    <td className="px-4 py-3 text-[color:var(--muted)]">
                      {cert.issuedAt ? formatDate(cert.issuedAt) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {cert.certificateUrl ? (
                        <a
                          href={cert.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Award size={12} />
                          عرض
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-[color:var(--muted)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 text-xs text-[color:var(--muted)] border-t border-[color:var(--border)]">
              إجمالي: {items.length} شهادة
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            {c('empty')}
          </div>
        )}
      </AdminShell>
    </AuthGate>
  )
}
