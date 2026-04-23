'use client'
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post } from '@/lib/api'
import { useTheme } from 'next-themes'
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, ArrowRight, CreditCard, History, TrendingUp, TrendingDown, Receipt } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

function TopupForm({ onSuccess }: { onSuccess: (balance: number) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [amount, setAmount] = useState(50)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const quickAmounts = [25, 50, 100, 200, 500]
  
  const handleTopup = async () => {
    if (!stripe || !elements) return
    setLoading(true)
    setError('')
    
    try {
      const res = await post('/wallet/topup/create-intent', { amount })
      const { clientSecret, paymentIntentId } = res.data.data
      
      const cardElement = elements.getElement(CardElement)
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement! }
      })
      
      if (stripeError) {
        setError(stripeError.message || 'فشل الدفع')
        return
      }
      
      const confirmRes = await post('/wallet/topup/confirm', { paymentIntentId })
      onSuccess(confirmRes.data.data.balance)
    } catch(e: any) {
      setError(e.response?.data?.message || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div style={{ direction: 'rtl' }}>
      <div style={{ marginBottom: 20 }}>
        <label style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 13, display: 'block', marginBottom: 12, fontWeight: 500 }}>
          اختر مبلغ الشحن
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {quickAmounts.map(a => (
            <button key={a} onClick={() => setAmount(a)} style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: amount === a ? '#5120c8' : 'transparent',
              color: amount === a ? '#fff' : isDark ? '#d1d5db' : '#4b5563',
              border: `1px solid ${amount === a ? '#5120c8' : isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {a} ر.س
            </button>
          ))}
        </div>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          min={10} max={10000}
          style={{
            width: '100%', padding: '14px 16px',
            borderRadius: 12, fontSize: 15, fontWeight: 500,
            background: isDark ? '#1a1a1a' : '#ffffff',
            color: isDark ? '#fff' : '#111827',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
            outline: 'none',
          }}
          placeholder="أو أدخل مبلغاً مخصصاً"
        />
      </div>
      
      <div style={{ marginBottom: 20 }}>
        <label style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 13, display: 'block', marginBottom: 12, fontWeight: 500 }}>
          بيانات البطاقة
        </label>
        <div style={{
          padding: '16px', borderRadius: 12,
          background: isDark ? '#1a1a1a' : '#ffffff',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
        }}>
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: isDark ? '#f9fafb' : '#111827',
                '::placeholder': { color: isDark ? '#6b7280' : '#9ca3af' },
              }
            }
          }} />
        </div>
      </div>
      
      {error && (
        <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>
      )}
      
      <button
        onClick={handleTopup}
        disabled={loading || amount < 10 || !stripePromise}
        style={{
          width: '100%', padding: '16px', borderRadius: 14,
          background: loading || amount < 10 ? '#374151' : 'linear-gradient(135deg, #16a34a, #22c55e)',
          color: '#fff', border: 'none',
          cursor: loading || amount < 10 ? 'not-allowed' : 'pointer',
          fontSize: 15, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: loading ? 'none' : '0 8px 24px rgba(22,163,74,0.3)',
          transition: 'all 0.2s',
        }}
      >
        {loading ? (
          <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        ) : (
          <CreditCard size={18} />
        )}
        {loading ? 'جاري الشحن...' : `شحن ${amount} ريال`}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function WalletPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const queryClient = useQueryClient()
  const [showTopup, setShowTopup] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await get('/wallet')
      return res.data?.data
    }
  })

  const balance = wallet?.balance || 0
  const transactions = wallet?.transactions || []

  const stats = useMemo(() => {
    const txs = Array.isArray(transactions) ? transactions : []
    const topups = txs.filter((t: any) => t.type === 'TOPUP').reduce((sum: number, t: any) => sum + (t.amount || 0), 0)
    const payments = Math.abs(txs.filter((t: any) => t.type === 'PAYMENT').reduce((sum: number, t: any) => sum + (t.amount || 0), 0))
    return {
      totalTopups: topups,
      totalPayments: payments,
      totalTransactions: txs.length,
    }
  }, [transactions])

  const handleTopupSuccess = (newBalance: number) => {
    queryClient.invalidateQueries({ queryKey: ['wallet'] })
    queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
    setShowTopup(false)
    setSuccessMsg(`تم شحن المحفظة بنجاح! رصيدك الجديد: ${newBalance.toFixed(2)} ر.س`)
    setTimeout(() => setSuccessMsg(''), 6000)
  }

  const bg = isDark ? '#0d0d0d' : '#ffffff'
  const surface = isDark ? '#121212' : '#f8f8fa'
  const surface2 = isDark ? '#1a1a1a' : '#f0f0f2'
  const border = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'
  const text = isDark ? '#ffffff' : '#111827'
  const textSecondary = isDark ? '#9ca3af' : '#6b7280'

  return (
    <div style={{
      minHeight: '100vh',
      background: bg,
      padding: '32px 24px 120px',
      direction: 'rtl',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #5120c8, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(81,32,200,0.25)',
            }}>
              <Wallet size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ color: text, fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                محفظتي
              </h1>
              <p style={{ color: textSecondary, fontSize: 13, margin: 4, marginTop: 2 }}>إدارة رصيدك ومشترياتك</p>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {successMsg && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '16px 20px', borderRadius: 14, marginBottom: 20,
            background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRight size={16} color="#fff" />
            </div>
            <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 14 }}>{successMsg}</span>
          </div>
        )}

        {/* Balance Card - Always Dark */}
        <div style={{
          background: `
            linear-gradient(135deg, #000000 0%, #212121 50%, #2e106f 100%),
            repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.01) 10px, rgba(255,255,255,0.01) 20px)
          `,
          borderRadius: 24, padding: '36px 32px', marginBottom: 24,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
          <div style={{ position: 'absolute', top: 20, left: 40, fontSize: 80, fontWeight: 800, color: '#fff', opacity: 0.03, letterSpacing: '-0.04em' }}>DeveWay</div>
          
          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Wallet size={16} color="rgba(255,255,255,0.6)" />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500 }}>محفظة DeveWay</span>
            </div>
            
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 8 }}>الرصيد المتاح</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 28 }}>
              <span style={{ color: '#fff', fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>
                {isLoading ? '...' : balance.toFixed(2)}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: 600 }}>ر.س</span>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowTopup(!showTopup)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '14px 24px', borderRadius: 14,
                  background: '#16a34a',
                  color: '#fff', border: 'none',
                  cursor: 'pointer', fontSize: 14, fontWeight: 700,
                  boxShadow: '0 4px 16px rgba(22,163,74,0.35)',
                  transition: 'all 0.2s',
                }}
              >
                <Plus size={18} />
                شحن الرصيد
              </button>
              <button
                onClick={() => document.getElementById('transactions')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '14px 24px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff', border: '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s',
                }}
              >
                <History size={18} />
                سجل المعاملات
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          <div style={{ background: surface, borderRadius: 16, padding: 20, border: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} color="#16a34a" />
              </div>
              <span style={{ color: textSecondary, fontSize: 12, fontWeight: 500 }}>إجمالي الشحن</span>
            </div>
            <p style={{ color: '#16a34a', fontSize: 22, fontWeight: 700, margin: 0 }}>{stats.totalTopups.toFixed(2)} ر.س</p>
          </div>
          <div style={{ background: surface, borderRadius: 16, padding: 20, border: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDown size={18} color="#ef4444" />
              </div>
              <span style={{ color: textSecondary, fontSize: 12, fontWeight: 500 }}>إجمالي المدفوعات</span>
            </div>
            <p style={{ color: '#ef4444', fontSize: 22, fontWeight: 700, margin: 0 }}>{stats.totalPayments.toFixed(2)} ر.س</p>
          </div>
          <div style={{ background: surface, borderRadius: 16, padding: 20, border: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(81,32,200,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Receipt size={18} color="#5120c8" />
              </div>
              <span style={{ color: textSecondary, fontSize: 12, fontWeight: 500 }}>عدد المعاملات</span>
            </div>
            <p style={{ color: '#5120c8', fontSize: 22, fontWeight: 700, margin: 0 }}>{stats.totalTransactions}</p>
          </div>
        </div>

        {/* Topup Form */}
        {showTopup && (
          <div style={{
            background: surface,
            borderRadius: 20, padding: 28, marginBottom: 24,
            border: `1px solid ${border}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ color: text, fontSize: 18, fontWeight: 700, margin: 0 }}>
                شحن المحفظة
              </h3>
              <button onClick={() => setShowTopup(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                <span style={{ color: textSecondary, fontSize: 20 }}>×</span>
              </button>
            </div>
            <Elements stripe={stripePromise}>
              <TopupForm onSuccess={handleTopupSuccess} />
            </Elements>
          </div>
        )}

        {/* Transactions List */}
        <div id="transactions" style={{
          background: surface,
          borderRadius: 20, padding: 24,
          border: `1px solid ${border}`,
        }}>
          <h3 style={{ color: text, fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
            سجل المعاملات
          </h3>
          
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: textSecondary }}>
              <Wallet size={48} style={{ margin: '0 auto 16px', opacity: 0.25 }} />
              <p style={{ fontSize: 15, margin: 0 }}>لا توجد معاملات بعد</p>
              <p style={{ fontSize: 13, marginTop: 8, opacity: 0.7 }}>ابدأ بشحن رصيدك第一部</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {transactions.map((tx: any, idx: number) => (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '18px 0',
                  borderBottom: idx < transactions.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'}` : 'none',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: tx.type === 'TOPUP' ? 'rgba(22,163,74,0.12)' : 'rgba(239,68,68,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {tx.type === 'TOPUP'
                      ? <ArrowDownLeft size={20} color="#16a34a" />
                      : <ArrowUpRight size={20} color="#ef4444" />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: text, fontSize: 14, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description || (tx.type === 'TOPUP' ? 'شحن رصيد' : 'دفع مشتريات')}
                    </div>
                    <div style={{ color: textSecondary, fontSize: 12 }}>
                      {new Date(tx.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 16, fontWeight: 700,
                    color: tx.amount > 0 ? '#16a34a' : '#ef4444',
                    whiteSpace: 'nowrap',
                  }}>
                    {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toFixed(2)} ر.س
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}