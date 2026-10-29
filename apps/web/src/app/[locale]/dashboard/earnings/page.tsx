'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { get, post } from '@/lib/api'
import { formatMoney } from '@/lib/market'
import { browserTimeZone } from '@/lib/time'
import {
  AlertCircle,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  TrendingUp,
  Wallet,
} from 'lucide-react'

interface RecentSession {
  id: string
  sessionName?: string | null
  clientName?: string | null
  studentName?: string | null
  amount?: number | null
  price?: number | null
  status?: string | null
  paymentStatus?: string | null
  date?: string | null
  scheduledAt?: string | null
}

interface EarningsData {
  totalEarned: number
  pendingEarnings: number
  refunded: number
  available: number
  sessionsCount: number
  recentSessions: RecentSession[]
}

function normaliseEarnings(raw: any): EarningsData {
  const totalEarned = Number(raw?.totalEarned ?? raw?.totalEarnings ?? raw?.total ?? 0) || 0
  const pendingEarnings = Number(raw?.pendingEarnings ?? raw?.pendingAmount ?? raw?.pending ?? 0) || 0
  const refunded = Number(raw?.refunded ?? 0) || 0
  const available = Number(raw?.available ?? raw?.availableBalance ?? totalEarned - refunded) || 0
  const recentSessions: RecentSession[] = Array.isArray(raw?.recentSessions)
    ? raw.recentSessions
    : Array.isArray(raw?.sessions)
      ? raw.sessions
      : []

  return {
    totalEarned,
    pendingEarnings,
    refunded,
    available: Math.max(0, available),
    sessionsCount: Number(raw?.sessionsCount ?? recentSessions.filter((s) => s.status === 'COMPLETED').length) || 0,
    recentSessions,
  }
}

export default function EarningsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [transferAmount, setTransferAmount] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const money = useCallback((amount: number) => formatMoney(amount), [])

  const fetchEarnings = useCallback(async () => {
    setError(null)
    try {
      const response = await get('/sessions/my-earnings')
      setData(normaliseEarnings(response.data?.data ?? response.data))
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.message ||
        (isAr ? 'تعذر تحميل بيانات الأرباح' : 'Failed to load earnings')
      setError(Array.isArray(message) ? message.join(' - ') : message)
      setData(normaliseEarnings(null))
    } finally {
      setLoading(false)
    }
  }, [isAr])

  useEffect(() => {
    setMounted(true)
    void fetchEarnings()
  }, [fetchEarnings])

  const handleTransfer = async () => {
    const amount = Number(transferAmount)
    if (!amount || amount <= 0) return

    if (amount > (data?.available || 0)) {
      setMessage({
        type: 'error',
        text: isAr ? 'المبلغ أكبر من أرباحك المتاحة' : 'Amount exceeds your available earnings',
      })
      return
    }

    setTransferring(true)
    try {
      await post('/wallet/transfer-from-earnings', { amount })
      setMessage({
        type: 'success',
        text: `${isAr ? 'تم تحويل' : 'Transferred'} ${money(amount)} ${isAr ? 'إلى محفظتك بنجاح' : 'to your wallet'}`,
      })
      setTransferAmount('')
      await fetchEarnings()
    } catch (transferError: any) {
      setMessage({
        type: 'error',
        text:
          transferError?.response?.data?.message ||
          (isAr ? 'فشل تحويل المبلغ' : 'Transfer failed'),
      })
    } finally {
      setTransferring(false)
      window.setTimeout(() => setMessage(null), 4000)
    }
  }

  const stats = useMemo(
    () => [
      {
        label: isAr ? 'إجمالي الأرباح' : 'Total earned',
        value: money(data?.totalEarned || 0),
        color: 'var(--primary)',
        background: 'var(--primary-subtle)',
        icon: DollarSign,
      },
      {
        label: isAr ? 'الرصيد المتاح' : 'Available to transfer',
        value: money(data?.available || 0),
        color: 'var(--accent)',
        background: 'var(--accent-light)',
        icon: Wallet,
      },
      {
        label: isAr ? 'قيد الانتظار' : 'Pending',
        value: money(data?.pendingEarnings || 0),
        color: 'var(--warning)',
        background: 'var(--warning-subtle)',
        icon: Clock,
      },
      {
        label: isAr ? 'الجلسات المكتملة' : 'Completed sessions',
        value: String(data?.sessionsCount || 0),
        color: 'var(--foreground)',
        background: 'var(--surface)',
        icon: TrendingUp,
      },
    ],
    [data, isAr, money],
  )

  if (!mounted || loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[50vh] flex-col items-center justify-center gap-2"
        style={{ background: 'var(--background)', color: 'var(--muted)', fontFamily: 'var(--font-body)' }}
      >
        <Loader2 size={24} className="animate-spin" />
        <p className="text-sm font-semibold">{isAr ? 'جاري تحميل الأرباح...' : 'Loading earnings...'}</p>
      </div>
    )
  }

  const sessions = data?.recentSessions ?? []

  return (
    <div
      dir="rtl"
      className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6"
      style={{ background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}
    >
      <header className="mb-6">
        <h1 className="text-2xl font-black sm:text-3xl" style={{ fontFamily: 'var(--font-madinet)' }}>
          {isAr ? 'أرباحي' : 'My earnings'}
        </h1>
        <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--muted)' }}>
          {isAr
            ? 'إيراداتك من الجلسات الاستشارية، محدثة من سجل الجلسات'
            : 'Your consulting revenue, sourced from the sessions ledger'}
        </p>
      </header>

      {error && (
        <div
          className="mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm font-semibold"
          style={{ background: 'var(--error-subtle)', borderColor: 'var(--error)', color: 'var(--error)' }}
          role="alert"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {message && (
        <div
          className="mb-5 flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold"
          style={{
            background: message.type === 'success' ? 'var(--accent-light)' : 'var(--error-subtle)',
            borderColor: message.type === 'success' ? 'var(--accent)' : 'var(--error)',
            color: message.type === 'success' ? 'var(--accent)' : 'var(--error)',
          }}
        >
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-2xl border p-3 sm:p-4"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: stat.background, color: stat.color }}
                >
                  <Icon size={15} />
                </span>
                <p className="text-[10px] font-bold leading-tight sm:text-[11px]" style={{ color: 'var(--muted)' }}>
                  {stat.label}
                </p>
              </div>
              <p className="break-words text-sm font-black sm:text-base" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          )
        })}
      </section>

      <section
        className="mb-5 rounded-2xl border p-4 sm:p-5"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="mb-4 flex items-center gap-2 text-sm font-black">
          <ArrowDownLeft size={17} style={{ color: 'var(--primary)' }} />
          {isAr ? 'تحويل إلى المحفظة' : 'Transfer to wallet'}
        </h2>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="number"
            min="0"
            step="0.01"
            value={transferAmount}
            onChange={(event) => setTransferAmount(event.target.value)}
            placeholder={
              isAr
                ? `الحد الأقصى: ${money(data?.available || 0)}`
                : `Max: ${money(data?.available || 0)}`
            }
            className="min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm outline-none"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
          <button
            type="button"
            onClick={handleTransfer}
            disabled={transferring || !transferAmount}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              cursor: transferring || !transferAmount ? 'not-allowed' : 'pointer',
              opacity: transferring || !transferAmount ? 0.5 : 1,
            }}
          >
            {transferring ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
            {transferring ? (isAr ? 'جاري التحويل...' : 'Transferring...') : isAr ? 'تحويل' : 'Transfer'}
          </button>
        </div>

        <p className="mt-3 text-[11px]" style={{ color: 'var(--muted)' }}>
          {isAr
            ? 'يتم تحويل المبلغ من الأرباح المتاحة إلى محفظتك فوراً'
            : 'The amount moves from available earnings into your wallet immediately'}
        </p>
      </section>

      <section
        className="overflow-hidden rounded-2xl border"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="flex items-center gap-2 text-sm font-black">
            <DollarSign size={17} style={{ color: 'var(--primary)' }} />
            {isAr ? 'سجل الجلسات' : 'Sessions history'}
          </h2>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
            {isAr ? `${sessions.length} جلسة` : `${sessions.length} sessions`}
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <DollarSign size={40} style={{ color: 'var(--muted)', opacity: 0.3, margin: '0 auto 12px' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>
              {isAr ? 'لا توجد جلسات بعد' : 'No sessions yet'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y sm:hidden" style={{ borderColor: 'var(--border)' }}>
              {sessions.map((session) => (
                <div key={session.id} className="p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-black">
                      {session.clientName || session.studentName || (isAr ? 'عميل' : 'Client')}
                    </p>
                    <span className="shrink-0 text-xs font-black" style={{ color: 'var(--accent)' }}>
                      {money(Number(session.amount ?? session.price ?? 0))}
                    </span>
                  </div>
                  <p className="truncate text-[11px]" style={{ color: 'var(--muted)' }}>
                    {session.sessionName || (isAr ? 'جلسة استشارية' : 'Consulting session')}
                  </p>
                  <p className="mt-1 text-[10px]" style={{ color: 'var(--muted)' }}>
                    {session.date || session.scheduledAt
                      ? new Date(session.date || session.scheduledAt || '').toLocaleDateString(
                          isAr ? 'ar-EG-u-ca-gregory' : 'en-US-u-ca-gregory',
                          { year: 'numeric', month: 'short', day: 'numeric', timeZone: browserTimeZone(), calendar: 'gregory' },
                        )
                      : '—'}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full border-collapse text-right">
                <thead>
                  <tr className="border-b text-[11px]" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
                    <th className="p-3 font-bold">{isAr ? 'العميل' : 'Client'}</th>
                    <th className="p-3 font-bold">{isAr ? 'الجلسة' : 'Session'}</th>
                    <th className="p-3 text-center font-bold">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="p-3 text-center font-bold">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="p-3 text-center font-bold">{isAr ? 'المبلغ' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b text-xs last:border-0" style={{ borderColor: 'var(--border)' }}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-black"
                            style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}
                          >
                            {(session.clientName || session.studentName || '?').charAt(0).toUpperCase()}
                          </span>
                          <span className="font-bold">
                            {session.clientName || session.studentName || (isAr ? 'عميل' : 'Client')}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-[220px] truncate p-3" style={{ color: 'var(--muted)' }}>
                        {session.sessionName || (isAr ? 'جلسة استشارية' : 'Consulting session')}
                      </td>
                      <td className="p-3 text-center" style={{ color: 'var(--muted)' }}>
                        {session.date || session.scheduledAt
                          ? new Date(session.date || session.scheduledAt || '').toLocaleDateString(
                              isAr ? 'ar-EG-u-ca-gregory' : 'en-US-u-ca-gregory',
                              { year: 'numeric', month: 'short', day: 'numeric', timeZone: browserTimeZone(), calendar: 'gregory' },
                            )
                          : '—'}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            borderColor: session.status === 'COMPLETED' ? 'var(--accent)' : 'var(--border)',
                            background: session.status === 'COMPLETED' ? 'var(--accent-light)' : 'var(--surface)',
                            color: session.status === 'COMPLETED' ? 'var(--accent)' : 'var(--muted)',
                          }}
                        >
                          {session.status || '—'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-black" style={{ color: 'var(--accent)' }}>
                        {Number(session.amount ?? session.price ?? 0) > 0
                          ? money(Number(session.amount ?? session.price ?? 0))
                          : isAr
                            ? 'مجاني'
                            : 'Free'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--surface)' }}>
                    <td className="p-3 text-xs font-black" colSpan={4}>
                      {isAr ? 'الإجمالي' : 'Total'}
                    </td>
                    <td className="p-3 text-center text-sm font-black" style={{ color: 'var(--primary)' }}>
                      {money(data?.totalEarned || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
