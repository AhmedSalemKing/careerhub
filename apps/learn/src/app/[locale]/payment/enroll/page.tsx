'use client'
import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Lock, CheckCircle2, ArrowRight, Video, Radio, MapPin } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

function PaymentForm({ courseId, amount, title, courseType, returnUrl }: any) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [step, setStep] = useState<'review'|'pay'|'success'>('review')

  const API = process.env.NEXT_PUBLIC_API_URL || 'https://deve-way.onrender.com/api'
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || sessionStorage.getItem('token') ||
       localStorage.getItem('careerhub_token') || localStorage.getItem('deveway_token') || '')
    : ''

  const typeConfig = {
    recorded: { icon: Video, color: '#5120c8', ar: 'كورس مسجل', en: 'Recorded Course' },
    live: { icon: Radio, color: '#dc2626', ar: 'بث مباشر', en: 'Live Session' },
    offline: { icon: MapPin, color: '#16a34a', ar: 'مقر فعلي', en: 'Physical Course' },
  }[courseType as string] || { icon: Video, color: '#5120c8', ar: 'كورس', en: 'Course' }

  const TypeIcon = typeConfig.icon

  const handleProceed = async () => {
    if (!token) {
      router.push(`/${locale}/auth/login`)
      return
    }
    setLoading(true)
    setError('')

    try {
      console.log('[Payment] Creating intent for course:', courseId, 'amount:', amount)

      const res = await fetch(`${API}/courses/${courseId}/payment-intent`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: parseFloat(amount.toString()) })
      })

      console.log('[Payment] Response status:', res.status)
      const data = await res.json()
      console.log('[Payment] Response data:', data)

      if (!res.ok) {
        throw new Error(data.message || `Server error: ${res.status}`)
      }

      if (data?.data?.clientSecret || data?.clientSecret) {
        const secret = data?.data?.clientSecret || data?.clientSecret
        setClientSecret(secret)
        setStep('pay')
      } else {
        throw new Error('No client secret returned from server')
      }
    } catch(e: any) {
      console.error('[Payment] Error:', e)
      setError(e.message || (isAr ? 'فشل إنشاء جلسة الدفع. تحقق من الاتصال.' : 'Failed to create payment session. Check connection.'))
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !clientSecret) return
    setLoading(true)
    setError('')

    const cardEl = elements.getElement(CardElement)
    if (!cardEl) return

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardEl }
    })

    if (stripeError) {
      setError(stripeError.message || (isAr ? 'فشل الدفع' : 'Payment failed'))
      setLoading(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      await fetch(`${API}/courses/${courseId}/confirm-enrollment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id })
      }).catch(() => {})
      setStep('success')
    }
    setLoading(false)
  }

  const cardStyle = {
    style: {
      base: { fontSize: '14px', color: '#f1f5f9', '::placeholder': { color: '#94a3b8' }, fontFamily: 'system-ui' },
      invalid: { color: '#dc2626' }
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {step === 'success' ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', background: '#111', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={32} color="#16a34a" />
            </div>
            <h2 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 900, margin: '0 0 8px' }}>
              {isAr ? 'تم التسجيل بنجاح!' : 'Enrollment Successful!'}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24 }}>
              {courseType === 'live'
                ? (isAr ? 'يمكنك الآن الانضمام للبث المباشر' : 'You can now join the live stream')
                : courseType === 'offline'
                  ? (isAr ? 'تم تأكيد حجزك في الكورس' : 'Your spot has been confirmed')
                  : (isAr ? 'يمكنك الآن البدء بالتعلم' : 'You can now start learning')}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {courseType === 'live' && (
                <button onClick={() => router.push(`/${locale}/live/${courseId}`)} style={{ flex: 1, padding: '12px', borderRadius: 11, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  {isAr ? 'انضم للبث' : 'Join Live'}
                </button>
              )}
              <button onClick={() => router.push(returnUrl || `/${locale}/courses/${courseId}`)} style={{ flex: 1, padding: '12px', borderRadius: 11, background: '#5120c8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                {isAr ? 'عرض الكورس' : 'View Course'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: `${typeConfig.color}15`, border: `1px solid ${typeConfig.color}30`, marginBottom: 12 }}>
                <TypeIcon size={13} color={typeConfig.color} />
                <span style={{ color: typeConfig.color, fontSize: 11, fontWeight: 700 }}>{isAr ? typeConfig.ar : typeConfig.en}</span>
              </div>
              <h1 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 900, margin: '0 0 4px' }}>
                {step === 'review' ? (isAr ? 'تأكيد الاشتراك' : 'Confirm Enrollment') : (isAr ? 'إتمام الدفع' : 'Complete Payment')}
              </h1>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>{title}</p>
            </div>

            <div style={{ background: '#111', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>

              <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{isAr ? 'سعر الكورس' : 'Course Price'}</span>
                  <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 700 }}>{amount} {isAr ? 'ر.س' : 'SAR'}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700 }}>{isAr ? 'الإجمالي' : 'Total'}</span>
                  <span style={{ color: '#5120c8', fontSize: 18, fontWeight: 900 }}>{amount} {isAr ? 'ر.س' : 'SAR'}</span>
                </div>
              </div>

              {step === 'review' && (
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {[
                      isAr ? 'دفع آمن ومشفر بواسطة Stripe' : 'Secure payment via Stripe',
                      isAr ? 'ضمان استرداد الأموال خلال 30 يوم' : '30-day money-back guarantee',
                      isAr ? 'وصول فوري بعد الدفع' : 'Instant access after payment',
                    ].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={14} color="#16a34a" />
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleProceed} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#5120c8', color: '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: loading ? 0.7 : 1 }}>
                    {loading
                      ? (isAr ? 'جاري التحضير...' : 'Preparing...')
                      : <>{isAr ? 'المتابعة للدفع' : 'Proceed to Payment'}<ArrowRight size={15} style={{ transform: isAr?'rotate(180deg)':'none' }} /></>}
                  </button>
                </div>
              )}

              {step === 'pay' && (
                <form onSubmit={handlePay} style={{ padding: '20px' }}>
                  <label style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'block' }}>
                    {isAr ? 'بيانات البطاقة' : 'Card Details'}
                  </label>
                  <div style={{ padding: '13px 14px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', marginBottom: 6 }}>
                    <CardElement options={cardStyle} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16 }}>
                    <Lock size={10} color="#94a3b8" />
                    <span style={{ color: '#94a3b8', fontSize: 10 }}>{isAr ? 'مشفر بـ SSL 256-bit' : 'Secured with SSL 256-bit'}</span>
                  </div>
                  {error && <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 12 }}>{error}</p>}
                  <button type="submit" disabled={loading || !stripe} style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#5120c8', color: '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: (loading || !stripe) ? 0.7 : 1 }}>
                    <CreditCard size={15} />
                    {loading ? (isAr?'جاري الدفع...':'Processing...') : `${isAr?'ادفع':'Pay'} ${amount} ${isAr?'ر.س':'SAR'}`}
                  </button>
                  <p style={{ color: '#94a3b8', fontSize: 10, textAlign: 'center', marginTop: 10 }}>
                    Test: 4242 4242 4242 4242
                  </p>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function EnrollPaymentPage() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId') || ''
  const amount = parseFloat(searchParams.get('amount') || '0')
  const title = searchParams.get('title') || ''
  const courseType = searchParams.get('type') || 'recorded'
  const returnUrl = searchParams.get('returnUrl') || ''

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm courseId={courseId} amount={amount} title={title} courseType={courseType} returnUrl={returnUrl} />
    </Elements>
  )
}
