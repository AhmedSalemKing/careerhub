'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { get, post } from '@/lib/api'
import { formatMoney } from '@/lib/market'
import { browserTimeZone } from '@/lib/time'

function parseSessionDate(raw: unknown): Date | null {
  if (!raw) return null
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw
  if (typeof raw === 'string') { const d = new Date(raw); return isNaN(d.getTime()) ? null : d }
  if (typeof raw === 'object' && (raw as any).$date) { const d = new Date((raw as any).$date); return isNaN(d.getTime()) ? null : d }
  return null
}

const Ic = {
  dollar: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 15} height={p.size ?? 15} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  wallet: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 15} height={p.size ?? 15} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round">
      <path d="M20 12V22H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16v4"/><path d="M20 12a2 2 0 0 0-2 2 2 2 0 0 0 2 2h2v-4z"/><line x1="8" y1="6" x2="8" y2="2"/>
    </svg>
  ),
  clock: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 15} height={p.size ?? 15} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  trending: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 15} height={p.size ?? 15} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  alertCircle: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 15} height={p.size ?? 15} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  check: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 15} height={p.size ?? 15} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  arrowDownLeft: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 15} height={p.size ?? 15} viewBox="0 0 24 24" fill="none" stroke={p.color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round">
      <line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/>
    </svg>
  ),
  spinner: (p: { size?: number }) => (
    <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  ),
}

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

function formatSessionDate(raw: unknown, isAr: boolean): string {
  const d = parseSessionDate(raw)
  if (!d) return '—'
  return d.toLocaleDateString(
    isAr ? 'ar-EG-u-ca-gregory' : 'en-US-u-ca-gregory',
    { year: 'numeric', month: 'short', day: 'numeric', timeZone: browserTimeZone(), calendar: 'gregory' },
  )
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
      const msg =
        requestError?.response?.data?.message ||
        (isAr ? 'تعذر تحميل بيانات الأرباح' : 'Failed to load earnings')
      setError(Array.isArray(msg) ? msg.join(' - ') : msg)
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
        icon: <Ic.dollar size={15} />,
      },
      {
        label: isAr ? 'الرصيد المتاح' : 'Available to transfer',
        value: money(data?.available || 0),
        color: 'var(--accent)',
        background: 'var(--accent-light)',
        icon: <Ic.wallet size={15} />,
      },
      {
        label: isAr ? 'قيد الانتظار' : 'Pending',
        value: money(data?.pendingEarnings || 0),
        color: 'var(--warning)',
        background: 'var(--warning-subtle)',
        icon: <Ic.clock size={15} />,
      },
      {
        label: isAr ? 'الجلسات المكتملة' : 'Completed sessions',
        value: String(data?.sessionsCount || 0),
        color: 'var(--foreground)',
        background: 'var(--surface)',
        icon: <Ic.trending size={15} />,
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
        <Ic.spinner size={24} />
        <p className="text-sm" style={{ fontWeight: 300 }}>{isAr ? 'جاري تحميل الأرباح...' : 'Loading earnings...'}</p>
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
        <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: 'var(--font-madinet)', fontWeight: 900 }}>
          {isAr ? 'أرباحي' : 'My earnings'}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)', fontWeight: 300 }}>
          {isAr
            ? 'إيراداتك من الجلسات الاستشارية، محدثة من سجل الجلسات'
            : 'Your consulting revenue, sourced from the sessions ledger'}
        </p>
      </header>

      {error && (
        <div
          className="mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm"
          style={{ background: 'var(--error-subtle)', borderColor: 'var(--error)', color: 'var(--error)', fontWeight: 500 }}
          role="alert"
        >
          <span className="mt-0.5 shrink-0"><Ic.alertCircle size={17} /></span>
          <span className="break-words">{error}</span>
        </div>
      )}

      {message && (
        <div
          className="mb-5 flex items-center gap-2 rounded-xl border p-3 text-sm"
          style={{
            background: message.type === 'success' ? 'var(--accent-light)' : 'var(--error-subtle)',
            borderColor: message.type === 'success' ? 'var(--accent)' : 'var(--error)',
            color: message.type === 'success' ? 'var(--accent)' : 'var(--error)',
            fontWeight: 500,
          }}
        >
          {message.type === 'success' ? <Ic.check size={16} /> : <Ic.alertCircle size={16} />}
          {message.text}
        </div>
      )}

      <section className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border p-3 sm:p-4"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: stat.background, color: stat.color }}
              >
                {stat.icon}
              </span>
              <p className="text-[10px] leading-tight sm:text-[11px]" style={{ color: 'var(--muted)', fontWeight: 300 }}>
                {stat.label}
              </p>
            </div>
            <p className="break-words text-sm sm:text-base" style={{ color: stat.color, fontWeight: 900 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section
        className="mb-5 rounded-2xl border p-4 sm:p-5"
        style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }}
      >
        <h2 className="mb-4 flex items-center gap-2 text-sm" style={{ fontWeight: 900 }}>
          <span style={{ color: 'var(--primary)' }}><Ic.arrowDownLeft size={17} /></span>
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
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              cursor: transferring || !transferAmount ? 'not-allowed' : 'pointer',
              opacity: transferring || !transferAmount ? 0.5 : 1,
              fontWeight: 900,
            }}
          >
            {transferring ? <Ic.spinner size={16} /> : <Ic.wallet size={16} />}
            {transferring ? (isAr ? 'جاري التحويل...' : 'Transferring...') : isAr ? 'تحويل' : 'Transfer'}
          </button>
        </div>

        <p className="mt-3 text-[11px]" style={{ color: 'var(--muted)', fontWeight: 300 }}>
          {isAr
            ? 'يتم تحويل المبلغ من الأرباح المتاحة إلى محفظتك فوراً'
            : 'The amount moves from available earnings into your wallet immediately'}
        </p>
      </section>

      <section
        className="overflow-hidden rounded-2xl border"
        style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' }}
      >
        <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
          <h2 className="flex items-center gap-2 text-sm" style={{ fontWeight: 900 }}>
            <span style={{ color: 'var(--primary)' }}><Ic.dollar size={17} /></span>
            {isAr ? 'سجل الجلسات' : 'Sessions history'}
          </h2>
          <span className="text-[11px]" style={{ color: 'var(--muted)', fontWeight: 300 }}>
            {isAr ? `${sessions.length} جلسة` : `${sessions.length} sessions`}
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span style={{ color: 'var(--muted)', opacity: 0.3, display: 'block', marginBottom: 12 }}>
              <Ic.dollar size={40} />
            </span>
            <p className="text-sm" style={{ color: 'var(--muted)', fontWeight: 300 }}>
              {isAr ? 'لا توجد جلسات بعد' : 'No sessions yet'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y sm:hidden" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
              {sessions.map((session) => (
                <div key={session.id} className="p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="truncate text-xs" style={{ fontWeight: 900 }}>
                      {session.clientName || session.studentName || (isAr ? 'عميل' : 'Client')}
                    </p>
                    <span className="shrink-0 text-xs" style={{ color: 'var(--accent)', fontWeight: 900 }}>
                      {money(Number(session.amount ?? session.price ?? 0))}
                    </span>
                  </div>
                  <p className="truncate text-[11px]" style={{ color: 'var(--muted)', fontWeight: 300 }}>
                    {session.sessionName || (isAr ? 'جلسة استشارية' : 'Consulting session')}
                  </p>
                  <p className="mt-1 text-[10px]" style={{ color: 'var(--muted)', fontWeight: 300 }}>
                    {formatSessionDate(session.date || session.scheduledAt, isAr)}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full border-collapse text-right">
                <thead>
                  <tr className="border-b text-[11px]" style={{ borderColor: 'rgba(255,255,255,0.10)', color: 'var(--muted)' }}>
                    <th className="p-3" style={{ fontWeight: 500 }}>{isAr ? 'العميل' : 'Client'}</th>
                    <th className="p-3" style={{ fontWeight: 500 }}>{isAr ? 'الجلسة' : 'Session'}</th>
                    <th className="p-3 text-center" style={{ fontWeight: 500 }}>{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="p-3 text-center" style={{ fontWeight: 500 }}>{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="p-3 text-center" style={{ fontWeight: 500 }}>{isAr ? 'المبلغ' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b text-xs last:border-0" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px]"
                            style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', fontWeight: 900 }}
                          >
                            {(session.clientName || session.studentName || '?').charAt(0).toUpperCase()}
                          </span>
                          <span style={{ fontWeight: 500 }}>
                            {session.clientName || session.studentName || (isAr ? 'عميل' : 'Client')}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-[220px] truncate p-3" style={{ color: 'var(--muted)', fontWeight: 300 }}>
                        {session.sessionName || (isAr ? 'جلسة استشارية' : 'Consulting session')}
                      </td>
                      <td className="p-3 text-center" style={{ color: 'var(--muted)', fontWeight: 300 }}>
                        {formatSessionDate(session.date || session.scheduledAt, isAr)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className="rounded-full border px-2 py-0.5 text-[10px]"
                          style={{
                            borderColor: session.status === 'COMPLETED' ? 'var(--accent)' : 'var(--border)',
                            background: session.status === 'COMPLETED' ? 'var(--accent-light)' : 'var(--surface)',
                            color: session.status === 'COMPLETED' ? 'var(--accent)' : 'var(--muted)',
                            fontWeight: 500,
                          }}
                        >
                          {session.status || '—'}
                        </span>
                      </td>
                      <td className="p-3 text-center" style={{ color: 'var(--accent)', fontWeight: 900 }}>
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
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <td className="p-3 text-xs" colSpan={4} style={{ fontWeight: 900 }}>
                      {isAr ? 'الإجمالي' : 'Total'}
                    </td>
                    <td className="p-3 text-center text-sm" style={{ color: 'var(--primary)', fontWeight: 900 }}>
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
