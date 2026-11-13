'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { X, CheckCircle, Loader2, BookOpen, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useMarket } from '@/app/contexts/MarketContext'
import { formatCurrency } from '@/lib/formatCurrency'
import { toMarketAmount } from '@/lib/marketConfig'

interface Props {
  isOpen: boolean
  onClose: () => void
  trackName: string
  coursesCount: number
  /** Package price in SAR (base currency), when the track has a paid package. */
  price?: number | null
  /** Paid package: where "confirm" goes (the payment page). */
  paymentUrl?: string
  /** Free enrollment: runs the enroll API call. Throw to show the error. */
  onEnroll?: () => Promise<void>
  /** True when the track can't be joined yet (no package and no enroll endpoint). */
  comingSoon?: boolean
}

export function EnrollConfirmModal({ isOpen, onClose, trackName, coursesCount, price, paymentUrl, onEnroll, comingSoon }: Props) {
  const router = useRouter()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const { market } = useMarket()
  const token = useAuthStore((s) => s.token)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (!isOpen) { setError(null); setLoading(false) } }, [isOpen])
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  const tr = (ar: string, en: string) => (isAr ? ar : en)
  const loggedIn = mounted && !!token
  const paid = !!price && price > 0
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : `/${locale}/careers`

  const handleConfirm = async () => {
    setError(null)
    if (!loggedIn) {
      router.push(`/${locale}/register?returnUrl=${encodeURIComponent(currentPath)}`)
      return
    }
    if (paid && paymentUrl) {
      // Paid package: the payment page creates the checkout.
      setLoading(true)
      window.location.href = paymentUrl
      return
    }
    if (!onEnroll) return
    setLoading(true)
    try {
      await onEnroll()
    } catch (e: any) {
      setError(e?.message || tr('حدث خطأ، يرجى المحاولة مرة أخرى', 'Something went wrong, please try again'))
      setLoading(false)
    }
  }

  const perks = [
    tr('وصول كامل لجميع الكورسات', 'Full access to every course'),
    tr('شهادة إتمام المسار', 'Track completion certificate'),
    tr('متابعة تقدّمك في الداشبورد', 'Track your progress in the dashboard'),
  ]

  const confirmLabel = !loggedIn
    ? tr('إنشاء حساب', 'Create account')
    : paid
      ? tr('المتابعة للدفع', 'Continue to payment')
      : tr('تأكيد الانضمام', 'Confirm and join')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={tr('تأكيد الانضمام للمسار', 'Confirm joining the track')}
    >
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="mx-4 w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)', textAlign: isAr ? 'right' : 'left' }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold">{tr('تأكيد الانضمام للمسار', 'Confirm joining the track')}</h2>
          <button type="button" onClick={onClose} disabled={loading} aria-label={tr('إغلاق', 'Close')} className="flex h-8 w-8 flex-none items-center justify-center rounded-full" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
            <X size={16} />
          </button>
        </div>

        {!loggedIn && (
          <p className="mb-4 rounded-xl p-3 text-sm font-semibold" style={{ background: 'var(--wash)', color: 'var(--brand)' }}>
            {tr('سجّل أولاً للانضمام لهذا المسار', 'Sign up first to join this track')}
          </p>
        )}

        <div className="mb-4 rounded-xl p-4" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }}>
          <div className="text-xl font-bold">{trackName}</div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--ink-2)' }}>
            <span className="inline-flex items-center gap-1.5"><BookOpen size={15} />{tr(`${coursesCount} دورات`, `${coursesCount} courses`)}</span>
            <b style={{ color: 'var(--brand)' }}>
              {paid ? formatCurrency(toMarketAmount(price!, market), market, locale) : tr('مجاني للاستكشاف', 'Free to explore')}
            </b>
          </div>
        </div>

        <ul className="space-y-2">
          {perks.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink-2)' }}>
              <CheckCircle size={16} style={{ color: 'var(--good, #137a45)', flex: 'none' }} />
              {p}
            </li>
          ))}
        </ul>

        {comingSoon && loggedIn && (
          <p className="mt-4 rounded-xl p-3 text-sm" style={{ background: 'var(--warn-bg, #fff2dd)', color: 'var(--warn, #8a4b00)' }}>
            {tr('التسجيل في هذا المسار غير متاح بعد. سنفتحه قريبًا.', 'Enrollment for this track is not open yet. It opens soon.')}
          </p>
        )}

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-xl p-3 text-sm" style={{ background: 'var(--error-subtle)', color: 'var(--error)' }} role="alert">
            <AlertCircle size={16} className="mt-0.5 flex-none" />{error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold" style={{ border: '1px solid var(--line)', color: 'var(--ink)' }}>
            {tr('إلغاء', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (loggedIn && !!comingSoon)}
            className="flex flex-[2] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold"
            style={{ background: 'var(--brand)', color: '#fff', opacity: loading || (loggedIn && comingSoon) ? 0.6 : 1 }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>

        {!loggedIn && (
          <button
            type="button"
            onClick={() => router.push(`/${locale}/login?redirect=${encodeURIComponent(currentPath)}`)}
            className="mt-3 w-full text-center text-sm font-semibold"
            style={{ color: 'var(--brand)' }}
          >
            {tr('لدي حساب بالفعل', 'I already have an account')}
          </button>
        )}
      </div>
    </div>
  )
}
