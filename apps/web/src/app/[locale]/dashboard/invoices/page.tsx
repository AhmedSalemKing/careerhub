'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import {
  Receipt, GraduationCap, Video, Wallet, Loader2,
  ChevronLeft, ChevronRight, Filter
} from 'lucide-react'
import { api } from '@/lib/api'

type InvoiceType = 'COURSE' | 'SESSION' | 'WALLET_TOPUP'

type Invoice = {
  id: string
  type: InvoiceType
  itemName: string
  itemId: string | null
  itemThumbnail: string | null
  amount: number
  currency: string
  status: string
  date: string
  reference: string
  metadata: Record<string, any>
}

type Summary = {
  totalSpent: number
  courseCount: number
  sessionCount: number
  walletCount: number
}

const TYPE_CONFIG: Record<InvoiceType, { label: string; labelEn: string; icon: any; color: string; bg: string }> = {
  COURSE:        { label: 'كورس',         labelEn: 'Course',         icon: GraduationCap, color: '#5120C8', bg: 'rgba(81,32,200,0.1)' },
  SESSION:       { label: 'جلسة',          labelEn: 'Session',        icon: Video,         color: '#0EA5E9', bg: 'rgba(14,165,233,0.1)' },
  WALLET_TOPUP:  { label: 'شحن محفظة',     labelEn: 'Wallet Top-up',  icon: Wallet,        color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
}

export default function InvoicesPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<'ALL' | InvoiceType>('ALL')
  const limit = 20

  const fetchInvoices = async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/payments/my/invoices', {
        params: { page: p, limit }
      })
      const body = res?.data?.data ?? res?.data ?? {}
      setInvoices(Array.isArray(body.items) ? body.items : [])
      setSummary(body.summary ?? null)
      setTotal(body.total ?? 0)
      setTotalPages(body.totalPages ?? 1)
    } catch (e: any) {
      console.error('[Invoices] fetch error:', e)
      setError(isAr ? 'فشل تحميل سجل المدفوعات' : 'Failed to load invoice history')
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices(page).catch(() => {})
  }, [page])

  const filtered = filter === 'ALL'
    ? invoices
    : invoices.filter(i => i.type === filter)

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(
        isAr ? 'ar-EG-u-ca-gregory' : 'en-US',
        { year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit' }
      )
    } catch { return '—' }
  }

  return (
    <div className="space-y-6" style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center"
            style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'rgba(81,32,200,0.1)'
            }}>
            <Receipt size={22} style={{ color: '#5120C8' }} />
          </div>
          <div>
            <h1 className="font-bold text-xl text-foreground">
              {isAr ? 'تاريخ المدفوعات' : 'Payment History'}
            </h1>
            <p className="text-sm text-[color:var(--muted)]">
              {isAr ? 'سجل شامل لكل عمليات الدفع والشحن' : 'Complete history of all payments and top-ups'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            label={isAr ? 'إجمالي المدفوعات' : 'Total Spent'}
            value={`${summary.totalSpent.toFixed(2)} ${isAr ? 'ر.س' : 'SAR'}`}
            color="#5120C8"
            bg="rgba(81,32,200,0.08)"
          />
          <SummaryCard
            label={isAr ? 'الكورسات' : 'Courses'}
            value={String(summary.courseCount)}
            color="#5120C8"
            bg="rgba(81,32,200,0.08)"
          />
          <SummaryCard
            label={isAr ? 'الجلسات' : 'Sessions'}
            value={String(summary.sessionCount)}
            color="#0EA5E9"
            bg="rgba(14,165,233,0.08)"
          />
          <SummaryCard
            label={isAr ? 'شحن المحفظة' : 'Wallet Top-ups'}
            value={String(summary.walletCount)}
            color="#10B981"
            bg="rgba(16,185,129,0.08)"
          />
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} style={{ color: 'var(--muted)' }} />
        {([
          { id: 'ALL' as const,         label: isAr ? 'الكل' : 'All' },
          { id: 'COURSE' as const,      label: isAr ? 'كورسات' : 'Courses' },
          { id: 'SESSION' as const,     label: isAr ? 'جلسات' : 'Sessions' },
          { id: 'WALLET_TOPUP' as const, label: isAr ? 'شحن محفظة' : 'Top-ups' },
        ]).map(tab => {
          const active = filter === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: '7px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                border: active ? '1px solid rgba(81,32,200,0.4)' : '1px solid var(--border)',
                background: active ? 'rgba(81,32,200,0.1)' : 'var(--surface)',
                color: active ? '#5120C8' : 'var(--muted)',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Table / List */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin" size={28} style={{ color: '#5120C8' }} />
            <p className="text-sm text-[color:var(--muted)]">
              {isAr ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-[color:var(--error)]">{error}</p>
            <button
              onClick={() => fetchInvoices(page)}
              style={{
                padding: '8px 20px', borderRadius: '10px',
                background: 'rgba(81,32,200,0.1)',
                color: '#5120C8', border: '1px solid rgba(81,32,200,0.3)',
                fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              }}
            >
              {isAr ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(81,32,200,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Receipt size={24} style={{ color: '#5120C8' }} />
            </div>
            <p className="font-semibold text-foreground">
              {isAr ? 'لا توجد مدفوعات بعد' : 'No payments yet'}
            </p>
            <p className="text-sm text-[color:var(--muted)]">
              {isAr
                ? 'ستظهر هنا كل عمليات الدفع والشحن التي قمت بها'
                : 'Your payment history will appear here'}
            </p>
            <Link
              href={`/${locale}/courses`}
              style={{
                padding: '9px 22px', borderRadius: '10px',
                background: '#5120C8', color: '#fff',
                fontSize: '13px', fontWeight: 700,
                textDecoration: 'none', marginTop: '6px',
              }}
            >
              {isAr ? 'تصفح الكورسات' : 'Browse Courses'}
            </Link>
          </div>
        ) : (
          <div>
            {filtered.map((inv, idx) => {
              const cfg = TYPE_CONFIG[inv.type]
              const Icon = cfg.icon
              return (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 p-4 transition-colors"
                  style={{
                    borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: '42px', height: '42px',
                      borderRadius: '10px',
                      background: cfg.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} style={{ color: cfg.color }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {inv.itemName}
                      </p>
                      <span style={{
                        fontSize: '11px', fontWeight: 600,
                        padding: '2px 8px', borderRadius: '20px',
                        background: cfg.bg, color: cfg.color,
                      }}>
                        {isAr ? cfg.label : cfg.labelEn}
                      </span>
                    </div>
                    <p className="text-xs text-[color:var(--muted)] mt-1">
                      {formatDate(inv.date)}
                    </p>
                    {inv.type === 'SESSION' && inv.metadata?.consultantName && (
                      <p className="text-xs text-[color:var(--muted)] mt-0.5">
                        {isAr ? 'المستشار:' : 'Consultant:'} {inv.metadata.consultantName}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-base" style={{ color: cfg.color }}>
                      {inv.amount.toFixed(2)}
                      <span className="text-xs mr-1" style={{ color: 'var(--muted)' }}>
                        {' '}{isAr ? 'ر.س' : 'SAR'}
                      </span>
                    </p>
                    <p className="text-[10px] font-mono text-[color:var(--muted)] mt-0.5">
                      {inv.reference.slice(-8).toUpperCase()}
                    </p>
                  </div>
                </div>
              )
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4"
                style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '10px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                    fontSize: '13px', fontWeight: 600,
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    opacity: page <= 1 ? 0.4 : 1,
                  }}
                >
                  <ChevronRight size={14} />
                  {isAr ? 'السابق' : 'Previous'}
                </button>
                <span className="text-xs text-[color:var(--muted)]">
                  {isAr
                    ? `صفحة ${page} من ${totalPages} · إجمالي ${total}`
                    : `Page ${page} of ${totalPages} · ${total} total`}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '10px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                    fontSize: '13px', fontWeight: 600,
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    opacity: page >= totalPages ? 0.4 : 1,
                  }}
                >
                  {isAr ? 'التالي' : 'Next'}
                  <ChevronLeft size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}

function SummaryCard({
  label, value, color, bg
}: { label: string; value: string; color: string; bg: string }) {
  return (
    <div style={{
      background: bg,
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '16px',
    }}>
      <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="font-bold text-lg" style={{ color }}>{value}</p>
    </div>
  )
}
