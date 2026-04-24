'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post } from '@/lib/api'
import { useTheme } from 'next-themes'
import { DollarSign, TrendingUp, ArrowDownLeft, Wallet, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function EarningsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [transferAmount, setTransferAmount] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [msg, setMsg] = useState<{type:'success'|'error', text:string} | null>(null)

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['earnings'],
    queryFn: async () => {
      const res = await get('/sessions/my-earnings')
      return res.data?.data ?? { total: 0, pending: 0, sessions: [] }
    }
  })

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await get('/wallet')
      return res.data?.data ?? { balance: 0 }
    }
  })

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount)
    if (!amount || amount <= 0) return
    if (amount > (earnings?.total || 0)) {
      setMsg({ type: 'error', text: 'المبلغ أكبر من أرباحك المتاحة' })
      return
    }
    setTransferring(true)
    try {
      await post('/wallet/transfer-from-earnings', { amount })
      setMsg({ type: 'success', text: `تم تحويل ${amount} ر.س إلى محفظتك بنجاح` })
      setTransferAmount('')
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
    } catch(e: any) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'فشل التحويل' })
    } finally {
      setTransferring(false)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  const totalEarnings = earnings?.total || 0
  const pendingEarnings = earnings?.pending || 0
  const sessions = earnings?.sessions || []

  return (
    <div style={{ minHeight: '100vh', background: isDark ? '#0d0d0d' : '#fafafa', padding: '32px 24px 120px', direction: 'rtl' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 24, fontWeight: 800, margin: 0 }}>أرباحي</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>إجمالي أرباحك من الجلسات الاستشارية</p>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'إجمالي الأرباح', value: `${totalEarnings.toFixed(2)} ر.س`, icon: <DollarSign size={20} color="#16a34a"/>, color: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.2)' },
            { label: 'قيد الانتظار', value: `${pendingEarnings.toFixed(2)} ر.س`, icon: <Clock size={20} color="#f59e0b"/>, color: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
            { label: 'رصيد المحفظة', value: `${(wallet?.balance||0).toFixed(2)} ر.س`, icon: <Wallet size={20} color="#5120c8"/>, color: 'rgba(81,32,200,0.1)', border: 'rgba(81,32,200,0.2)' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: isDark ? '#121212' : '#fff',
              borderRadius: 16, padding: '20px 18px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: stat.color, border: `1px solid ${stat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                {stat.icon}
              </div>
              <div style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 18, fontWeight: 800 }}>{stat.value}</div>
              <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Transfer to Wallet */}
        <div style={{
          background: isDark ? '#121212' : '#fff',
          borderRadius: 20, padding: 24, marginBottom: 24,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
        }}>
          <h3 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowDownLeft size={18} color="#5120c8"/>
            تحويل إلى المحفظة
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
              placeholder={`الحد الأقصى: ${totalEarnings.toFixed(2)} ر.س`}
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
              {transferring ? 'جاري التحويل...' : 'تحويل'}
            </button>
          </div>
          <p style={{ color: '#6b7280', fontSize: 12, marginTop: 10 }}>
            سيتم تحويل المبلغ من أرباحك إلى محفظتك فورا
          </p>
        </div>

        {/* Sessions List */}
        <div style={{
          background: isDark ? '#121212' : '#fff',
          borderRadius: 20, padding: 24,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
        }}>
          <h3 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            سجل الأرباح
          </h3>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
              <DollarSign size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>لا توجد أرباح بعد</p>
            </div>
          ) : (
            sessions.map((s: any, i: number) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 0',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(22,163,74,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <DollarSign size={18} color="#16a34a"/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: isDark ? '#f1f5f9' : '#0d0d0d', fontSize: 14, fontWeight: 600 }}>
                    {s.studentName || 'جلسة استشارية'}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                    {s.date ? new Date(s.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                  </div>
                </div>
                <div style={{ color: '#16a34a', fontWeight: 700, fontSize: 15 }}>
                  +{(s.amount || 0).toFixed(2)} ر.س
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