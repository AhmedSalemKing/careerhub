'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get, post } from '@/lib/api'
import { useTheme } from 'next-themes'
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, CreditCard } from 'lucide-react'
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
        <label style={{ color: '#6b7280', fontSize: 14, display: 'block', marginBottom: 10 }}>
          اختر المبلغ (ريال سعودي)
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {quickAmounts.map(a => (
            <button key={a} onClick={() => setAmount(a)} style={{
              padding: '8px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: amount === a ? '#5120c8' : 'transparent',
              color: amount === a ? '#fff' : isDark ? '#94a3b8' : '#6b7280',
              border: `1px solid ${amount === a ? '#5120c8' : isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
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
            marginTop: 10, width: '100%', padding: '12px 16px',
            borderRadius: 10, fontSize: 15, fontWeight: 600,
            background: isDark ? '#1e2235' : '#f8f8fa',
            color: isDark ? '#fff' : '#0d0d0d',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
            outline: 'none',
          }}
          placeholder="أو أدخل مبلغاً مخصصاً"
        />
      </div>
      
      <div style={{ marginBottom: 20 }}>
        <label style={{ color: '#6b7280', fontSize: 14, display: 'block', marginBottom: 10 }}>
          بيانات البطاقة
        </label>
        <div style={{
          padding: '14px 16px', borderRadius: 10,
          background: isDark ? '#1e2235' : '#f8f8fa',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
        }}>
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: isDark ? '#f1f5f9' : '#0d0d0d',
                '::placeholder': { color: '#6b7280' },
              }
            }
          }} />
        </div>
      </div>
      
      {error && (
        <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>
      )}
      
      <button
        onClick={handleTopup}
        disabled={loading || amount < 10 || !stripePromise}
        style={{
          width: '100%', padding: '14px', borderRadius: 12,
          background: loading || amount < 10 ? '#374151' : 'linear-gradient(135deg, #5120c8, #7c3aed)',
          color: '#fff', border: 'none',
          cursor: loading || amount < 10 ? 'not-allowed' : 'pointer',
          fontSize: 15, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: loading ? 'none' : '0 4px 20px rgba(81,32,200,0.3)',
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

  const handleTopupSuccess = (newBalance: number) => {
    queryClient.invalidateQueries({ queryKey: ['wallet'] })
    queryClient.invalidateQueries({ queryKey: ['wallet-balance'] })
    setShowTopup(false)
    setSuccessMsg(`تم شحن المحفظة بنجاح! رصيدك الجديد: ${newBalance.toFixed(2)} ر.س`)
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? '#0f1221' : '#fafafa',
      padding: '32px 24px 120px',
      direction: 'rtl',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(81,32,200,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Wallet size={22} color="#5120c8" />
            </div>
            <div>
              <h1 style={{ color: isDark ? '#f1f5f9' : '#0d0d0d', fontSize: 22, fontWeight: 700, margin: 0 }}>
                محفظتي
              </h1>
              <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>شحن واستخدام رصيد المحفظة</p>
            </div>
          </div>
        </div>

        {successMsg && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 18px', borderRadius: 12, marginBottom: 20,
            background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)',
          }}>
            <CheckCircle2 size={18} color="#16a34a" />
            <span style={{ color: '#16a34a', fontWeight: 600, fontSize: 14 }}>{successMsg}</span>
          </div>
        )}

        <div style={{
          background: 'linear-gradient(135deg, #5120c8 0%, #7c3aed 50%, #2BBFA3 100%)',
          borderRadius: 20, padding: '32px 28px', marginBottom: 24,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 8 }}>الرصيد الحالي</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24 }}>
            <span style={{ color: '#fff', fontSize: 48, fontWeight: 800, lineHeight: 1 }}>
              {isLoading ? '...' : balance.toFixed(2)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 20, fontWeight: 600 }}>ر.س</span>
          </div>
          
          <button
            onClick={() => setShowTopup(!showTopup)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer', fontSize: 14, fontWeight: 700,
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={18} />
            شحن الرصيد
          </button>
        </div>

        {showTopup && (
          <div style={{
            background: isDark ? '#161929' : '#ffffff',
            borderRadius: 20, padding: 28, marginBottom: 24,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              شحن المحفظة
            </h3>
            <Elements stripe={stripePromise}>
              <TopupForm onSuccess={handleTopupSuccess} />
            </Elements>
          </div>
        )}

        <div style={{
          background: isDark ? '#161929' : '#ffffff',
          borderRadius: 20, padding: 24,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
        }}>
          <h3 style={{ color: isDark ? '#fff' : '#0d0d0d', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            سجل المعاملات
          </h3>
          
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
              <Wallet size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>لا توجد معاملات بعد</p>
            </div>
          ) : (
            transactions.map((tx: any) => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 0',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: tx.type === 'TOPUP' ? 'rgba(22,163,74,0.1)' : 'rgba(239,68,68,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {tx.type === 'TOPUP'
                    ? <ArrowDownLeft size={18} color="#16a34a" />
                    : <ArrowUpRight size={18} color="#ef4444" />
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: isDark ? '#f1f5f9' : '#0d0d0d', fontSize: 14, fontWeight: 600 }}>
                    {tx.description}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                    {new Date(tx.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{
                  fontSize: 15, fontWeight: 700,
                  color: tx.amount > 0 ? '#16a34a' : '#ef4444',
                }}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} ر.س
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}