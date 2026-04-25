'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { get } from '../../../../lib/api'
import {
  DollarSign, TrendingUp, CreditCard, Calendar,
  CheckCircle2, XCircle, Clock, BarChart2,
} from 'lucide-react'

export default function AdminRevenuePage() {
  const { theme } = useTheme()
  const locale = useLocale()
  const isDark = theme === 'dark'
  const isAr = locale === 'ar'
  const [tab, setTab] = useState<'payments' | 'sessions'>('payments')

  const formatPrice = (amount: number) => {
    if (!amount || amount === 0) return isAr ? 'مجاني' : 'Free'
    return isAr ? `${amount.toLocaleString('ar-SA')} ر.س` : `${amount.toLocaleString('en-US')} SAR`
  }

  const { data: paymentsData, isLoading: loadingP } = useQuery({
    queryKey: ['admin-payments-confirmed'],
    queryFn: async () => {
      const res = await get('/admin/payments')
      return res?.data ?? { data: [], total: 0 }
    },
  })

  const { data: sessionsData, isLoading: loadingS } = useQuery({
    queryKey: ['admin-sessions-paid'],
    queryFn: async () => {
      const res = await get('/admin/sessions')
      return res?.data ?? { data: [] }
    },
  })

  const allPayments: any[] = paymentsData?.data ?? []
  const payments = allPayments.filter((p) => p.status === 'SUCCESS' || p.status === 'COMPLETED')

  const allSessions: any[] = sessionsData?.data ?? []
  const paidSessions = allSessions.filter((s) => s.paymentStatus === 'PAID')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const paymentTotal = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
  const sessionTotal = paidSessions.reduce((sum: number, s: any) => sum + Number(s.price || 0), 0)
  const total = paymentTotal + sessionTotal

  const monthlyPayments = payments
    .filter((p) => new Date(p.createdAt) >= monthStart)
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
  const monthlySessions = paidSessions
    .filter((s) => new Date(s.createdAt) >= monthStart)
    .reduce((sum: number, s: any) => sum + Number(s.price || 0), 0)
  const monthlyRevenue = monthlyPayments + monthlySessions

  const totalTransactions = payments.length + paidSessions.length
  const avgOrder = totalTransactions > 0 ? total / totalTransactions : 0

  const userName = (u: any) =>
    u?.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u?.email ?? '—'

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ─── Header ─── */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
          <DollarSign style={{ color: '#5120c8' }} />
          {isAr ? 'الإيرادات المؤكدة' : 'Confirmed Revenue'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          {isAr ? 'مدفوعات مؤكدة + جلسات مدفوعة' : 'Confirmed payments + paid sessions'}
        </p>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: isAr ? 'إجمالي الإيرادات' : 'Total Revenue', value: formatPrice(total), icon: DollarSign, color: '#10b981' },
          { label: isAr ? 'إيرادات هذا الشهر' : 'Monthly Revenue', value: formatPrice(monthlyRevenue), icon: TrendingUp, color: '#f59e0b' },
          { label: isAr ? 'عدد المدفوعات' : 'Transactions', value: `${totalTransactions}`, icon: CreditCard, color: '#5120c8' },
          { label: isAr ? 'متوسط قيمة الطلب' : 'Avg Order Value', value: formatPrice(avgOrder), icon: BarChart2, color: '#8b5cf6' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div
              key={i}
              className="rounded-xl border p-5 transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{
                  background: isDark ? `${s.color}20` : `${s.color}10`,
                }}
              >
                <Icon size={20} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{s.value}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* ─── Revenue Breakdown ─── */}
      <div
        className="rounded-xl border p-5"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <BarChart2 size={18} style={{ color: '#5120c8' }} />
          {isAr ? 'توزيع الإيرادات' : 'Revenue Breakdown'}
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div
            className="rounded-lg p-4 border"
            style={{ borderColor: 'var(--border)', background: isDark ? 'rgba(81,32,200,0.06)' : 'rgba(81,32,200,0.03)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{isAr ? 'إيرادات الكورسات' : 'Course Revenue'}</span>
              <CreditCard size={16} style={{ color: '#5120c8' }} />
            </div>
            <p className="text-xl font-bold" style={{ color: '#5120c8' }}>{formatPrice(paymentTotal)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{payments.length} {isAr ? 'عملية دفع' : 'payments'}</p>
          </div>
          <div
            className="rounded-lg p-4 border"
            style={{ borderColor: 'var(--border)', background: isDark ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.03)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{isAr ? 'إيرادات الجلسات' : 'Session Revenue'}</span>
              <Calendar size={16} style={{ color: '#8b5cf6' }} />
            </div>
            <p className="text-xl font-bold" style={{ color: '#8b5cf6' }}>{formatPrice(sessionTotal)}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{paidSessions.length} {isAr ? 'جلسة مدفوعة' : 'paid sessions'}</p>
          </div>
        </div>
      </div>

      {/* ─── Tab Toggle ─── */}
      <div className="flex gap-2">
        {[
          { key: 'payments' as const, label: isAr ? 'مدفوعات الكورسات' : 'Course Payments' },
          { key: 'sessions' as const, label: isAr ? 'الجلسات المدفوعة' : 'Paid Sessions' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? '#5120c8' : 'var(--surface)',
              color: tab === t.key ? '#fff' : 'var(--muted)',
              border: tab === t.key ? '1px solid #5120c8' : '1px solid var(--border)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Payments Table ─── */}
      {tab === 'payments' && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div
            className="p-5 flex items-center gap-2"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>{isAr ? 'مدفوعات الكورسات المؤكدة' : 'Confirmed Course Payments'}</h2>
            <span className="mr-auto text-sm" style={{ color: 'var(--muted)' }}>{payments.length} {isAr ? 'عملية' : 'transactions'}</span>
          </div>
          {loadingP ? (
            <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-t-transparent mb-3"
                style={{ borderColor: '#5120c8', borderTopColor: 'transparent' }}
              />
              <p className="text-sm">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign size={48} style={{ color: 'var(--muted)', opacity: 0.3, margin: '0 auto 12px' }} />
              <p className="font-medium" style={{ color: 'var(--muted)' }}>{isAr ? 'لا توجد مدفوعات مؤكدة' : 'No confirmed payments'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    <th className="p-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>#</th>
                    <th className="p-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{isAr ? 'المستخدم' : 'User'}</th>
                    <th className="p-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{isAr ? 'الكورس' : 'Course'}</th>
                    <th className="p-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{isAr ? 'المبلغ' : 'Amount'}</th>
                    <th className="p-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="p-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{isAr ? 'التاريخ' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any, idx: number) => {
                    const name = userName(p.user)
                    const courseTitle = (isAr ? p.course?.titleAr : p.course?.titleEn) || p.course?.titleEn || '—'
                    return (
                      <tr
                        key={p.id}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <td className="p-3" style={{ color: 'var(--muted)' }}>{idx + 1}</td>
                        <td className="p-3 font-medium" style={{ color: 'var(--foreground)' }}>{name}</td>
                        <td className="p-3" style={{ color: 'var(--muted)' }}>{courseTitle}</td>
                        <td className="p-3 font-bold" style={{ color: '#10b981' }}>{formatPrice(Number(p.amount))}</td>
                        <td className="p-3">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{
                              background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)',
                              color: isDark ? '#34d399' : '#059669',
                              border: isDark ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(16,185,129,0.2)',
                            }}
                          >
                            <CheckCircle2 size={12} />
                            {p.status === 'SUCCESS' ? (isAr ? 'ناجح' : 'Success') : (isAr ? 'مكتمل' : 'Completed')}
                          </span>
                        </td>
                        <td className="p-3 text-xs" style={{ color: 'var(--muted)' }}>
                          {new Date(p.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Sessions Table ─── */}
      {tab === 'sessions' && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div
            className="p-5 flex items-center gap-2"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <Calendar size={18} style={{ color: '#8b5cf6' }} />
            <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>{isAr ? 'الجلسات المدفوعة' : 'Paid Sessions'}</h2>
            <span className="mr-auto text-sm" style={{ color: 'var(--muted)' }}>{paidSessions.length} {isAr ? 'جلسة' : 'sessions'}</span>
          </div>
          {loadingS ? (
            <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>
              <div
                className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-t-transparent mb-3"
                style={{ borderColor: '#5120c8', borderTopColor: 'transparent' }}
              />
              <p className="text-sm">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
            </div>
          ) : paidSessions.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar size={48} style={{ color: 'var(--muted)', opacity: 0.3, margin: '0 auto 12px' }} />
              <p className="font-medium" style={{ color: 'var(--muted)' }}>{isAr ? 'لا توجد جلسات مدفوعة' : 'No paid sessions'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    <th className="p-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>#</th>
                    <th className="p-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{isAr ? 'المستخدم' : 'User'}</th>
                    <th className="p-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{isAr ? 'المستشار' : 'Consultant'}</th>
                    <th className="p-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{isAr ? 'الموضوع' : 'Topic'}</th>
                    <th className="p-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{isAr ? 'المبلغ' : 'Amount'}</th>
                    <th className="p-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{isAr ? 'التاريخ' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {paidSessions.map((s: any, idx: number) => {
                    const student = userName(s.student)
                    const consultant = userName(s.consultant)
                    return (
                      <tr
                        key={s.id}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                      >
                        <td className="p-3" style={{ color: 'var(--muted)' }}>{idx + 1}</td>
                        <td className="p-3 font-medium" style={{ color: 'var(--foreground)' }}>{student}</td>
                        <td className="p-3" style={{ color: 'var(--muted)' }}>{consultant}</td>
                        <td className="p-3" style={{ color: 'var(--muted)' }}>{s.topic || '—'}</td>
                        <td className="p-3 font-bold" style={{ color: '#8b5cf6' }}>{formatPrice(Number(s.price))}</td>
                        <td className="p-3 text-xs" style={{ color: 'var(--muted)' }}>
                          {new Date(s.scheduledAt || s.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Revenue Summary ─── */}
      <div
        className="rounded-xl p-5 border"
        style={{
          background: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)',
          borderColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)',
        }}
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 size={22} style={{ color: '#10b981' }} />
          <div>
            <p className="font-bold" style={{ color: isDark ? '#34d399' : '#059669' }}>{isAr ? 'ملخص الإيرادات' : 'Revenue Summary'}</p>
            <p className="text-sm mt-1" style={{ color: isDark ? 'rgba(52,211,153,0.7)' : 'rgba(5,150,105,0.7)' }}>
              {isAr ? 'كورسات' : 'Courses'}: {formatPrice(paymentTotal)} | {isAr ? 'جلسات' : 'Sessions'}: {formatPrice(sessionTotal)} | {isAr ? 'الإجمالي' : 'Total'}: {formatPrice(total)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
