'use client'
import { useState, type FocusEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { get, post } from '@/lib/api'
import { useTheme } from 'next-themes'
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2, CreditCard, X, Sparkles, Clock } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

// Professional Color Palette
const colors = {
  dark: {
    bg: '#0d0d0d',
    card: '#141414',
    cardHover: '#1a1a1a',
    border: 'rgba(255,255,255,0.08)',
    text: '#ffffff',
    textSecondary: '#a0a0a0',
    textMuted: '#666666',
    accent: '#7c3aed',
    accentLight: '#a78bfa',
    success: '#10b981',
    error: '#ef4444',
    inputBg: '#1a1a1a',
    inputBorder: 'rgba(255,255,255,0.12)',
  },
  light: {
    bg: '#fafafa',
    card: '#ffffff',
    cardHover: '#f5f5f5',
    border: '#e5e5e5',
    text: '#0d0d0d',
    textSecondary: '#525252',
    textMuted: '#737373',
    accent: '#7c3aed',
    accentLight: '#8b5cf6',
    success: '#10b981',
    error: '#ef4444',
    inputBg: '#f5f5f5',
    inputBorder: '#e5e5e5',
  }
}

function TopupForm({ onSuccess }: { onSuccess: (balance: number) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [amount, setAmount] = useState(50)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const c = isDark ? colors.dark : colors.light
  
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
      {/* Amount Selection */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ 
          color: c.textSecondary, 
          fontSize: 13, 
          fontWeight: 600,
          display: 'block', 
          marginBottom: 12,
          letterSpacing: '0.02em'
        }}>
          اختر المبلغ (ريال سعودي)
        </label>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 10,
          marginBottom: 16
        }}>
          {quickAmounts.map(a => (
            <button 
              key={a} 
              onClick={() => setAmount(a)} 
              style={{
                padding: '14px 8px',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'inherit',
                background: amount === a 
                  ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' 
                  : c.inputBg,
                color: amount === a ? '#fff' : c.textSecondary,
                border: `1.5px solid ${amount === a ? '#7c3aed' : c.inputBorder}`,
                cursor: 'pointer', 
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: amount === a ? 'scale(1.02)' : 'scale(1)',
                boxShadow: amount === a ? '0 4px 20px rgba(124,58,237,0.35)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (amount !== a) {
                  e.currentTarget.style.borderColor = c.accent
                  e.currentTarget.style.background = c.cardHover
                }
              }}
              onMouseLeave={(e) => {
                if (amount !== a) {
                  e.currentTarget.style.borderColor = c.inputBorder
                  e.currentTarget.style.background = c.inputBg
                }
              }}
            >
              {a}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          min={10} max={10000}
          style={{
            width: '100%', 
            padding: '16px 20px',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 600,
            fontFamily: 'inherit',
            background: c.inputBg,
            color: c.text,
            border: `1.5px solid ${c.inputBorder}`,
            outline: 'none',
            transition: 'all 0.25s ease',
          }}
          onFocus={(e: FocusEvent<HTMLInputElement>) => {
            e.target.style.borderColor = c.accent
            e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'
          }}
          onBlur={(e: FocusEvent<HTMLInputElement>) => {
            e.target.style.borderColor = c.inputBorder
            e.target.style.boxShadow = 'none'
          }}
          placeholder="أو أدخل مبلغاً مخصصاً"
        />
      </div>
      
      {/* Card Input */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ 
          color: c.textSecondary, 
          fontSize: 13, 
          fontWeight: 600,
          display: 'block', 
          marginBottom: 12,
          letterSpacing: '0.02em'
        }}>
          بيانات البطاقة
        </label>
        <div style={{
          padding: '18px 20px',
          borderRadius: 14,
          background: c.inputBg,
          border: `1.5px solid ${c.inputBorder}`,
          transition: 'all 0.25s ease',
        }}>
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                fontFamily: 'inherit',
                color: c.text,
                '::placeholder': { color: c.textMuted },
              }
            }
          }} />
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 16px',
          borderRadius: 12,
          marginBottom: 20,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <X size={16} color="#ef4444" />
          <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 500 }}>{error}</span>
        </div>
      )}
      
      {/* Submit Button */}
      <button
        onClick={handleTopup}
        disabled={loading || amount < 10 || !stripePromise}
        style={{
          width: '100%', 
          padding: '18px', 
          borderRadius: 14,
          background: loading || amount < 10 
            ? (isDark ? '#262626' : '#d4d4d4') 
            : 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          color: '#fff', 
          border: 'none',
          cursor: loading || amount < 10 ? 'not-allowed' : 'pointer',
          fontSize: 16, 
          fontWeight: 700,
          fontFamily: 'inherit',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 10,
          boxShadow: loading || amount < 10 
            ? 'none' 
            : '0 8px 32px rgba(124,58,237,0.35)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: loading ? 'scale(0.98)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          if (!loading && amount >= 10) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(124,58,237,0.45)'
          }
        }}
        onMouseLeave={(e) => {
          if (!loading && amount >= 10) {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.35)'
          }
        }}
      >
        {loading ? (
          <div style={{ 
            width: 22, 
            height: 22, 
            border: '2.5px solid rgba(255,255,255,0.25)', 
            borderTopColor: '#fff', 
            borderRadius: '50%', 
            animation: 'spin 0.8s linear infinite' 
          }} />
        ) : (
          <CreditCard size={20} strokeWidth={2.5} />
        )}
        {loading ? 'جاري المعالجة...' : `شحن ${amount} ر.س`}
      </button>
      
      <style>{`
        @keyframes spin{
          to{ transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default function WalletPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const c = isDark ? colors.dark : colors.light
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
      background: c.bg,
      padding: '40px 24px 140px',
      direction: 'rtl',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: 36,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(124,58,237,0.2)',
            }}>
              <Wallet size={26} color="#7c3aed" strokeWidth={2} />
            </div>
            <div>
              <h1 style={{ 
                color: c.text, 
                fontSize: 26, 
                fontWeight: 800, 
                margin: 0,
                letterSpacing: '-0.02em',
              }}>
                محفظتي
              </h1>
              <p style={{ 
                color: c.textMuted, 
                fontSize: 14, 
                margin: '4px 0 0',
                fontWeight: 400,
              }}>إدارة رصيدك وشحنه بسهولة</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMsg && (
          <div style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 12,
            padding: '16px 20px', 
            borderRadius: 16, 
            marginBottom: 24,
            background: 'rgba(16,185,129,0.08)', 
            border: '1px solid rgba(16,185,129,0.25)',
            animation: 'slideIn 0.3s ease-out',
          }}>
            <CheckCircle2 size={20} color="#10b981" strokeWidth={2.5} />
            <span style={{ 
              color: '#10b981', 
              fontWeight: 600, 
              fontSize: 14,
              letterSpacing: '0.01em',
            }}>{successMsg}</span>
          </div>
        )}

        {/* Balance Card - Professional Black & Purple Gradient */}
        <div style={{
          background: 'linear-gradient(135deg, #000000 0%, #000000 45%, #2e105f 100%)',
          borderRadius: 24,
          padding: '36px 32px',
          marginBottom: 28,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: isDark 
            ? '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' 
            : '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
        }}>
          {/* Decorative Elements */}
          <div style={{ 
            position: 'absolute', 
            top: -60, 
            right: -60, 
            width: 200, 
            height: 200, 
            borderRadius: '50%', 
            background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          }} />
          <div style={{ 
            position: 'absolute', 
            bottom: -40, 
            left: -40, 
            width: 140, 
            height: 140, 
            borderRadius: '50%', 
            background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
          }} />
          {/* Grid Pattern Overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            opacity: 0.5,
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              marginBottom: 16,
            }}>
              <Sparkles size={16} color="rgba(167,139,250,0.8)" />
              <p style={{ 
                color: 'rgba(167,139,250,0.9)', 
                fontSize: 13, 
                fontWeight: 600,
                margin: 0,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>الرصيد الحالي</p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'baseline', 
              gap: 10, 
              marginBottom: 32,
            }}>
              <span style={{ 
                color: '#ffffff', 
                fontSize: 56, 
                fontWeight: 800, 
                lineHeight: 1,
                letterSpacing: '-0.03em',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {isLoading ? '...' : balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span style={{ 
                color: 'rgba(255,255,255,0.7)', 
                fontSize: 22, 
                fontWeight: 600,
              }}>ر.س</span>
            </div>
            
            <button
              onClick={() => setShowTopup(!showTopup)}
              style={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: 10,
                padding: '16px 32px',
                borderRadius: 14,
                background: showTopup 
                  ? 'rgba(255,255,255,0.1)' 
                  : 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                color: '#ffffff', 
                border: `1.5px solid ${showTopup ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.2)'}`,
                cursor: 'pointer', 
                fontSize: 15, 
                fontWeight: 700,
                fontFamily: 'inherit',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: showTopup ? 'scale(0.97)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.18)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = showTopup ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.12)'
                e.currentTarget.style.transform = showTopup ? 'scale(0.97)' : 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {showTopup ? <X size={20} /> : <Plus size={20} strokeWidth={2.5} />}
              {showTopup ? 'إغلاق' : 'شحن الرصيد'}
            </button>
          </div>
        </div>

        {/* Topup Form Panel */}
        {showTopup && (
          <div style={{
            background: c.card,
            borderRadius: 24,
            padding: 32,
            marginBottom: 28,
            border: `1px solid ${c.border}`,
            boxShadow: isDark 
              ? '0 8px 40px rgba(0,0,0,0.4)' 
              : '0 8px 40px rgba(0,0,0,0.08)',
            animation: 'slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 28,
              paddingBottom: 20,
              borderBottom: `1px solid ${c.border}`,
            }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CreditCard size={21} color="#7c3aed" strokeWidth={2} />
              </div>
              <div>
                <h3 style={{ 
                  color: c.text, 
                  fontSize: 18, 
                  fontWeight: 700, 
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}>
                  شحن المحفظة
                </h3>
                <p style={{ 
                  color: c.textMuted, 
                  fontSize: 13, 
                  margin: '4px 0 0',
                }}>اختر المبلغ وأدخل بيانات بطاقتك</p>
              </div>
            </div>
            <Elements stripe={stripePromise}>
              <TopupForm onSuccess={handleTopupSuccess} />
            </Elements>
          </div>
        )}

        {/* Transactions Section */}
        <div style={{
          background: c.card,
          borderRadius: 24,
          padding: 28,
          border: `1px solid ${c.border}`,
          boxShadow: isDark 
            ? '0 8px 40px rgba(0,0,0,0.4)' 
            : '0 8px 40px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            paddingBottom: 20,
            borderBottom: `1px solid ${c.border}`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Wallet size={21} color="#7c3aed" strokeWidth={2} />
              </div>
              <h3 style={{ 
                color: c.text, 
                fontSize: 18, 
                fontWeight: 700, 
                margin: 0,
                letterSpacing: '-0.01em',
              }}>
                سجل المعاملات
              </h3>
            </div>
            {transactions.length > 0 && (
              <span style={{
                fontSize: 13,
                fontWeight: 600,
                color: c.textMuted,
                background: c.inputBg,
                padding: '6px 14px',
                borderRadius: 20,
              }}>
                {transactions.length} معاملة
              </span>
            )}
          </div>
          
          {transactions.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '48px 24px',
              color: c.textMuted,
            }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: c.inputBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <Wallet size={32} color={c.textMuted} strokeWidth={1.5} opacity={0.5} />
              </div>
              <p style={{ 
                fontSize: 15, 
                fontWeight: 600,
                margin: '0 0 8px',
                color: c.textSecondary,
              }}>لا توجد معاملات بعد</p>
              <p style={{ 
                fontSize: 13,
                margin: 0,
                opacity: 0.7,
              }}>ستظهر هنا جميع معاملاتك</p>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              {transactions.map((tx: any, index: number) => (
                <div 
                  key={tx.id} 
                  style={{
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 16,
                    padding: '18px 16px',
                    borderRadius: 14,
                    background: index % 2 === 0 ? 'transparent' : c.inputBg,
                    transition: 'all 0.2s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = c.cardHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : c.inputBg
                  }}
                >
                  <div style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    flexShrink: 0,
                    background: tx.type === 'TOPUP' 
                      ? 'rgba(16,185,129,0.1)' 
                      : 'rgba(239,68,68,0.1)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: tx.type === 'TOPUP'
                      ? '1px solid rgba(16,185,129,0.2)'
                      : '1px solid rgba(239,68,68,0.2)',
                  }}>
                    {tx.type === 'TOPUP'
                      ? <ArrowDownLeft size={22} color="#10b981" strokeWidth={2.5} />
                      : <ArrowUpRight size={22} color="#ef4444" strokeWidth={2.5} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      color: c.text, 
                      fontSize: 15, 
                      fontWeight: 600,
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {tx.description}
                    </div>
                    <div style={{ 
                      color: c.textMuted, 
                      fontSize: 12,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                      <Clock size={13} strokeWidth={2} />
                      {new Date(tx.createdAt).toLocaleDateString('ar-SA', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: tx.amount > 0 ? '#10b981' : '#ef4444',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                    direction: 'ltr',
                  }}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} ر.س
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Global Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}