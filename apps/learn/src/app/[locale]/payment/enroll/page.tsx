'use client'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, ArrowRight, Video, Radio, MapPin } from 'lucide-react'
import { webLoginUrl } from '../../../../lib/constants'

const API = 'https://api.deveways.com/api'

export default function EnrollPaymentPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const t = useTranslations('learn')
  const router = useRouter()
  const searchParams = useSearchParams()

  const courseId = searchParams.get('courseId') || ''
  const amount = parseFloat(searchParams.get('amount') || '0')
  const rawDisplay = searchParams.get('amountDisplay')

  // Market (EGP / SAR) is set by middleware from the visitor's IP country.
  // The same currency is sent to the API so Stripe charges what is displayed.
  const market = typeof document !== 'undefined'
    ? (document.cookie.match(/(?:^|;\s*)market=([^;]*)/)?.[1]?.trim() || 'SAR')
    : 'SAR'
  const SAR_TO_EGP = 15.0027
  const fallbackDisplay = market === 'EGP'
    ? (amount * SAR_TO_EGP).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ج.م'
    : amount.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ر.س'
  const amountDisplay = rawDisplay ? decodeURIComponent(rawDisplay) : fallbackDisplay
  const title = searchParams.get('title') || ''
  const courseType = searchParams.get('type') || 'recorded'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || sessionStorage.getItem('token') ||
       localStorage.getItem('careerhub_token') || localStorage.getItem('deveway_token') || '')
    : ''

  const typeLabels: Record<string, string> = {
    recorded: t('recordedBadge') + ' Course',
    live: t('liveTab'),
    offline: t('physicalBadge') + ' Course',
  }
  const typeLabel = typeLabels[courseType] || t('course')
  const typeConfig = {
    recorded: { icon: Video, color: 'var(--primary)' },
    live: { icon: Radio, color: 'var(--error)' },
    offline: { icon: MapPin, color: 'var(--success)' },
  }[courseType] || { icon: Video, color: 'var(--primary)' }

  const TypeIcon = typeConfig.icon

  const handleProceed = async () => {
    if (!token) {
      window.location.href = webLoginUrl(locale, window.location.pathname + window.location.search)
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/payments/checkout/course/${courseId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale, currency: market })
      })
      const data = await res.json()
      if (data?.data?.url) {
        window.location.href = data.data.url
      } else {
        setError(data?.message || t('errorOccurred'))
      }
    } catch(e: any) {
      setError(e.message || t('failedToConnect'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, direction: isAr ? 'rtl' : 'ltr' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
      }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: `color-mix(in srgb, ${typeConfig.color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${typeConfig.color} 25%, transparent)`, marginBottom: 12 }}>
            <TypeIcon size={13} color={typeConfig.color} />
            <span style={{ color: typeConfig.color, fontFamily: 'PingAR, sans-serif', fontWeight: 500, fontSize: 11 }}>{typeLabel}</span>
          </div>
          <div style={{ fontFamily: 'PingAR, sans-serif', fontWeight: 900, fontSize: 28, color: 'var(--foreground)', marginBottom: 8 }}>
            {t('confirmEnrollment')}
          </div>
          <div style={{ fontFamily: 'PingAR, sans-serif', fontWeight: 300, fontSize: 14, color: 'var(--muted)' }}>{title}</div>
        </div>

        <div style={{ background: 'color-mix(in srgb, var(--foreground) 4%, transparent)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: 'PingAR, sans-serif', fontWeight: 300, fontSize: 14, color: 'var(--muted)' }}>{t('coursePrice')}</span>
            <span style={{ fontFamily: 'PingAR, sans-serif', fontWeight: 300, fontSize: 14, color: 'var(--foreground)' }}>{amountDisplay}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'PingAR, sans-serif', fontWeight: 500, fontSize: 15, color: 'var(--foreground)' }}>{t('totalLabel')}</span>
            <span style={{ fontFamily: 'PingAR, sans-serif', fontWeight: 500, fontSize: 15, color: 'var(--primary)' }}>{amountDisplay}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            t('securePaymentLabel'),
            t('moneyBack'),
            t('instantAccessLabel'),
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} color="var(--success)" />
              <span style={{ fontFamily: 'PingAR, sans-serif', fontWeight: 300, fontSize: 13, color: 'var(--muted)' }}>{f}</span>
            </div>
          ))}
        </div>

        {error && (
          <p style={{ color: 'var(--error)', fontFamily: 'PingAR, sans-serif', fontSize: 12, marginTop: 16, marginBottom: 0, padding: '10px 12px', background: 'var(--error-subtle)', borderRadius: 8, border: '1px solid color-mix(in srgb, var(--error) 25%, transparent)' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleProceed}
          disabled={loading}
          style={{
            width: '100%',
            marginTop: 20,
            padding: '14px 0',
            borderRadius: 10,
            border: 'none',
            background: 'var(--primary)',
            color: 'var(--primary-fg)',
            fontFamily: 'PingAR, sans-serif',
            fontWeight: 500,
            fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
          {loading ? (
            <>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid color-mix(in srgb, var(--primary-fg) 30%, transparent)', borderTopColor: 'var(--primary-fg)', animation: 'spin 0.8s linear infinite' }} />
              {t('preparingLabel')}
            </>
          ) : (
            <>
              {t('proceedToPayment')}
              <ArrowRight size={15} style={{ transform: isAr ? 'rotate(180deg)' : 'none' }} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
