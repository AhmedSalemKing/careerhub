'use client'
import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { get, post } from '../../../../lib/api'
import { getMediaUrl } from '../../../../lib/media'
import { notify } from '../../../../lib/notify'
import {
  Shield, CheckCircle,
  Lock, ArrowRight, Users, BookOpen, Clock, Zap
} from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements, PaymentElement,
  useStripe, useElements,
} from '@stripe/react-stripe-js'

const stripePromise =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('your-stripe')
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null

// ── Stripe Card Sub-component ──────────────────────────────────────────────
function StripeForm({
  courseId,
  amount,
  onSuccess,
}: {
  courseId: string
  amount: number
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    if (!stripe || !elements) return
    setProcessing(true)
    setError('')

    const { error: submitErr } = await elements.submit()
    if (submitErr) {
      setError(submitErr.message || 'خطأ')
      setProcessing(false)
      return
    }

    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (result.error) {
      setError(result.error.message || 'فشل الدفع')
      setProcessing(false)
      return
    }

    if (result.paymentIntent?.status === 'succeeded') {
      try {
        await post('/payment/confirm', {
          paymentIntentId: result.paymentIntent.id,
          courseId,
        })
        onSuccess()
      } catch (e: any) {
        setError(e?.response?.data?.message || 'حدث خطأ في التأكيد')
      }
    }
    setProcessing(false)
  }

  return (
    <div className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: { applePay: 'never', googlePay: 'never' },
        }}
      />
      {error && (
        <p className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </p>
      )}
      <button
        onClick={handlePay}
        disabled={!stripe || processing}
        className="w-full rounded-2xl bg-[color:var(--primary)] py-4 font-bold text-white text-lg hover:opacity-90 disabled:opacity-60 transition-all hover:scale-[1.01]"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            جاري المعالجة...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            ادفع {amount} ريال الآن
          </span>
        )}
      </button>
      <p className="text-center text-xs text-[color:var(--muted)]">
        بطاقة اختبار: 4242 4242 4242 4242 · 12/29 · 123
      </p>
    </div>
  )
}

// ── Main Checkout Page ─────────────────────────────────────────────────────
export default function CheckoutPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const locale = useLocale()
  const router = useRouter()

  const [clientSecret, setClientSecret] = useState('')
  const [success, setSuccess] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [creatingIntent, setCreatingIntent] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('deveway_token')
    if (!token) {
      router.push(`/${locale}/login?redirect=/${locale}/checkout/${courseId}`)
    }
  }, [courseId, locale, router])

  const { data, isLoading } = useQuery({
    queryKey: ['checkout', courseId],
    queryFn: async () => {
      // تم إزالة <any> هنا
      const res = await get(`/payment/checkout/${courseId}`)
      return res?.data?.data
    },
    enabled: !!courseId,
    retry: false,
  })

  const handleStartPayment = useCallback(async () => {
    if (!agreed) {
      notify.error('يرجى الموافقة على الشروط أولاً')
      return
    }
    setCreatingIntent(true)
    try {
      // تم إزالة <any> هنا أيضاً
      const res = await post('/payment/create-intent', { courseId })
      const d = res?.data?.data

      if (d?.free || d?.sandbox) {
        notify.success('تم الاشتراك بنجاح!')
        setSuccess(true)
        return
      }
      if (d?.clientSecret) {
        setClientSecret(d.clientSecret)
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.message || 'حدث خطأ')
    } finally {
      setCreatingIntent(false)
    }
  }, [courseId, agreed])

  const course = data?.course
  const alreadyEnrolled = data?.alreadyEnrolled
  const thumb = getMediaUrl(course?.thumbnail)
  const LEARN_URL = process.env.NEXT_PUBLIC_LEARN_URL || 'http://localhost:3002'
  const courseTitle = course?.titleAr || course?.titleEn || ''

  if (isLoading) return <Skeleton />

  if (alreadyEnrolled) return (
    <div className="flex min-h-screen items-center justify-center p-6" dir="rtl">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold font-madinet text-foreground mb-2">أنت مشترك بالفعل</h2>
        <p className="text-[color:var(--muted)] mb-6">يمكنك الوصول لهذا الكورس مباشرة</p>
        <a
          href={`${LEARN_URL}/${locale}/courses/${courseId}`}
          className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--primary)] px-8 py-3 font-bold text-white hover:opacity-90 transition"
        >
          ابدأ التعلم <ArrowRight className="h-5 w-5" />
        </a>
      </div>
    </div>
  )

  if (success) return (
    <div className="flex min-h-screen items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-green-500/30 bg-green-500/5 p-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 animate-pulse">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold font-madinet text-foreground mb-2">تم الاشتراك بنجاح!</h2>
          <p className="text-[color:var(--muted)] mb-1">اشتركت في كورس</p>
          <p className="font-bold text-foreground mb-6">{courseTitle}</p>

          <div className="rounded-2xl bg-[color:var(--surface)] p-4 mb-6 space-y-2 text-right text-sm">
            <div className="flex justify-between">
              <span className="text-green-400 font-semibold">مدفوع بنجاح</span>
              <span className="text-[color:var(--muted)]">الحالة</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-[color:var(--primary)]">{course?.price} ريال</span>
              <span className="text-[color:var(--muted)]">المبلغ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-foreground">{new Date().toLocaleDateString('ar-SA')}</span>
              <span className="text-[color:var(--muted)]">التاريخ</span>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={`${LEARN_URL}/${locale}/courses/${courseId}`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--primary)] py-3.5 font-bold text-white hover:opacity-90 transition"
            >
              ابدأ التعلم الآن <ArrowRight className="h-5 w-5" />
            </a>
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="w-full rounded-2xl border border-[color:var(--border)] py-3 text-sm hover:bg-[color:var(--surface-2)] transition"
            >
              العودة للداشبورد
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen py-8 px-4" dir="rtl">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold font-madinet text-foreground mb-8 text-center">
          إتمام الاشتراك
        </h1>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* ── Course Info ── */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
              <div className="aspect-video overflow-hidden bg-[color:var(--surface-2)]">
                {thumb ? (
                  <img src={thumb} alt={courseTitle} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-16 w-16 text-[color:var(--primary)]/30" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h2 className="text-xl font-bold text-foreground mb-2">{courseTitle}</h2>
                {(course?.descriptionAr || course?.descriptionEn) && (
                  <p className="text-sm text-[color:var(--muted)] line-clamp-2 mb-4">
                    {course.descriptionAr || course.descriptionEn}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-[color:var(--muted)]">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course?._count?.enrollments || 0} طالب
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course?._count?.sections || 0} قسم
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {course?.level === 'BEGINNER'
                      ? 'مبتدئ'
                      : course?.level === 'INTERMEDIATE'
                      ? 'متوسط'
                      : 'متقدم'}
                  </span>
                </div>
              </div>
            </div>

            {/* Price summary */}
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
              <h3 className="font-bold text-foreground mb-3">ملخص الطلب</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[color:var(--muted)]">سعر الكورس</span>
                  <span>{course?.price} ريال</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[color:var(--muted)]">الضريبة</span>
                  <span>0 ريال</span>
                </div>
                <div className="border-t border-[color:var(--border)] pt-2 flex justify-between font-bold text-base">
                  <span>الإجمالي</span>
                  <span className="text-[color:var(--primary)] text-xl">{course?.price} ريال</span>
                </div>
              </div>
            </div>

            {/* Security badges */}
            <div className="flex items-center justify-center gap-4 text-xs text-[color:var(--muted)]">
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-500" />
                SSL مشفر
              </span>
              <span className="flex items-center gap-1">
                <Lock className="h-4 w-4 text-green-500" />
                آمن 100%
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-[color:var(--primary)]" />
                فوري
              </span>
            </div>
          </div>

          {/* ── Payment Section ── */}
          <div className="space-y-4">
            {!clientSecret ? (
              <>
                <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                  <h3 className="font-bold text-foreground mb-3">وسيلة الدفع</h3>
                  {!stripePromise ? (
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-400 text-center">
                      وضع تجريبي — لن يتم خصم أي مبلغ حقيقي
                    </div>
                  ) : (
                    <div className="rounded-xl bg-[color:var(--primary)]/10 border border-[color:var(--primary)]/20 p-4 text-sm text-[color:var(--primary)] text-center">
                      Stripe — دفع آمن بالبطاقة
                    </div>
                  )}
                </div>

                <label className="flex items-start gap-3 cursor-pointer rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                  <div
                    onClick={() => setAgreed(!agreed)}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                      agreed
                        ? 'bg-[color:var(--primary)] border-[color:var(--primary)]'
                        : 'border-[color:var(--border)]'
                    }`}
                  >
                    {agreed && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-sm text-[color:var(--muted)]">
                    أوافق على{' '}
                    <span className="text-[color:var(--primary)] hover:underline cursor-pointer">
                      شروط الاستخدام
                    </span>{' '}
                    وسياسة الاسترداد
                  </span>
                </label>

                <button
                  onClick={handleStartPayment}
                  disabled={!agreed || creatingIntent}
                  className={`w-full rounded-2xl py-4 font-bold text-white text-lg transition-all ${
                    agreed && !creatingIntent
                      ? 'bg-[color:var(--primary)] hover:opacity-90 shadow-lg hover:scale-[1.02]'
                      : 'bg-gray-600 cursor-not-allowed opacity-60'
                  }`}
                >
                  {creatingIntent ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      جاري التحضير...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="h-5 w-5" />
                      {course?.price === 0
                        ? 'اشترك مجاناً'
                        : `ادفع ${course?.price} ريال`}
                    </span>
                  )}
                </button>

                <p className="text-center text-xs text-[color:var(--muted)]">
                  ضمان استرداد خلال 7 أيام إذا لم تكن راضياً
                </p>
              </>
            ) : (
              stripePromise && (
                <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                  <h3 className="font-bold text-foreground mb-4">أدخل بيانات البطاقة</h3>
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'night',
                        variables: {
                          colorPrimary: '#3b82f6',
                          colorBackground: '#1e293b',
                          borderRadius: '12px',
                          fontFamily: 'system-ui, sans-serif',
                        },
                      },
                    }}
                  >
                    <StripeForm
                      courseId={courseId}
                      amount={course?.price || 0}
                      onSuccess={() => {
                        notify.success('تم الاشتراك بنجاح!')
                        setSuccess(true)
                      }}
                    />
                  </Elements>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="mx-auto max-w-5xl grid gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-72 animate-pulse rounded-3xl bg-[color:var(--surface)]" />
            <div className="h-40 animate-pulse rounded-3xl bg-[color:var(--surface)]" />
          </div>
        ))}
      </div>
    </div>
  )
}