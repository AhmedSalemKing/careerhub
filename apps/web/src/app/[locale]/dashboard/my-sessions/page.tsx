'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { get, patch, post } from '../../../../lib/api'
import { useAuthStore } from '../../../../stores/authStore'
import { notify } from '../../../../lib/notify'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  Calendar, Clock, Video, Globe, Phone,
  CheckCircle, XCircle, AlertCircle,
  CreditCard, RefreshCw, Wallet,
} from 'lucide-react'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

function getStatusConfig(isAr: boolean) {
  return {
    PENDING:     { label: isAr ? 'معلقة' : 'Pending', color: 'amber', icon: AlertCircle },
    CONFIRMED:   { label: isAr ? 'مؤكدة' : 'Confirmed', color: 'green', icon: CheckCircle },
    RESCHEDULED: { label: isAr ? 'تغيير موعد' : 'Rescheduled', color: 'blue', icon: RefreshCw },
    COMPLETED:   { label: isAr ? 'مكتملة' : 'Completed', color: 'gray', icon: CheckCircle },
    CANCELLED:   { label: isAr ? 'ملغية' : 'Cancelled', color: 'red', icon: XCircle },
    REJECTED:    { label: isAr ? 'مرفوضة' : 'Rejected', color: 'red', icon: XCircle },
  }
}

const colorClass: Record<string, string> = {
  amber: 'bg-amber-500/20 text-amber-400',
  green: 'bg-green-500/20 text-green-400',
  blue:  'bg-blue-500/20 text-blue-400',
  red:   'bg-red-500/20 text-red-400',
  gray:  'bg-gray-500/20 text-gray-400',
}

function SessionPayForm({ sessionId, onSuccess }: { sessionId: string; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    if (!stripe || !elements) return
    setProcessing(true)
    setError('')

    const { error: submitErr } = await elements.submit()
    if (submitErr) { setError(submitErr.message || 'خطأ'); setProcessing(false); return }

    const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
      elements, redirect: 'if_required'
    })

    if (confirmErr) { setError(confirmErr.message || 'فشل الدفع'); setProcessing(false); return }

    if (paymentIntent?.status === 'succeeded') {
      await post(`/sessions/${sessionId}/confirm-payment`, {
        paymentIntentId: paymentIntent.id
      })
      onSuccess()
    }
    setProcessing(false)
  }

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button onClick={handlePay} disabled={!stripe || processing}
        className="w-full rounded-2xl bg-primary py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-60">
        {processing ? 'جاري المعالجة...' : 'ادفع الآن'}
      </button>
      <p className="text-center text-xs text-[color:var(--muted)]">
        بطاقة اختبار: 4242 4242 4242 4242 · 12/29 · 123
      </p>
    </div>
  )
}

export default function MySessionsPage() {
  const { user } = useAuthStore()
  const locale = useLocale()
  const qc = useQueryClient()
  const accountType = user?.accountType
  const isConsultantAccount = accountType === 'CONSULTANT'
  const [activeTab, setActiveTab] = useState('ALL')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [reschedulingId, setReschedulingId] = useState<string | null>(null)
  const [newTime, setNewTime] = useState('')
  const [newDate, setNewDate] = useState('')
  const [payingSession, setPayingSession] = useState<any>(null)
  const [clientSecret, setClientSecret] = useState('')

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['my-sessions', activeTab],
    enabled: !!user,
    queryFn: async () => {
      const params = activeTab !== 'ALL' ? `?status=${activeTab}` : ''
      const res = await get(`/sessions/my-sessions${params}`)
      const d = (res?.data as any)?.data ?? []
      console.log('[MySessions] fetched:', Array.isArray(d) ? d.length : 'not array', 'accountType:', accountType)
      return Array.isArray(d) ? d : []
    },
    refetchInterval: 30000,
  })

  const confirm = useMutation({
    mutationFn: (id: string) => patch(`/sessions/${id}/confirm`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-sessions'] }); notify.success('تم تأكيد الاستشارة') }
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      patch(`/sessions/${id}/reject`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-sessions'] })
      setRejectingId(null)
      setRejectReason('')
      notify.info('تم رفض الاستشارة')
    }
  })

  const reschedule = useMutation({
    mutationFn: ({ id, proposedTime }: { id: string; proposedTime: string }) =>
      patch(`/sessions/${id}/reschedule`, { proposedTime }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-sessions'] })
      setReschedulingId(null)
      notify.info('تم اقتراح الموعد الجديد')
    }
  })

  const acceptReschedule = useMutation({
    mutationFn: (id: string) => patch(`/sessions/${id}/accept-reschedule`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-sessions'] }); notify.success('تم قبول الموعد الجديد') }
  })

  const cancel = useMutation({
    mutationFn: (id: string) => patch(`/sessions/${id}/cancel`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-sessions'] }); notify.info('تم إلغاء الاستشارة') }
  })

  const payWithWallet = useMutation({
    mutationFn: (id: string) => post(`/sessions/${id}/pay-wallet`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-sessions'] }); notify.success('تم الدفع من المحفظة') }
  })

  const completeSession = useMutation({
    mutationFn: (id: string) => patch(`/sessions/${id}/complete`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-sessions'] }); notify.success('تم إكمال الجلسة') }
  })

  const cancelWithRefund = useMutation({
    mutationFn: (id: string) => patch(`/sessions/${id}/cancel-refund`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-sessions'] }); notify.success('تم الإلغاء والاسترداد') }
  })

  const startPayment = async (session: any) => {
    try {
      const res = await post(`/sessions/${session.id}/pay`, {})
      const d = (res?.data as any)?.data

      if (d?.free || d?.sandbox) {
        notify.success('تم الدفع بنجاح')
        qc.invalidateQueries({ queryKey: ['my-sessions'] })
        return
      }

      if (d?.clientSecret) {
        setPayingSession(session)
        setClientSecret(d.clientSecret)
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.message || 'حدث خطأ')
    }
  }

  const tabs = ['ALL', 'PENDING', 'CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED']
  const tabLabels: Record<string, string> = {
    ALL: 'الكل', PENDING: 'معلقة', CONFIRMED: 'مؤكدة',
    RESCHEDULED: 'تغيير موعد', COMPLETED: 'مكتملة', CANCELLED: 'ملغية'
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          {isConsultantAccount ? 'جلساتي' : 'استشاراتي'}
        </h1>
        <p className="text-[color:var(--muted)] mt-1">
          {isConsultantAccount ? 'إدارة جلسات الاستشارة' : 'تتبع طلبات الاستشارة'}
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab ? 'bg-primary text-white' : 'border border-[color:var(--border)] text-[color:var(--muted)] hover:bg-[color:var(--surface-2)]'
            }`}>
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-[color:var(--surface)]" />)}
        </div>
      ) : (sessions as any[]).length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[color:var(--border)] py-16 text-center">
          <Calendar className="mx-auto mb-3 h-12 w-12 opacity-20" />
          <p className="text-lg text-foreground">لا توجد جلسات</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(sessions as any[]).map((session) => {
            const statusCfg = getStatusConfig(locale === 'ar')
            const st = statusCfg[session.status] || statusCfg.PENDING
            const Icon = st.icon
            const date = new Date(session.scheduledAt)
            const dateStr = date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            const timeStr = date.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })
            // Per-session role: am I the consultant or student in THIS session?
            const iAmConsultant = session.consultant?.id === user?.id || session.consultantId === user?.id
            const other = iAmConsultant ? session.student : session.consultant
            const otherName = `${other?.profile?.firstName || ''} ${other?.profile?.lastName || ''}`.trim()
            const MethodIcon = session.meetingMethod === 'ZOOM' ? Video : session.meetingMethod === 'GOOGLE_MEET' ? Globe : Phone

            return (
              <div key={session.id}
                className={`rounded-2xl border bg-[color:var(--surface)] overflow-hidden ${
                  session.status === 'PENDING' ? 'border-amber-500/30' :
                  session.status === 'CONFIRMED' ? 'border-green-500/20' :
                  session.status === 'RESCHEDULED' ? 'border-blue-500/30' :
                  'border-[color:var(--border)]'
                }`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${colorClass[st.color]}`}>
                          <Icon className="h-3 w-3" />{st.label}
                        </span>
                        {session.paymentStatus === 'PAID' ? (
                          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">مدفوع</span>
                        ) : session.price > 0 ? (
                          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">غير مدفوع</span>
                        ) : null}
                      </div>
                      <h3 className="font-bold text-foreground">
                        {iAmConsultant ? 'مستخدم:' : 'مع:'} {otherName}
                      </h3>
                      {session.topic && (
                        <p className="text-sm text-[color:var(--muted)] mt-0.5">الموضوع: {session.topic}</p>
                      )}
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-xl font-bold text-primary">{session.price} ريال</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-[color:var(--muted)] mb-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      {date.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      {date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MethodIcon className="h-4 w-4 text-primary" />
                      {session.meetingMethod === 'ZOOM' ? 'Zoom' : session.meetingMethod === 'GOOGLE_MEET' ? 'Google Meet' : 'هاتف'}
                    </span>
                  </div>

                  {session.status === 'RESCHEDULED' && session.proposedTime && (
                    <div className="mb-4 rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-sm">
                      <p className="font-semibold text-blue-400 mb-1">موعد مقترح جديد:</p>
                      <p className="text-foreground">{new Date(session.proposedTime).toLocaleString('ar-SA')}</p>
                    </div>
                  )}

                  {session.meetingLink && session.status === 'CONFIRMED' && (
                    <a href={session.meetingLink} target="_blank" rel="noopener noreferrer"
                      className="mb-4 flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition">
                      <Video className="h-4 w-4" />انضم للاجتماع
                    </a>
                  )}

                  {iAmConsultant && session.status === 'PENDING' && (
                    <div className="space-y-3">
                      {rejectingId === session.id ? (
                        <div className="space-y-2">
                          <input type="text" placeholder="سبب الرفض..." value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-2.5 text-sm focus:border-primary focus:outline-none" />
                          <div className="flex gap-2">
                            <button onClick={() => reject.mutate({ id: session.id, reason: rejectReason })}
                              disabled={reject.isPending}
                              className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                              تأكيد الرفض
                            </button>
                            <button onClick={() => setRejectingId(null)}
                              className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm hover:bg-[color:var(--surface-2)]">
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : reschedulingId === session.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-2.5 text-sm focus:border-primary focus:outline-none" />
                            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-2.5 text-sm focus:border-primary focus:outline-none" />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => reschedule.mutate({ id: session.id, proposedTime: new Date(`${newDate}T${newTime}`).toISOString() })}
                              disabled={!newDate || !newTime || reschedule.isPending}
                              className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                              اقتراح الموعد
                            </button>
                            <button onClick={() => setReschedulingId(null)}
                              className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm hover:bg-[color:var(--surface-2)]">
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => confirm.mutate(session.id)} disabled={confirm.isPending}
                            className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60 transition">
                            قبول
                          </button>
                          <button onClick={() => setReschedulingId(session.id)}
                            className="flex-1 rounded-xl bg-blue-600/20 border border-blue-500/30 py-2.5 text-sm font-bold text-blue-400 hover:bg-blue-600/30 transition">
                            تغيير الموعد
                          </button>
                          <button onClick={() => setRejectingId(session.id)}
                            className="flex-1 rounded-xl bg-red-600/20 border border-red-500/30 py-2.5 text-sm font-bold text-red-400 hover:bg-red-600/30 transition">
                            رفض
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {!iAmConsultant && (
                    <div className="flex gap-2">
                      {session.status === 'RESCHEDULED' && (
                        <button onClick={() => acceptReschedule.mutate(session.id)}
                          disabled={acceptReschedule.isPending}
                          className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
                          قبول الموعد الجديد
                        </button>
                      )}
                      {session.status === 'CONFIRMED' && session.paymentStatus === 'UNPAID' && session.price > 0 && (
                        <>
                          {user?.walletBalance && user.walletBalance >= session.price && (
                            <button
                              onClick={() => payWithWallet.mutate(session.id)}
                              disabled={payWithWallet.isPending}
                              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60 transition">
                              <Wallet className="h-4 w-4" />
                              {payWithWallet.isPending ? 'جاري الدفع...' : `دفع ${session.price} ريال من المحفظة`}
                            </button>
                          )}
                          <button
                            onClick={() => startPayment(session)}
                            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition">
                            <CreditCard className="h-4 w-4" />
                            دفع {session.price} ريال
                          </button>
                        </>
                      )}
                      {session.status === 'CONFIRMED' && session.paymentStatus === 'PAID' && (
                        <>
                          <button onClick={() => completeSession.mutate(session.id)} disabled={completeSession.isPending}
                            className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60 transition">
                            {completeSession.isPending ? 'جاري...' : 'تأكيد الإكمال'}
                          </button>
                          <button onClick={() => cancelWithRefund.mutate(session.id)} disabled={cancelWithRefund.isPending}
                            className="rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition">
                            {cancelWithRefund.isPending ? 'جاري...' : 'إلغاء مع استرداد'}
                          </button>
                        </>
                      )}
                      {['PENDING', 'RESCHEDULED'].includes(session.status) && (
                        <button onClick={() => cancel.mutate(session.id)} disabled={cancel.isPending}
                          className="rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition">
                          إلغاء
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Stripe Payment Modal */}
      {payingSession && clientSecret && stripePromise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setPayingSession(null); setClientSecret('') }} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <h3 className="font-bold text-foreground text-xl mb-2">
              دفع رسوم الاستشارة
            </h3>
            <p className="text-[color:var(--muted)] text-sm mb-4">
              {payingSession.price} ريال — استشارة مع{' '}
              {payingSession.consultant?.profile?.firstName}
            </p>
            <Elements stripe={stripePromise} options={{
              clientSecret,
              appearance: {
                theme: 'night',
                variables: { colorPrimary: '#5120c8', borderRadius: '12px' }
              }
            }}>
              <SessionPayForm
                sessionId={payingSession.id}
                onSuccess={() => {
                  setPayingSession(null)
                  setClientSecret('')
                  notify.success('تم الدفع بنجاح!')
                  qc.invalidateQueries({ queryKey: ['my-sessions'] })
                }}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  )
}
