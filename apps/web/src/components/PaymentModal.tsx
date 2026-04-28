'use client'
import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { X, CreditCard, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { get, post } from '@/lib/api'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface PaymentModalProps {
  session: any
  isDark: boolean
  isAr: boolean
  onClose: () => void
  onSuccess: () => void
  cardBg: string
  border: string
  text: string
  subtext: string
}

function PaymentForm({ session, isDark, isAr, onClose, onSuccess, cardBg, border, text, subtext }: PaymentModalProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [amount, setAmount] = useState(0)
  const [isFree, setIsFree] = useState(false)

  useEffect(() => {
    const createIntent = async () => {
      try {
        const res = await post(`/consulting/sessions/${session.id}/create-payment-intent`, {})
        const data = res.data?.data ?? res.data
        if (data?.free) {
          setIsFree(true)
          setTimeout(() => onSuccess(), 1500)
        } else {
          setClientSecret(data?.clientSecret)
          setAmount(data?.amount || 0)
        }
      } catch(e: any) {
        const err = e as any
        setError(err?.response?.data?.message || (isAr ? 'حدث خطأ' : 'Error occurred'))
      }
    }
    createIntent()
  }, [session.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || !clientSecret) return
    
    setLoading(true)
    setError('')
    
    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return
    
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement }
    })
    
    if (stripeError) {
      setError(stripeError.message || (isAr ? 'فشل الدفع' : 'Payment failed'))
      setLoading(false)
      return
    }
    
    if (paymentIntent?.status === 'succeeded') {
      try {
        await post(`/consulting/sessions/${session.id}/confirm-payment`, {
          paymentIntentId: paymentIntent.id
        })
        onSuccess()
      } catch(e: any) {
        const err = e as any
        setError(isAr ? 'تم الدفع ولكن حدث خطأ في التأكيد' : 'Payment succeeded but confirmation failed')
      }
    }
    
    setLoading(false)
  }

  const cardStyle = {
    style: {
      base: {
        fontSize: '14px',
        color: isDark ? '#f1f5f9' : '#0d0d0d',
        '::placeholder': { color: isDark ? '#94a3b8' : '#9ca3af' },
        fontFamily: 'system-ui, sans-serif',
      },
      invalid: { color: '#dc2626' }
    }
  }

  if (isFree) return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <CheckCircle2 size={48} color="#16a34a" style={{ marginBottom: 16 }} />
      <h3 style={{ color: text, fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>
        {isAr ? 'تم تأكيد الجلسة المجانية!' : 'Free Session Confirmed!'}
      </h3>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ padding: '0' }}>
      {/* Session summary */}
      <div style={{ padding: '16px', borderRadius: 12, border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ color: text, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
              {session.sessionName || session.topic}
            </div>
            <div style={{ color: subtext, fontSize: 12 }}>
              {new Date(session.scheduledAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {'  '}
              {new Date(session.scheduledAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div style={{ color: '#5120c8', fontSize: 22, fontWeight: 900, flexShrink: 0 }}>
            {amount} <span style={{ fontSize: 12, color: subtext }}>ر.س</span>
          </div>
        </div>
      </div>

      {/* Card input */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ color: text, fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'block' }}>
          {isAr ? 'بيانات البطاقة' : 'Card Details'}
        </label>
        <div style={{ padding: '13px 14px', borderRadius: 10, border: `1.5px solid ${border}`, background: isDark ? '#0d0d0d' : '#fafafa', transition: 'border-color 0.15s' }}
          onFocus={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#5120c8' }}
          onBlur={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = border }}>
          <CardElement options={cardStyle} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
          <Lock size={10} color={subtext} />
          <span style={{ color: subtext, fontSize: 10 }}>
            {isAr ? 'مدفوعات آمنة ومشفرة بواسطة Stripe' : 'Secure & encrypted payment by Stripe'}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', marginBottom: 14 }}>
          <AlertCircle size={14} color="#dc2626" />
          <span style={{ color: '#dc2626', fontSize: 12 }}>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button type="submit" disabled={loading || !stripe || !clientSecret}
        style={{ width: '100%', padding: '13px', borderRadius: 11, background: '#5120c8', color: '#ffffff', border: 'none', cursor: (loading || !stripe || !clientSecret) ? 'wait' : 'pointer', fontSize: 14, fontWeight: 700, opacity: (loading || !stripe || !clientSecret) ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {loading
          ? (isAr ? 'جاري المعالجة...' : 'Processing...')
          : <><CreditCard size={15} />{isAr ? `ادفع ${amount} ر.س` : `Pay ${amount} SAR`}</>}
      </button>

      {/* Test mode notice */}
      <p style={{ color: subtext, fontSize: 10, textAlign: 'center', marginTop: 10 }}>
        {isAr ? 'وضع الاختبار - استخدم 4242 4242 4242 4242' : 'Test mode - use card 4242 4242 4242 4242'}
      </p>
    </form>
  )
}

export default function PaymentModal(props: PaymentModalProps) {
  const { isDark, isAr, onClose, cardBg, border, text } = props

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 300, backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(460px, calc(100vw - 24px))', background: cardBg, borderRadius: 20, border: `1px solid ${border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', zIndex: 301, direction: isAr ? 'rtl' : 'ltr', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(81,32,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={18} color="#5120c8" />
            </div>
            <div>
              <h3 style={{ color: text, fontSize: 15, fontWeight: 800, margin: 0 }}>{isAr ? 'إتمام الدفع' : 'Complete Payment'}</h3>
              <p style={{ color: '#5120c8', fontSize: 11, margin: 0, fontWeight: 600 }}>Stripe Secure Payment</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: text }}>
            <X size={14} />
          </button>
        </div>
        
        <div style={{ padding: '20px 22px' }}>
          <Elements stripe={stripePromise}>
            <PaymentForm {...props} />
          </Elements>
        </div>
      </div>
    </>
  )
}
