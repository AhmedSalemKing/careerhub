'use client'
import { Suspense } from 'react'
import { useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function Failed() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const reason = useSearchParams().get('reason')
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <h1 style={{ color: 'var(--foreground)', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>
          {isAr ? 'تعذر تأكيد الدفع' : 'We could not confirm your payment'}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 20px', lineHeight: 1.7 }}>
          {isAr
            ? 'إذا تم خصم المبلغ فسيتم تفعيل اشتراكك تلقائيا خلال دقائق. يمكنك مراجعة كورساتك أو التواصل مع الدعم.'
            : 'If you were charged, your enrollment will be activated automatically within minutes. Check your courses or contact support.'}
        </p>
        {reason && <p style={{ color: 'var(--muted)', fontSize: 12, margin: '0 0 20px' }}>{reason}</p>}
        <Link href={`/${locale}/dashboard/my-courses`} style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 12, background: '#5120c8', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          {isAr ? 'كورساتي' : 'My courses'}
        </Link>
      </div>
    </div>
  )
}

export default function PaymentFailedPage() {
  return <Suspense fallback={null}><Failed /></Suspense>
}
