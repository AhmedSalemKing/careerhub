'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { X, CheckCircle, Loader2, BookOpen, AlertCircle, Package, Rocket } from 'lucide-react'
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
  /** Paid package: the payment page. The package is optional. */
  paymentUrl?: string
  /** Free enrollment: runs the enroll API call. Throw to show the error. */
  onEnroll?: () => Promise<void>
  /** True when the track can't be joined for free yet (no matching career path). */
  comingSoon?: boolean
}

export function EnrollConfirmModal({ isOpen, onClose, trackName, coursesCount, price, paymentUrl, onEnroll, comingSoon }: Props) {
  const router = useRouter()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const { market } = useMarket()
  const token = useAuthStore((s) => s.token)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState<null | 'free' | 'paid'>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (!isOpen) { setError(null); setLoading(null) } }, [isOpen])
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  const tr = (ar: string, en: string) => (isAr ? ar : en)
  const loggedIn = mounted && !!token
  const hasPackage = !!price && price > 0 && !!paymentUrl
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : `/${locale}/careers`

  const needLogin = () => {
    router.push(`/${locale}/register?returnUrl=${encodeURIComponent(currentPath)}`)
  }

  const handleFree = async () => {
    setError(null)
    if (!loggedIn) return needLogin()
    if (!onEnroll) return
    setLoading('free')
    try {
      await onEnroll()
    } catch (e: any) {
      setError(e?.message || tr('حدث خطأ، يرجى المحاولة مرة أخرى', 'Something went wrong, please try again'))
      setLoading(null)
    }
  }

  const handlePaid = () => {
    setError(null)
    if (!loggedIn) return needLogin()
    if (!paymentUrl) return
    setLoading('paid')
    window.location.href = paymentUrl
  }

  const card = { background: 'var(--bg-2)', border: '1px solid var(--line)' } as const
  const primaryBtn = 'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={tr('انضم للمسار', 'Join the track')}
    >
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6"
        style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)', textAlign: isAr ? 'right' : 'left' }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{tr(`انضم لمسار ${trackName}`, `Join ${trackName}`)}</h2>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--ink-2)' }}>
              <BookOpen size={15} />{tr(`${coursesCount} دورات`, `${coursesCount} courses`)}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={!!loading} aria-label={tr('إغلاق', 'Close')} className="flex h-8 w-8 flex-none items-center justify-center rounded-full" style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}>
            <X size={16} />
          </button>
        </div>

        {!loggedIn && (
          <p className="mb-4 rounded-xl p-3 text-sm font-semibold" style={{ background: 'var(--wash)', color: 'var(--brand)' }}>
            {tr('سجّل أولاً للانضمام لهذا المسار', 'Sign up first to join this track')}
          </p>
        )}

        {/* Free option: always available */}
        <div className="mb-3 rounded-xl p-4" style={card}>
          <div className="flex items-center gap-2 font-bold"><Rocket size={18} style={{ color: 'var(--brand)' }} />{tr('ابدأ بدون اشتراك', 'Start without a subscription')}</div>
          <p className="mb-3 mt-1 text-sm" style={{ color: 'var(--ink-2)' }}>{tr('يمكنك الوصول للمحتوى الأساسي مجاناً', 'Get free access to the core content')}</p>
          <button
            type="button"
            onClick={handleFree}
            disabled={!!loading || (loggedIn && (!onEnroll || !!comingSoon))}
            className={primaryBtn}
            style={{ background: 'var(--brand)', color: '#fff', opacity: loading || (loggedIn && (!onEnroll || comingSoon)) ? 0.6 : 1 }}
          >
            {loading === 'free' && <Loader2 size={16} className="animate-spin" />}
            {loggedIn ? tr('ابدأ المسار مجاناً', 'Start the track for free') : tr('إنشاء حساب', 'Create account')}
          </button>
          {loggedIn && (!onEnroll || comingSoon) && (
            <p className="mt-2 text-xs" style={{ color: 'var(--warn, var(--ink-3))' }}>{tr('التسجيل المجاني في هذا المسار غير متاح بعد.', 'Free enrollment is not open for this track yet.')}</p>
          )}
        </div>

        {/* Package option: only if the track has a paid package */}
        {hasPackage && (
          <div className="mb-3 rounded-xl p-4" style={{ ...card, borderColor: 'var(--brand)' }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold"><Package size={18} style={{ color: 'var(--brand)' }} />{tr('باكدج المسار الكامل', 'Full track package')}</div>
              <b style={{ color: 'var(--brand)' }}>{formatCurrency(toMarketAmount(price!, market), market, locale)}</b>
            </div>
            <ul className="mb-3 mt-2 space-y-1.5">
              {[tr('وصول كامل لجميع الكورسات', 'Full access to every course'), tr('شهادة إتمام المسار', 'Track completion certificate')].map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink-2)' }}>
                  <CheckCircle size={15} style={{ color: 'var(--good, var(--brand))', flex: 'none' }} />{p}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handlePaid}
              disabled={!!loading}
              className={primaryBtn}
              style={{ background: 'transparent', color: 'var(--brand)', border: '1px solid var(--brand)', opacity: loading ? 0.6 : 1 }}
            >
              {loading === 'paid' && <Loader2 size={16} className="animate-spin" />}
              {tr('اشترك الآن', 'Subscribe now')}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-3 flex items-start gap-2 rounded-xl p-3 text-sm" style={{ background: 'var(--error-subtle)', color: 'var(--error)' }} role="alert">
            <AlertCircle size={16} className="mt-0.5 flex-none" />{error}
          </p>
        )}

        {!loggedIn && (
          <button
            type="button"
            onClick={() => router.push(`/${locale}/login?redirect=${encodeURIComponent(currentPath)}`)}
            className="mt-2 w-full text-center text-sm font-semibold"
            style={{ color: 'var(--brand)' }}
          >
            {tr('لدي حساب بالفعل', 'I already have an account')}
          </button>
        )}

        <button type="button" onClick={onClose} disabled={!!loading} className="mt-3 w-full text-center text-sm" style={{ color: 'var(--ink-3)' }}>
          {tr('إلغاء', 'Cancel')}
        </button>
      </div>
    </div>
  )
}
