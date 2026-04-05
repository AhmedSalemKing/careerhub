'use client'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useLocale } from 'next-intl'

export default function CheckoutPage() {
  const params = useParams()
  const courseId = params.id as string
  const locale = useLocale()

  useEffect(() => {
    const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_URL || ''
    window.location.href = `${MAIN_URL}/${locale}/checkout/${courseId}`
  }, [courseId, locale])

  return (
    <div className="flex min-h-screen items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p style={{ color: 'var(--text-muted)' }}>جاري التحويل إلى صفحة الدفع...</p>
      </div>
    </div>
  )
}
