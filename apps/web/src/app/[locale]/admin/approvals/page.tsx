'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post } from '../../../../lib/api'
import { notify } from '../../../../lib/notify'
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export default function ApprovalsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'verification'>('users')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

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
    mutationFn: (userId: string) => post(`/admin/approve/${userId}`),
    onSuccess: (_, userId) => {
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
    mutationFn: (courseId: string) => post(`/admin/courses/${courseId}/approve`, {}),
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

  const isLoading = activeTab === 'users' ? usersLoading : coursesLoading

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
        <h1 className="font-madinet text-2xl font-bold text-foreground">{isAr ? 'طلبات الموافقة' : 'Approval Requests'}</h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          {isAr ? 'مراجعة طلبات انضمام المحاضرين والمستشارين، وكورسات تنتظر المراجعة' : 'Review instructor and consultant applications, and courses pending review'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'users'
              ? 'bg-primary text-white'
              : 'border border-[color:var(--border)] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]'
          }`}
        >
          {isAr ? 'المحاضرون والمستشارون' : 'Instructors & Consultants'}
          {users.length > 0 && (
            <span className="mr-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {users.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
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
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
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
              <h3 className="font-madinet text-xl font-bold text-foreground">{isAr ? 'لا توجد طلبات معلقة' : 'No pending requests'}</h3>
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
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold text-lg">
                      {u.profile?.firstName?.[0] || u.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">
                        {u.profile?.firstName} {u.profile?.lastName}
                      </h3>
                      <p className="text-sm text-[color:var(--muted)]">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.accountType === 'INSTRUCTOR'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {u.accountType === 'INSTRUCTOR' ? (isAr ? 'محاضر' : 'Instructor') : (isAr ? 'مستشار' : 'Consultant')}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[color:var(--muted)]">
                          <Clock className="h-3 w-3" />
                          {new Date(u.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
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
                          <p className="text-sm font-medium text-foreground">{u.hourlyRate} {isAr ? 'ر.س' : 'SAR'}</p>
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
                        className="flex items-center gap-1 rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs text-blue-400 hover:bg-[color:var(--surface-2)] transition"
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
                          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition"
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
                          onClick={() => approveUser.mutate(u.id)}
                          disabled={approveUser.isPending}
                          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition"
                        >
                          <Check className="h-4 w-4" />
                          {approveUser.isPending ? (isAr ? 'جاري القبول...' : 'Approving...') : (isAr ? 'قبول' : 'Approve')}
                        </button>
                        <button
                          onClick={() => setRejectingId(u.id)}
                          className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition"
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

      {/* ── Courses tab ────────────────────────────────────────── */}
      {activeTab === 'courses' && (
        <>
          {pendingCourses.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
                <BookOpen className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="font-madinet text-xl font-bold text-foreground">
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
                      <h3 className="text-lg font-bold text-foreground">{course.titleEn}</h3>
                      {course.titleAr && (
                        <p className="text-sm text-[color:var(--muted)]">{course.titleAr}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-[color:var(--muted)]">
                        <span>
                          {isAr ? 'المحاضر:' : 'Instructor:'} {course.instructor?.profile?.firstName}{' '}
                          {course.instructor?.profile?.lastName}
                        </span>
                        <span>{isAr ? 'السعر:' : 'Price:'} {course.price} {isAr ? 'ريال' : 'SAR'}</span>
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
                    {isAr ? 'تاريخ الطلب:' : 'Request date:'} {new Date(course.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => approveCourse.mutate(course.id)}
                      disabled={approveCourse.isPending}
                      className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60 transition"
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
                      className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-60 transition"
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
              <h3 className="font-madinet text-xl font-bold text-foreground">{isAr ? 'لا توجد طلبات توثيق' : 'No verification requests'}</h3>
            </div>
          ) : (
            <div className="grid gap-4">
              {(pendingVerifications as any[]).map((v) => (
                <div
                  key={v.id}
                  className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-600 text-white font-bold text-lg">
                      {v.profile?.firstName?.[0] || v.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">
                        {v.profile?.firstName} {v.profile?.lastName}
                      </h3>
                      <p className="text-sm text-[color:var(--muted)]">{v.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                          {v.accountType === 'INSTRUCTOR' ? (isAr ? 'محاضر' : 'Instructor') : (isAr ? 'مستشار' : 'Consultant')}
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
                      className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60 transition"
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
                      className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-60 transition"
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
    </div>
  )
}
