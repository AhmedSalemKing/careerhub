'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post, patch } from '../../../../lib/api'
import { notify } from '../../../../lib/notify'
import { formatCoursePrice, formatMoney } from '../../../../lib/market'
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Check,
  X,
  BookOpen,
  Download,
} from 'lucide-react'
import VerifiedBadge from '../../../../components/VerifiedBadge'
import { formatDate } from '@/lib/format-date'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export default function ApprovalsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'users' | 'coaches' | 'courses' | 'verification'>('users')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [priceModal, setPriceModal] = useState<{
    id: string
    type: 'consultant' | 'course'
    name: string
    currentPrice: number
    currency: 'SAR' | 'EGP' | 'USD'
  } | null>(null)
  const [newPrice, setNewPrice] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)
  const priceValid = newPrice !== '' && Number(newPrice) > 0
  const currencyLabel = (c: 'SAR' | 'EGP' | 'USD') => (c === 'SAR' ? 'ر.س' : c === 'EGP' ? 'ج.م' : '$')

  const openPriceModal = (m: NonNullable<typeof priceModal>) => {
    setPriceModal(m)
    setNewPrice(m.currentPrice ? String(m.currentPrice) : '')
  }

  const handleSavePrice = async () => {
    if (!priceModal || !priceValid) return
    setSavingPrice(true)
    try {
      const price = Number(newPrice)
      if (priceModal.type === 'consultant') {
        await patch(`/admin/users/${priceModal.id}/hourly-rate`, { hourlyRate: price })
        qc.invalidateQueries({ queryKey: ['pending-approvals'] })
      } else {
        await patch(`/admin/courses/${priceModal.id}/price`, { priceUSD: price })
        qc.invalidateQueries({ queryKey: ['pending-courses'] })
      }
      notify.success(isAr ? 'تم تحديث السعر وإشعار المعني' : 'Price updated and the owner notified')
      setPriceModal(null)
      setNewPrice('')
    } catch {
      notify.error(isAr ? 'فشل تحديث السعر' : 'Failed to update the price')
    } finally {
      setSavingPrice(false)
    }
  }

  // ── Pending users ──────────────────────────────────────────────
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const res = await get('/admin/pending-approvals')
      const d = (res as any)?.data?.data ?? []
      return Array.isArray(d) ? d : []
    },
  })

  const approveUser = useMutation({
    mutationFn: ({ userId, hourlyRate }: { userId: string; hourlyRate?: number }) =>
      post(`/admin/approve/${userId}`, { hourlyRate }),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ['pending-approvals'] })
      const user = users.find((u: any) => u.id === userId)
      notify.success(isAr ? `تم قبول ${user?.profile?.firstName || user?.email || 'المستخدم'}` : `Approved ${user?.profile?.firstName || user?.email || 'user'}`)
    },
    onError: () => notify.error(isAr ? 'فشل قبول الطلب' : 'Failed to approve request'),
  })

  const rejectUser = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      post(`/admin/reject/${id}`, { reason }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['pending-approvals'] })
      const user = users.find((u: any) => u.id === id)
      notify.info(isAr ? `تم رفض ${user?.profile?.firstName || user?.email || 'المستخدم'}` : `Rejected ${user?.profile?.firstName || user?.email || 'user'}`)
      setRejectingId(null)
      setRejectReason('')
    },
    onError: () => notify.error(isAr ? 'فشل رفض الطلب' : 'Failed to reject request'),
  })

  // ── Pending verification ─────────────────────────────────────
  const { data: pendingVerifications = [], isLoading: verLoading } = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: async () => {
      const res = await get('/verification/pending')
      const d = (res as any)?.data?.data ?? (res as any)?.data ?? []
      return Array.isArray(d) ? d : []
    },
  })

  const approveVerification = useMutation({
    mutationFn: (userId: string) => post(`/verification/approve/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-verifications'] })
      notify.success(isAr ? 'تم توثيق الهوية' : 'Identity verified')
    },
    onError: () => notify.error(isAr ? 'فشل التوثيق' : 'Verification failed'),
  })

  const rejectVerification = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      post(`/verification/reject/${id}`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-verifications'] })
      notify.info(isAr ? 'تم رفض طلب التوثيق' : 'Verification rejected')
    },
    onError: () => notify.error(isAr ? 'فشل الرفض' : 'Failed to reject'),
  })

  // ── Pending courses ────────────────────────────────────────────
  const { data: pendingCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['pending-courses'],
    queryFn: async () => {
      const res = await get('/admin/pending-courses')
      const d = (res as any)?.data?.data ?? []
      return Array.isArray(d) ? d : []
    },
  })

  const approveCourse = useMutation({
    mutationFn: ({ courseId, priceUSD, priceEGP }: { courseId: string; priceUSD?: number; priceEGP?: number }) =>
      post(`/admin/courses/${courseId}/approve`, { priceUSD, priceEGP }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-courses'] })
      notify.success(isAr ? 'تم الموافقة على الكورس ونشره' : 'Course approved and published')
    },
    onError: () => notify.error(isAr ? 'فشل الموافقة على الكورس' : 'Failed to approve course'),
  })

  const rejectCourse = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      post(`/admin/courses/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-courses'] })
      notify.info(isAr ? 'تم رفض الكورس' : 'Course rejected')
    },
    onError: () => notify.error(isAr ? 'فشل رفض الكورس' : 'Failed to reject course'),
  })

  const coaches = (users as any[]).filter((u) => u.accountType === 'CONSULTANT')
  const COUNTRY_LABELS: Record<string, string> = { SA: 'السعودية', EG: 'مصر' }
  // The coaching form folds the coaching languages and free-text notes into `bio`.
  const parseCoachBio = (bio?: string | null) => {
    const lines = (bio || '').split('\n')
    const langLine = lines.find((l) => l.startsWith('لغات الإرشاد: '))
    return {
      languages: langLine ? langLine.replace('لغات الإرشاد: ', '') : '',
      notes: lines.filter((l) => l !== langLine).join('\n').trim(),
    }
  }

  const isLoading = activeTab === 'users' || activeTab === 'coaches' ? usersLoading : coursesLoading

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-6">
      <div>
        <h1 className="font-madinet text-2xl font-black text-foreground">{isAr ? 'طلبات الموافقة' : 'Approval Requests'}</h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          {isAr ? 'مراجعة طلبات انضمام المحاضرين والمرشدين، وكورسات تنتظر المراجعة' : 'Review instructor and mentor applications, and courses pending review'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            activeTab === 'users'
              ? 'bg-primary text-white'
              : 'border border-[color:var(--border)] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]'
          }`}
        >
          {isAr ? 'المحاضرون والمرشدون' : 'Instructors & Mentors'}
          {users.length > 0 && (
            <span className="mr-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {users.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('coaches')}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            activeTab === 'coaches'
              ? 'bg-primary text-white'
              : 'border border-[color:var(--border)] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]'
          }`}
        >
          {isAr ? 'المرشدون' : 'Coaches'}
          {coaches.length > 0 && (
            <span className="mr-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {coaches.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            activeTab === 'courses'
              ? 'bg-amber-600 text-white'
              : 'border border-[color:var(--border)] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]'
          }`}
        >
          {isAr ? 'كورسات تنتظر المراجعة' : 'Courses Pending Review'}
          {pendingCourses.length > 0 && (
            <span className="mr-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {pendingCourses.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            activeTab === 'verification'
              ? 'bg-green-600 text-white'
              : 'border border-[color:var(--border)] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]'
          }`}
        >
          {isAr ? 'توثيق الهوية' : 'ID Verification'}
          {pendingVerifications.length > 0 && (
            <span className="mr-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {pendingVerifications.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Users tab ──────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <>
          {users.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-madinet text-xl font-medium text-foreground">{isAr ? 'لا توجد طلبات معلقة' : 'No pending requests'}</h3>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{isAr ? 'جميع الطلبات تمت مراجعتها' : 'All requests have been reviewed'}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {(users as any[]).map((u) => (
                <div
                  key={u.id}
                  className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white font-medium text-lg">
                      {u.profile?.firstName?.[0] || u.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        {u.profile?.firstName} {u.profile?.lastName}
                      </h3>
                      <p className="text-sm text-[color:var(--muted)]">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.accountType === 'INSTRUCTOR'
                            ? 'bg-[#5120c8]/20 text-foreground'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {u.accountType === 'INSTRUCTOR' ? (isAr ? 'محاضر' : 'Instructor') : (isAr ? 'مرشد' : 'Mentor')}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[color:var(--muted)]">
                          <Clock className="h-3 w-3" />
                          {formatDate(u.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(u.speciality || u.experience !== undefined || u.hourlyRate || u.meetingMethod) && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                      {u.speciality && (
                        <div className="rounded-xl bg-[color:var(--surface-2)] p-3">
                          <p className="text-xs text-[color:var(--muted)] mb-1">{isAr ? 'مجال التخصص' : 'Specialization'}</p>
                          <p className="text-sm font-medium text-foreground">{u.speciality}</p>
                        </div>
                      )}
                      {u.experience !== undefined && (
                        <div className="rounded-xl bg-[color:var(--surface-2)] p-3">
                          <p className="text-xs text-[color:var(--muted)] mb-1">{isAr ? 'سنوات الخبرة' : 'Years of Experience'}</p>
                          <p className="text-sm font-medium text-foreground">{u.experience} {isAr ? 'سنة' : 'years'}</p>
                        </div>
                      )}
                      {u.hourlyRate && (
                        <div className="rounded-xl bg-[color:var(--surface-2)] p-3">
                          <p className="text-xs text-[color:var(--muted)] mb-1">{isAr ? 'السعر بالساعة' : 'Hourly Rate'}</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{formatMoney(u.hourlyRate, u.hourlyRateDisplay)}</p>
                            <button
                            onClick={() => openPriceModal({ id: u.id, type: 'consultant', name: `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || u.email, currentPrice: u.hourlyRate || 0, currency: 'SAR' })}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '3px 10px', borderRadius: 6,
                              border: '1px solid var(--border)',
                              background: 'transparent',
                              color: 'var(--muted-foreground)',
                              fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            {isAr ? 'تعديل' : 'Edit'}
                          </button>
                          </div>
                        </div>
                      )}
                      {u.meetingMethod && (
                        <div className="rounded-xl bg-[color:var(--surface-2)] p-3">
                          <p className="text-xs text-[color:var(--muted)] mb-1">{isAr ? 'طريقة الاجتماع' : 'Meeting Method'}</p>
                          <p className="text-sm font-medium text-foreground">{u.meetingMethod}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {u.bio && (
                    <div className="rounded-xl bg-[color:var(--surface-2)] p-3 mb-4">
                      <p className="text-xs text-[color:var(--muted)] mb-1">{isAr ? 'نبذة مهنية' : 'Professional Bio'}</p>
                      <p className="text-sm text-foreground line-clamp-2">{u.bio}</p>
                    </div>
                  )}

                  <div className="flex gap-3 mb-4">
                    {u.cvUrl && u.cvUrl.startsWith('http') && (
                      <>
                        <a
                          href={`https://docs.google.com/viewer?url=${encodeURIComponent(u.cvUrl)}&embedded=false`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm hover:bg-[color:var(--surface-2)] transition text-foreground"
                        >
                          <Eye className="h-4 w-4" />
                          {isAr ? 'عرض السيرة الذاتية' : 'View CV'}
                        </a>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(u.cvUrl)
                              const blob = await res.blob()
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              const name = `${u.profile?.firstName || ''}-${u.profile?.lastName || ''}`.replace(/\s+/g, '-')
                              a.download = `CV-${name}.pdf`
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                              URL.revokeObjectURL(url)
                            } catch {
                              window.open(u.cvUrl, '_blank')
                            }
                          }}
                          className="flex items-center gap-1 rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm hover:bg-[color:var(--surface-2)] transition text-foreground cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                          {isAr ? 'تحميل PDF' : 'Download PDF'}
                        </button>
                      </>
                    )}
                    {u.cvUrl && !u.cvUrl.startsWith('http') && (
                      <span className="flex items-center gap-1 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm text-orange-400">
                        {isAr ? 'السيرة الذاتية غير متاحة (قديمة)' : 'CV unavailable (old upload)'}
                      </span>
                    )}
                    {u.linkedinUrl && (
                      <a
                        href={u.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs text-foreground hover:bg-[color:var(--surface-2)] transition"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>

                  {rejectingId === u.id && (
                    <div className="mb-4">
                      <textarea
                        placeholder={isAr ? 'سبب الرفض (اختياري)...' : 'Rejection reason (optional)...'}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3 text-sm text-foreground focus:border-primary focus:outline-none resize-none"
                        rows={2}
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    {rejectingId === u.id ? (
                      <>
                        <button
                          onClick={() => rejectUser.mutate({ id: u.id, reason: rejectReason || undefined })}
                          disabled={rejectUser.isPending}
                          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition"
                        >
                          <X className="h-4 w-4" />
                          {isAr ? 'تأكيد الرفض' : 'Confirm Rejection'}
                        </button>
                        <button
                          onClick={() => { setRejectingId(null); setRejectReason('') }}
                          className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm text-foreground hover:bg-[color:var(--surface-2)] transition"
                        >
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => approveUser.mutate({ userId: u.id })}
                          disabled={approveUser.isPending}
                          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition"
                        >
                          <Check className="h-4 w-4" />
                          {approveUser.isPending ? (isAr ? 'جاري القبول...' : 'Approving...') : (isAr ? 'قبول' : 'Approve')}
                        </button>
                        <button
                          onClick={() => setRejectingId(u.id)}
                          className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition"
                        >
                          <XCircle className="h-4 w-4" />
                          {isAr ? 'رفض' : 'Reject'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Coaches tab ────────────────────────────────────────── */}
      {activeTab === 'coaches' && (
        <>
          {coaches.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-madinet text-xl font-medium text-foreground">{isAr ? 'لا توجد طلبات معلقة' : 'No pending requests'}</h3>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{isAr ? 'جميع الطلبات تمت مراجعتها' : 'All requests have been reviewed'}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {coaches.map((u) => {
                const { languages, notes } = parseCoachBio(u.bio)
                const country = u.profile?.country ? COUNTRY_LABELS[u.profile.country] || u.profile.country : ''
                return (
                  <div key={u.id} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white font-medium text-lg">
                        {u.profile?.firstName?.[0] || u.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{u.profile?.firstName} {u.profile?.lastName}</h3>
                        <p className="text-sm text-[color:var(--muted)]">{u.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
                            {isAr ? 'مرشد' : 'Coach'}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-[color:var(--muted)]">
                            <Clock className="h-3 w-3" />
                            {formatDate(u.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                      {country && (
                        <div className="rounded-xl bg-[color:var(--surface-2)] p-3">
                          <p className="text-xs text-[color:var(--muted)] mb-1">{isAr ? 'الدولة' : 'Country'}</p>
                          <p className="text-sm font-medium text-foreground">{country}</p>
                        </div>
                      )}
                      {u.speciality && (
                        <div className="rounded-xl bg-[color:var(--surface-2)] p-3">
                          <p className="text-xs text-[color:var(--muted)] mb-1">{isAr ? 'المجال' : 'Field'}</p>
                          <p className="text-sm font-medium text-foreground">{u.speciality}</p>
                        </div>
                      )}
                      {u.experience != null && (
                        <div className="rounded-xl bg-[color:var(--surface-2)] p-3">
                          <p className="text-xs text-[color:var(--muted)] mb-1">{isAr ? 'سنوات الخبرة' : 'Years of Experience'}</p>
                          <p className="text-sm font-medium text-foreground">{u.experience} {isAr ? 'سنة' : 'years'}</p>
                        </div>
                      )}
                      {languages && (
                        <div className="rounded-xl bg-[color:var(--surface-2)] p-3">
                          <p className="text-xs text-[color:var(--muted)] mb-1">{isAr ? 'لغات الإرشاد' : 'Coaching Languages'}</p>
                          <p className="text-sm font-medium text-foreground">{languages}</p>
                        </div>
                      )}
                    </div>

                    {notes && (
                      <div className="rounded-xl bg-[color:var(--surface-2)] p-3 mb-4">
                        <p className="text-xs text-[color:var(--muted)] mb-1">{isAr ? 'ملاحظات' : 'Notes'}</p>
                        <p className="text-sm text-foreground whitespace-pre-line">{notes}</p>
                      </div>
                    )}

                    <div className="flex gap-3 mb-4">
                      {u.cvUrl && u.cvUrl.startsWith('http') ? (
                        <>
                          <a
                            href={u.cvUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm hover:bg-[color:var(--surface-2)] transition text-foreground"
                          >
                            <Eye className="h-4 w-4" />
                            {isAr ? 'عرض السيرة الذاتية' : 'View CV'}
                          </a>
                          <a
                            href={u.cvUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm hover:bg-[color:var(--surface-2)] transition text-foreground"
                          >
                            <Download className="h-4 w-4" />
                            {isAr ? 'تحميل' : 'Download'}
                          </a>
                        </>
                      ) : (
                        <span className="flex items-center gap-1 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm text-orange-400">
                          {isAr ? 'السيرة الذاتية غير متاحة' : 'CV unavailable'}
                        </span>
                      )}
                    </div>

                    {rejectingId === u.id && (
                      <div className="mb-4">
                        <textarea
                          placeholder={isAr ? 'سبب الرفض (اختياري)...' : 'Rejection reason (optional)...'}
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3 text-sm text-foreground focus:border-primary focus:outline-none resize-none"
                          rows={2}
                        />
                      </div>
                    )}

                    <div className="flex gap-3">
                      {rejectingId === u.id ? (
                        <>
                          <button
                            onClick={() => rejectUser.mutate({ id: u.id, reason: rejectReason || undefined })}
                            disabled={rejectUser.isPending}
                            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition"
                          >
                            <X className="h-4 w-4" />
                            {isAr ? 'تأكيد الرفض' : 'Confirm Rejection'}
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setRejectReason('') }}
                            className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm text-foreground hover:bg-[color:var(--surface-2)] transition"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => approveUser.mutate({ userId: u.id })}
                            disabled={approveUser.isPending}
                            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition"
                          >
                            <Check className="h-4 w-4" />
                            {approveUser.isPending ? (isAr ? 'جاري القبول...' : 'Approving...') : (isAr ? 'قبول' : 'Approve')}
                          </button>
                          <button
                            onClick={() => setRejectingId(u.id)}
                            className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition"
                          >
                            <XCircle className="h-4 w-4" />
                            {isAr ? 'رفض' : 'Reject'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Courses tab ────────────────────────────────────────── */}
      {activeTab === 'courses' && (
        <>
          {pendingCourses.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
                <BookOpen className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="font-madinet text-xl font-medium text-foreground">
                {isAr ? 'لا توجد كورسات تنتظر المراجعة' : 'No courses pending review'}
              </h3>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{isAr ? 'جميع الكورسات تمت مراجعتها' : 'All courses have been reviewed'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(pendingCourses as any[]).map((course) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-foreground">{course.titleEn}</h3>
                      {course.titleAr && (
                        <p className="text-sm text-[color:var(--muted)]">{course.titleAr}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-[color:var(--muted)]">
                        <span className="flex items-center gap-1">
                          {isAr ? 'المحاضر:' : 'Instructor:'} {course.instructor?.profile?.firstName}{' '}
                          {course.instructor?.profile?.lastName}
                          {course.instructor?.isVerified && <VerifiedBadge size="xs" showTooltip={false} />}
                        </span>
                        <span className="flex flex-wrap items-center gap-2">
                          <span>
                            {isAr ? 'السعر:' : 'Price:'}{' '}
                            {formatCoursePrice(course)}
                            {(course as any).priceUSD != null && <> &larr; {Number((course as any).priceUSD).toFixed(2)}$</>}
                            {(course as any).priceEGP != null && <> / {Number((course as any).priceEGP).toFixed(0)} {isAr ? 'ج.م' : 'EGP'}</>}
                          </span>
                          <button
                            onClick={() => openPriceModal({ id: course.id, type: 'course', name: course.titleAr || course.titleEn, currentPrice: Number(course.priceUSD) || 0, currency: 'USD' })}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '3px 10px', borderRadius: 6,
                              border: '1px solid var(--border)',
                              background: 'transparent',
                              color: 'var(--muted-foreground)',
                              fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            {isAr ? 'تعديل' : 'Edit'}
                          </button>
                        </span>
                        <span>{isAr ? 'المستوى:' : 'Level:'} {course.level}</span>
                        <span>{isAr ? 'الأقسام:' : 'Sections:'} {course._count?.sections || 0}</span>
                      </div>
                      {course.category && (
                        <span className="mt-2 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
                          {course.category.nameAr}
                        </span>
                      )}
                    </div>
                    {course.thumbnail && (
                      <img
                        src={
                          course.thumbnail.startsWith('http')
                            ? course.thumbnail
                            : `${API_BASE}${course.thumbnail}`
                        }
                        alt={course.titleEn}
                        className="h-20 w-32 rounded-xl object-cover shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    )}
                  </div>

                  {course.description && (
                    <p className="text-sm text-[color:var(--muted)] mb-4 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <p className="text-xs text-[color:var(--muted)] mb-4">
                    {isAr ? 'تاريخ الطلب:' : 'Request date:'} {formatDate(course.createdAt)}
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => approveCourse.mutate({ courseId: course.id })}
                      disabled={approveCourse.isPending}
                      className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 transition"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {approveCourse.isPending ? (isAr ? 'جاري...' : 'Processing...') : (isAr ? 'موافقة ونشر' : 'Approve & Publish')}
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt(isAr ? 'سبب الرفض (اختياري):' : 'Rejection reason (optional):') || undefined
                        rejectCourse.mutate({ id: course.id, reason })
                      }}
                      disabled={rejectCourse.isPending}
                      className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-60 transition"
                    >
                      <XCircle className="h-4 w-4" />
                      {isAr ? 'رفض' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Verification tab ──────────────────────────────────────────── */}
      {activeTab === 'verification' && (
        <>
          {verLoading ? (
            <div className="animate-pulse rounded-2xl bg-[color:var(--surface)] h-32" />
          ) : pendingVerifications.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-madinet text-xl font-medium text-foreground">{isAr ? 'لا توجد طلبات توثيق' : 'No verification requests'}</h3>
            </div>
          ) : (
            <div className="grid gap-4">
              {(pendingVerifications as any[]).map((v) => (
                <div
                  key={v.id}
                  className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-600 text-white font-medium text-lg">
                      {v.profile?.firstName?.[0] || v.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        {v.profile?.firstName} {v.profile?.lastName}
                      </h3>
                      <p className="text-sm text-[color:var(--muted)]">{v.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                          {v.accountType === 'INSTRUCTOR' ? (isAr ? 'محاضر' : 'Instructor') : (isAr ? 'مرشد' : 'Mentor')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-4">
                    {v.idFrontUrl && (
                      <div className="flex-1">
                        <p className="text-xs text-[color:var(--muted)] mb-2">{isAr ? 'وجه البطاقة' : 'ID Front'}</p>
                        <a href={v.idFrontUrl} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={v.idFrontUrl} alt="ID Front" className="h-24 w-auto rounded-lg border border-[color:var(--border)] object-cover" />
                        </a>
                      </div>
                    )}
                    {v.idBackUrl && (
                      <div className="flex-1">
                        <p className="text-xs text-[color:var(--muted)] mb-2">{isAr ? 'ظهر البطاقة' : 'ID Back'}</p>
                        <a href={v.idBackUrl} target="_blank" rel="noopener noreferrer" className="block">
                          <img src={v.idBackUrl} alt="ID Back" className="h-24 w-auto rounded-lg border border-[color:var(--border)] object-cover" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => approveVerification.mutate(v.id)}
                      disabled={approveVerification.isPending}
                      className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 transition"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {approveVerification.isPending ? (isAr ? 'جاري...' : 'Processing...') : (isAr ? 'موافقة' : 'Approve')}
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt(isAr ? 'سبب الرفض:' : 'Rejection reason:') || undefined
                        if (reason !== null) {
                          rejectVerification.mutate({ id: v.id, reason })
                        }
                      }}
                      disabled={rejectVerification.isPending}
                      className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-60 transition"
                    >
                      <XCircle className="h-4 w-4" />
                      {isAr ? 'رفض' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {priceModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setPriceModal(null)}
        >
          <div
            style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 24, width: '100%', maxWidth: 380,
              direction: isAr ? 'rtl' : 'ltr',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 16, color: 'var(--foreground)', marginBottom: 4 }}>
              {isAr ? 'تعديل السعر' : 'Edit price'}
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 20 }}>
              {priceModal.name}
            </div>

            <div
              style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: 'color-mix(in srgb, var(--foreground) 4%, transparent)',
                border: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between',
              }}
            >
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 12, color: 'var(--muted-foreground)' }}>
                {isAr ? 'السعر الحالي' : 'Current price'}
              </span>
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 13, color: 'var(--foreground)' }}>
                {priceModal.currentPrice} {currencyLabel(priceModal.currency)}
              </span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 12,
                  color: 'var(--muted-foreground)', display: 'block', marginBottom: 6,
                }}
              >
                {isAr ? 'السعر الجديد' : 'New price'} ({currencyLabel(priceModal.currency)})
              </label>
              <input
                type="number"
                min={0}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder={isAr ? 'أدخل السعر الجديد' : 'Enter the new price'}
                autoFocus
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--card)',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                padding: '8px 12px', borderRadius: 8, marginBottom: 16,
                background: 'var(--primary-subtle)', border: '1px solid var(--primary-border)',
                display: 'flex', gap: 6, alignItems: 'flex-start',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 11, color: 'var(--foreground)' }}>
                {isAr ? 'سيتم إرسال إشعار للمعني بتحديث السعر' : 'The owner will be notified of the price change'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPriceModal(null)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 13, cursor: 'pointer',
                }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSavePrice}
                disabled={!priceValid || savingPrice}
                style={{
                  flex: 2, padding: '10px 0', borderRadius: 8, border: 'none',
                  background: priceValid ? 'var(--primary)' : 'color-mix(in srgb, var(--foreground) 12%, transparent)',
                  color: priceValid ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 13,
                  cursor: priceValid ? 'pointer' : 'not-allowed',
                  opacity: savingPrice ? 0.7 : 1,
                }}
              >
                {savingPrice ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ السعر' : 'Save price')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
