'use client'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, ArrowRight, Video, Radio, MapPin } from 'lucide-react'

const API = 'https://deve-way.onrender.com/api'

export default function EnrollPaymentPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const t = useTranslations('learn')
  const router = useRouter()
  const searchParams = useSearchParams()

  const courseId = searchParams.get('courseId') || ''
  const amount = parseFloat(searchParams.get('amount') || '0')
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
    recorded: { icon: Video, color: '#5120c8' },
    live: { icon: Radio, color: '#dc2626' },
    offline: { icon: MapPin, color: '#16a34a' },
  }[courseType] || { icon: Video, color: '#5120c8' }

  const TypeIcon = typeConfig.icon

  const handleProceed = async () => {
    if (!token) {
      router.push(`/${locale}/auth/login`)
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
        body: JSON.stringify({ locale })
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
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '100%', maxWidth: 440 }}>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: `${typeConfig.color}15`, border: `1px solid ${typeConfig.color}30`, marginBottom: 12 }}>
            <TypeIcon size={13} color={typeConfig.color} />
            <span style={{ color: typeConfig.color, fontSize: 11, fontWeight: 700 }}>{typeLabel}</span>
          </div>
          <h1 style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 900, margin: '0 0 4px' }}>
            {t('confirmEnrollment')}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>{title}</p>
        </div>

        <div style={{ background: '#111', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>{t('coursePrice')}</span>
              <span style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 700 }}>{amount} {t('sar')}</span>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700 }}>{t('totalLabel')}</span>
              <span style={{ color: '#5120c8', fontSize: 18, fontWeight: 900 }}>{amount} {t('sar')}</span>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                t('securePaymentLabel'),
                t('moneyBack'),
                t('instantAccessLabel'),
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={14} color="#16a34a" />
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{f}</span>
                </div>
              ))}
            </div>

            {error && (
              <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 12, padding: '10px 12px', background: 'rgba(220,38,38,0.08)', borderRadius: 8, border: '1px solid rgba(220,38,38,0.2)' }}>
                {error}
              </p>
            )}

            <button
              onClick={handleProceed}
              disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#5120c8', color: '#fff', border: 'none', cursor: loading ? 'wait' : 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
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
      </div>
    </div>
  )
}
