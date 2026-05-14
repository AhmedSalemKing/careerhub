'use client'

import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { Skeleton } from '../../../components/ui/Skeleton'
import { CheckCircle2, XCircle, ShieldCheck, Calendar, User, BookOpen, Award, ExternalLink, AlertTriangle } from 'lucide-react'

type VerifyCertificate = {
  serialNumber: string
  issuedAt: string
  courseTitle: string
  courseTitleAr?: string | null
  courseTitleEn?: string | null
  userName: string
  studentAvatar?: string | null
  courseThumbnail?: string | null
  instructorName: string
  certificateUrl: string
}

type VerifyResponse = {
  valid: boolean
  certificate?: VerifyCertificate | null
}

export default function VerifyCertificatePage() {
  const { serial } = useParams<{ serial: string }>()
  const t = useTranslations('verify')
  const c = useTranslations('common')
  const locale = useLocale()
  const isAr = locale === 'ar'

  const q = useQuery({
    queryKey: ['verify', serial],
    queryFn: async () => (await get<VerifyResponse>(`/certificates/${encodeURIComponent(serial)}/verify`)).data,
    retry: false,
  })

  const cert = q.data?.certificate
  const isValid = Boolean(q.data?.valid)
  const errorStatus = (q.error as any)?.response?.status
  const isNotFound = errorStatus === 404

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg)] to-[var(--surface)]" dir="auto">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {q.isLoading ? (
          <div className="space-y-6">
            <div className="mx-auto h-8 w-48 rounded-lg bg-[var(--border)]/50" />
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
              <Skeleton className="mx-auto h-16 w-16 rounded-full" />
              <Skeleton className="mx-auto mt-4 h-6 w-40" />
              <Skeleton className="mx-auto mt-2 h-4 w-56" />
              <Skeleton className="mt-6 h-48 w-full rounded-xl" />
              <div className="mt-6 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        ) : q.isError && !isNotFound ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-10 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-foreground">
              {isAr ? '+¬+¦+¦+¦ +º+ä+º+¬+¦+º+ä +¿+º+ä+«+º+»+à' : 'Server Unavailable'}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              {isAr
                ? '+º+ä+¦+ç+º+»+¬ +à+ê+¼+ê+»+¬ +ä+â+å +¬+¦+¦+¦ +º+ä+¬+¡+é+é +à+å+ç+º +º+ä+ó+å. +è+¦+¼+ë +º+ä+à+¡+º+ê+ä+¬ +ä+º+¡+é+º+ï.'
                : 'The certificate exists but verification is temporarily unavailable. Please try again later.'}
            </p>
            <button
              type="button"
              onClick={() => q.refetch()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-2.5 text-sm font-bold text-amber-600 dark:text-amber-400 transition hover:bg-amber-500/20"
            >
              {isAr ? '+Ñ+¦+º+»+¬ +º+ä+à+¡+º+ê+ä+¬' : 'Retry'}
            </button>
          </div>
        ) : q.isError || (!isValid && !q.isLoading) ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-10 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10">
              <XCircle className="h-10 w-10 text-rose-500" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-foreground">
              {isAr ? '+º+ä+¦+ç+º+»+¬ +¦+è+¦ +¦+¡+è+¡+¬ +ú+ê +à+å+¬+ç+è+¬' : 'Invalid or Expired Certificate'}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {isAr
                ? '+ä+à +å+¬+à+â+å +à+å +º+ä+¬+¡+é+é +à+å +ç+¦+ç +º+ä+¦+ç+º+»+¬. +é+» +è+â+ê+å +¦+à+¦ +º+ä+¬+¡+é+é +¦+è+¦ +¦+¡+è+¡ +ú+ê +ú+å +º+ä+¦+ç+º+»+¬ +é+» +º+å+¬+ç+¬ +¦+ä+º+¡+è+¬+ç+º.'
                : 'Could not verify this certificate. The verification code may be incorrect or the certificate has expired.'}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {isAr ? '+¦+à+¦ +º+ä+¬+¡+é+é' : 'Code'}: <span className="font-mono font-semibold text-foreground">{serial}</span>
            </p>
          </div>
        ) : isValid && cert ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                <ShieldCheck className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {isAr ? '+ç+¦+ç +º+ä+¦+ç+º+»+¬ +¦+¡+è+¡+¬' : 'This Certificate is Valid'}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {isAr ? '+¬+à +º+ä+¬+¡+é+é +à+å +¦+¡+¬ +º+ä+¦+ç+º+»+¬ +¿+å+¼+º+¡' : 'Certificate verified successfully'}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              {cert.certificateUrl && (
                <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4">
                  <img
                    src={cert.certificateUrl}
                    alt="Certificate"
                    className="mx-auto w-full max-w-md rounded-lg shadow-2xl ring-1 ring-white/10"
                  />
                  <a
                    href={cert.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-7 right-7 flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    {isAr ? '+¦+¦+¦ +¿+º+ä+¡+¼+à +º+ä+â+º+à+ä' : 'Full Size'} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--border)]">
                    {cert.studentAvatar ? (
                      <img src={cert.studentAvatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-[var(--muted)]" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{cert.userName}</p>
                    <p className="text-xs text-[var(--muted)]">{isAr ? '+¦+º+¡+¿ +º+ä+¦+ç+º+»+¬' : 'Certificate Holder'}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--muted)]">{isAr ? '+º+ä+»+ê+¦+¬ +º+ä+¬+»+¦+è+¿+è+¬' : 'Course'}</p>
                      <p className="text-sm font-bold text-foreground">{cert.courseTitleAr || cert.courseTitle}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Award className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--muted)]">{isAr ? '+º+ä+à+»+¦+¿' : 'Instructor'}</p>
                      <p className="text-sm font-bold text-foreground">{cert.instructorName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--muted)]">{isAr ? '+¬+º+¦+è+« +º+ä+Ñ+¦+»+º+¦' : 'Issue Date'}</p>
                      <p className="text-sm font-bold text-foreground">
                        {new Date(cert.issuedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[var(--muted)]">{isAr ? '+¦+à+¦ +º+ä+¬+¡+é+é' : 'Verification Code'}</p>
                    <div className="flex items-center gap-2" dir="ltr">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="font-mono text-sm font-bold tracking-wider text-foreground">
                        {cert.serialNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {cert.courseThumbnail && (
                  <div className="mt-6">
                    <p className="mb-2 text-xs font-semibold text-[var(--muted)]">{isAr ? '+¦+ê+¦+¬ +º+ä+»+ê+¦+¬' : 'Course Image'}</p>
                    <img
                      src={cert.courseThumbnail}
                      alt={cert.courseTitle}
                      className="w-full rounded-xl object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

