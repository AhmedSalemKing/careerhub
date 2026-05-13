'use client'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { DollarSign, ArrowDownLeft, Wallet, Clock, Loader2 } from 'lucide-react'
import { post } from '@/lib/api'

export default function EarningsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [transferAmount, setTransferAmount] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [msg, setMsg] = useState<{type:'success'|'error', text:string} | null>(null)
  const [earnings, setEarnings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
    const token = localStorage.getItem('deveway_token') ||
      localStorage.getItem('token') || ''

    fetch(`${apiBase}/wallet/coach-earnings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setEarnings(d?.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount)
    if (!amount || amount <= 0) return
    if (amount > (earnings?.totalEarnings || 0)) {
      setMsg({ type: 'error', text: isAr ? 'المبلغ أكبر من أرباحك المتاحة' : 'Amount exceeds available earnings' })
      return
    }
    setTransferring(true)
    try {
      await post('/wallet/transfer-from-earnings', { amount })
      setMsg({ type: 'success', text: `${isAr ? 'تم تحويل' : 'Transferred'} ${amount} ${isAr ? 'ر.س إلى محفظتك بنجاح' : 'SAR to your wallet'}` })
      setTransferAmount('')
      const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
      const token = localStorage.getItem('deveway_token') || localStorage.getItem('token') || ''
      const r = await fetch(`${apiBase}/wallet/coach-earnings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await r.json()
      setEarnings(d?.data)
    } catch(e: any) {
      setMsg({ type: 'error', text: e.response?.data?.message || (isAr ? 'فشل التحويل' : 'Transfer failed') })
    } finally {
      setTransferring(false)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  const bg = isDark ? '#0d0d0d' : '#fafafa'
  const cardBg = isDark ? '#121212' : '#fff'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px 120px', direction: 'rtl' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#6b7280' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: bg, padding: '32px 24px 120px', direction: 'rtl' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 24, fontWeight: 800, margin: 0 }}>
            {isAr ? 'أرباحي' : 'My Earnings'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            {isAr ? 'إجمالي أرباحك من الجلسات الاستشارية' : 'Total earnings from consulting sessions'}
          </p>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { labelAr: 'إجمالي الأرباح', labelEn: 'Total Earnings', value: earnings?.totalEarnings || 0, icon: <DollarSign size={20} color="#16a34a"/>, color: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.2)' },
            { labelAr: 'قيد الانتظار', labelEn: 'Pending', value: earnings?.pendingAmount || 0, icon: <Clock size={20} color="#f59e0b"/>, color: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
            { labelAr: 'رصيد المحفظة', labelEn: 'Wallet', value: earnings?.walletBalance || 0, icon: <Wallet size={20} color="#5120c8"/>, color: 'rgba(81,32,200,0.1)', border: 'rgba(81,32,200,0.2)' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: cardBg,
              borderRadius: 16, padding: '20px 18px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: stat.color, border: `1px solid ${stat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                {stat.icon}
              </div>
              <div style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 18, fontWeight: 800 }}>
                {(stat.value as number).toFixed(2)} ر.س
              </div>
              <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
                {isAr ? stat.labelAr : stat.labelEn}
              </div>
            </div>
          ))}
        </div>

        {/* Transfer to Wallet */}
        <div style={{
          background: cardBg,
          borderRadius: 20, padding: 24, marginBottom: 24,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
        }}>
          <h3 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowDownLeft size={18} color="#5120c8"/>
            {isAr ? 'تحويل إلى المحفظة' : 'Transfer to Wallet'}
          </h3>
          
          {msg && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 16,
              background: msg.type === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${msg.type === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: msg.type === 'success' ? '#16a34a' : '#ef4444',
              fontSize: 14, fontWeight: 600,
            }}>
              {msg.text}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="number"
              value={transferAmount}
              onChange={e => setTransferAmount(e.target.value)}
              placeholder={isAr ? `الحد الأقصى: ${(earnings?.totalEarnings || 0).toFixed(2)} ر.س` : `Max: ${(earnings?.totalEarnings || 0).toFixed(2)} SAR`}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 10,
                background: isDark ? '#1a1a1a' : '#f8f8fa',
                color: isDark ? '#fff' : '#0d0d0d',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                fontSize: 15, outline: 'none',
              }}
            />
            <button
              onClick={handleTransfer}
              disabled={transferring || !transferAmount}
              style={{
                padding: '12px 24px', borderRadius: 10,
                background: transferring || !transferAmount ? '#374151' : 'linear-gradient(135deg, #5120c8, #7c3aed)',
                color: '#fff', border: 'none', cursor: transferring || !transferAmount ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {transferring ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Wallet size={16} />}
              {transferring ? (isAr ? 'جاري التحويل...' : 'Transferring...') : (isAr ? 'تحويل' : 'Transfer')}
            </button>
          </div>
          <p style={{ color: '#6b7280', fontSize: 12, marginTop: 10 }}>
            {isAr ? 'سيتم تحويل المبلغ من أرباحك إلى محفظتك فورا' : 'Amount will be transferred from earnings to your wallet immediately'}
          </p>
        </div>

        {/* Sessions List */}
        <div style={{
          background: cardBg,
          borderRadius: 20, padding: 24,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
        }}>
          <h3 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            {isAr ? 'سجل الأرباح' : 'Earnings History'}
          </h3>
          {(!earnings?.transactions || earnings.transactions.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
              <DollarSign size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>{isAr ? 'لا توجد أرباح بعد' : 'No earnings yet'}</p>
            </div>
          ) : (
            earnings.transactions.map((tx: any, i: number) => (
              <div key={tx.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 0',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#059669,#34d399)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '0.85rem', fontWeight: 700,
                }}>
                  {tx.clientAvatar
                    ? <img src={tx.clientAvatar} alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}/>
                    : (tx.clientName?.[0] || 'C')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: isDark ? '#f1f5f9' : '#0d0d0d', fontSize: 14, fontWeight: 600 }}>
                    {tx.clientName || (isAr ? 'جلسة استشارية' : 'Consulting session')}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                    {tx.date ? new Date(tx.date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                  </div>
                </div>
                <div style={{ color: '#16a34a', fontWeight: 700, fontSize: 15 }}>
                  +{(tx.amount || 0).toFixed(2)} ر.س
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}