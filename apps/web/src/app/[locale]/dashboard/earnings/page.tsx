'use client'
import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { DollarSign, Clock, Wallet, Loader2, ArrowDownLeft, CheckCircle } from 'lucide-react'
import { post } from '@/lib/api'

export default function EarningsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [transferAmount, setTransferAmount] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [msg, setMsg] = useState<{type:'success'|'error', text:string} | null>(null)

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('deveway_token') || localStorage.getItem('token') || ''
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/wallet/coach-earnings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const res = await r.json()
      setData(res?.data || res)
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchEarnings()
  }, [])

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount)
    if (!amount || amount <= 0) return
    const maxTransfer = data?.availableBalance || data?.totalEarnings || 0
    if (amount > maxTransfer) {
      setMsg({ type: 'error', text: isAr ? 'المبلغ أكبر من أرباحك المتاحة' : 'Amount exceeds available earnings' })
      return
    }
    setTransferring(true)
    try {
      await post('/wallet/transfer-from-earnings', { amount })
      setMsg({ type: 'success', text: `${isAr ? 'تم تحويل' : 'Transferred'} ${amount} ${isAr ? 'ر.س إلى محفظتك بنجاح' : 'SAR to your wallet'}` })
      setTransferAmount('')
      await fetchEarnings()
    } catch(e: any) {
      setMsg({ type: 'error', text: e.response?.data?.message || (isAr ? 'فشل التحويل' : 'Transfer failed') })
    } finally {
      setTransferring(false)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="p-8 text-center text-gray-400">
        <Loader2 size={24} className="inline animate-spin mb-2" />
        <p>{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    )
  }

  const sessions = data?.transactions || []

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <h1 className="text-2xl font-bold mb-2">
        {isAr ? 'أرباحي' : 'My Earnings'}
      </h1>
      <p className="text-gray-400 text-sm mb-6">
        {isAr ? 'إيراداتك من الجلسات الاستشارية المؤكدة' : 'Revenue from confirmed consulting sessions'}
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 w-full mb-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800" style={{ width: '100%', boxSizing: 'border-box', padding: 'clamp(12px, 3vw, 20px)' }}>
          <p className="text-gray-400 mb-1" style={{ fontSize: 'clamp(10px, 2.5vw, 13px)' }}>
            {isAr ? 'إجمالي الأرباح' : 'Total Earnings'}
          </p>
          <p className="font-bold text-purple-400" style={{ fontSize: 'clamp(16px, 4vw, 22px)' }}>
            {(data?.totalEarnings || 0).toFixed(2)}
            <span className="mr-1" style={{ fontSize: 'clamp(11px, 2.5vw, 14px)' }}>{isAr ? ' ر.س' : ' SAR'}</span>
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800" style={{ width: '100%', boxSizing: 'border-box', padding: 'clamp(12px, 3vw, 20px)' }}>
          <p className="text-gray-400 mb-1" style={{ fontSize: 'clamp(10px, 2.5vw, 13px)' }}>
            {isAr ? 'الرصيد المتاح للسحب' : 'Available to Transfer'}
          </p>
          <p className="font-bold text-green-400" style={{ fontSize: 'clamp(16px, 4vw, 22px)' }}>
            {(data?.availableBalance || 0).toFixed(2)}
            <span className="mr-1" style={{ fontSize: 'clamp(11px, 2.5vw, 14px)' }}>{isAr ? ' ر.س' : ' SAR'}</span>
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800" style={{ width: '100%', boxSizing: 'border-box', padding: 'clamp(12px, 3vw, 20px)' }}>
          <p className="text-gray-400 mb-1" style={{ fontSize: 'clamp(10px, 2.5vw, 13px)' }}>
            {isAr ? 'قيد الانتظار' : 'Pending'}
          </p>
          <p className="font-bold text-yellow-400" style={{ fontSize: 'clamp(16px, 4vw, 22px)' }}>
            {(data?.pendingAmount || 0).toFixed(2)}
            <span className="mr-1" style={{ fontSize: 'clamp(11px, 2.5vw, 14px)' }}>{isAr ? ' ر.س' : ' SAR'}</span>
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800" style={{ width: '100%', boxSizing: 'border-box', padding: 'clamp(12px, 3vw, 20px)' }}>
          <p className="text-gray-400 mb-1" style={{ fontSize: 'clamp(10px, 2.5vw, 13px)' }}>
            {isAr ? 'الجلسات المكتملة' : 'Completed Sessions'}
          </p>
          <p className="font-bold text-blue-400" style={{ fontSize: 'clamp(16px, 4vw, 22px)' }}>
            {sessions.length}
          </p>
        </div>
      </div>

      {/* Transfer to Wallet */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <ArrowDownLeft size={18} className="text-purple-400" />
          {isAr ? 'تحويل إلى المحفظة' : 'Transfer to Wallet'}
        </h3>

        {msg && (
          <div className={`p-3 rounded-lg mb-4 text-sm font-semibold flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-green-900/30 text-green-400 border border-green-800'
              : 'bg-red-900/30 text-red-400 border border-red-800'
          }`}>
            {msg.type === 'success' ? <CheckCircle size={16} /> : null}
            {msg.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <input
            type="number"
            value={transferAmount}
            onChange={e => setTransferAmount(e.target.value)}
            placeholder={isAr
              ? `الحد الأقصى: ${(data?.availableBalance || 0).toFixed(2)} ر.س`
              : `Max: ${(data?.availableBalance || 0).toFixed(2)} SAR`}
            className="px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-700 text-sm outline-none focus:border-purple-500 transition-colors"
            style={{ flex: 1, minWidth: 0, boxSizing: 'border-box' }}
          />
          <button
            onClick={handleTransfer}
            disabled={transferring || !transferAmount}
            className="py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-purple-600 hover:bg-purple-500 text-white"
            style={{ flexShrink: 0, whiteSpace: 'nowrap', padding: '0 16px' }}
          >
            {transferring ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Wallet size={16} />
            )}
            {transferring
              ? (isAr ? 'جاري التحويل...' : 'Transferring...')
              : (isAr ? 'تحويل' : 'Transfer')}
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-3">
          {isAr ? 'سيتم تحويل المبلغ من أرباحك إلى محفظتك فورا' : 'Amount will be transferred from earnings to your wallet immediately'}
        </p>
      </div>

      {/* Sessions Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-semibold flex items-center gap-2">
            <DollarSign size={18} className="text-purple-400" />
            {isAr ? 'سجل الجلسات' : 'Sessions History'}
          </h2>
        </div>
        {sessions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <DollarSign size={40} className="mx-auto mb-3 opacity-30" />
            <p>{isAr ? 'لا توجد جلسات مكتملة بعد' : 'No completed sessions yet'}</p>
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ minWidth: '500px', width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-sm">
                  <th className="p-4 text-right">{isAr ? 'العميل' : 'Client'}</th>
                  <th className="p-4 text-right">{isAr ? 'الجلسة' : 'Session'}</th>
                  <th className="p-4 text-center">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="p-4 text-center">{isAr ? 'المبلغ' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session: any) => (
                  <tr key={session.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-900 flex items-center justify-center text-purple-300 font-bold text-sm flex-shrink-0">
                          {session.clientName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-medium">{session.clientName || (isAr ? 'عميل' : 'Client')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-300">{session.sessionName || '—'}</td>
                    <td className="p-4 text-center text-sm text-gray-400 max-w-[120px]">
                      {session.date
                        ? new Date(session.date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })
                        : '—'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${session.amount > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                        {session.amount > 0
                          ? `${session.amount.toFixed(2)} ${isAr ? 'ر.س' : 'SAR'}`
                          : (isAr ? 'مجاني' : 'Free')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-800/50">
                  <td className="p-4 font-bold" colSpan={3}>
                    {isAr ? 'الإجمالي' : 'Total'}
                  </td>
                  <td className="p-4 text-center text-purple-400 font-bold text-lg">
                    {(data?.totalEarnings || 0).toFixed(2)} {isAr ? 'ر.س' : 'SAR'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
