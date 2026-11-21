'use client'
import { Suspense, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function Processing() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const params = useSearchParams()

  useEffect(() => {
    const q = new URLSearchParams(params.toString())
    q.set('json', '1')
    let cancelled = false
    fetch(`/api/payments/callback?${q.toString()}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d?.redirect) window.location.replace(d.redirect) })
      .catch(() => {
        if (!cancelled) window.location.replace(`/${locale}/payment-failed?reason=network&courseId=${params.get('courseId') || ''}`)
      })
    return () => { cancelled = true }
  }, [params, locale])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <Loader2 size={48} color="#5120c8" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <h1 style={{ color: 'var(--foreground)', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>
          {isAr ? 'جاري تأكيد الدفع...' : 'Confirming your payment...'}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
          {isAr ? 'قد تستغرق العملية بضع ثوانٍ' : 'This may take a few seconds'}
        </p>
      </div>
    </div>
  )
}

export default function PaymentProcessingPage() {
  return <Suspense fallback={null}><Processing /></Suspense>
}
