'use client'

import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { useToast } from '../../../../lib/toast'
import { Skeleton } from '../../../components/ui/Skeleton'
import { CheckCircle2, XCircle, ShieldCheck, Calendar, User, BookOpen, Award, ExternalLink } from 'lucide-react'

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
  const { toast } = useToast()

  const q = useQuery({
    queryKey: ['verify', serial],
    queryFn: async () => (await get<VerifyResponse>(`/certificates/${encodeURIComponent(serial)}/verify`)).data,
    retry: false,
  })

  const cert = q.data?.certificate
  const isValid = Boolean(q.data?.valid)

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
        ) : q.isError ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-10 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10">
              <XCircle className="h-10 w-10 text-rose-500" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-foreground">الشهادة غير صحيحة أو منتهية</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              لم نتمكن من التحقق من هذه الشهادة. قد يكون رمز التحقق غير صحيح أو أن الشهادة قد انتهت صلاحيتها.
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              رمز التحقق: <span className="font-mono font-semibold text-foreground">{serial}</span>
            </p>
            <button
              type="button"
              onClick={() => q.refetch()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : isValid && cert ? (
          <div className="space-y-6">
            {/* Green verified banner */}
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-6 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                <ShieldCheck className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">هذه الشهادة صحيحة</p>
                <p className="text-xs text-[var(--muted)]">تم التحقق من صحة الشهادة بنجاح</p>
              </div>
            </div>

            {/* Certificate card */}
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
              {/* Certificate image preview */}
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
                    عرض بالحجم الكامل <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Certificate details */}
              <div className="p-6 sm:p-8">
                {/* Student info */}
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
                    <p className="text-xs text-[var(--muted)]">صاحب الشهادة</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {/* Course title */}
                  <div className="flex items-start gap-3">
                    <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--muted)]">الدورة التدريبية</p>
                      <p className="text-sm font-bold text-foreground">{cert.courseTitleAr || cert.courseTitle}</p>
                    </div>
                  </div>

                  {/* Instructor */}
                  <div className="flex items-start gap-3">
                    <Award className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--muted)]">المدرب</p>
                      <p className="text-sm font-bold text-foreground">{cert.instructorName}</p>
                    </div>
                  </div>

                  {/* Issue date */}
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
                    <div>
                      <p className="text-xs font-semibold text-[var(--muted)]">تاريخ الإصدار</p>
                      <p className="text-sm font-bold text-foreground">
                        {new Date(cert.issuedAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verification code badge */}
                <div className="mt-6 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[var(--muted)]">رمز التحقق</p>
                    <div className="flex items-center gap-2" dir="ltr">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="font-mono text-sm font-bold tracking-wider text-foreground">
                        {cert.serialNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Course thumbnail */}
                {cert.courseThumbnail && (
                  <div className="mt-6">
                    <p className="mb-2 text-xs font-semibold text-[var(--muted)]">صورة الدورة</p>
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
        ) : (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-10 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10">
              <XCircle className="h-10 w-10 text-rose-500" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-foreground">الشهادة غير صحيحة أو منتهية</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              لم نتمكن من التحقق من هذه الشهادة. قد يكون رمز التحقق غير صحيح أو أن الشهادة قد انتهت صلاحيتها.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

