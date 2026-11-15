'use client'
import { ShieldX, Mail } from 'lucide-react'
import { useLocale } from 'next-intl'

export default function BannedPage() {
  const isAr = useLocale() === 'ar'
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f1221, #1a0808)',
      flexDirection: 'column', gap: 20, padding: 24, direction: 'rtl', textAlign: 'center',
    }}>
      <div style={{
        width: 90, height: 90, borderRadius: '50%',
        background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ShieldX size={44} color="#ef4444" />
      </div>
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>{isAr ? 'تم حظر حسابك' : 'Your account has been banned'}</h1>
      <p style={{ color: '#94a3b8', fontSize: 16, maxWidth: 420, lineHeight: 1.7 }}>
        {isAr ? 'تم حظر حسابك بشكل دائم بسبب انتهاك شروط الاستخدام. لا يمكنك الوصول إلى المنصة.' : 'Your account has been permanently banned for violating the terms of use. You cannot access the platform.'}
      </p>
      <p style={{ color: '#6b7280', fontSize: 14 }}>
        {isAr ? 'للتواصل مع الدعم: support@deveway.com' : 'To contact support: support@deveway.com'}
      </p>
      <a
        href={isAr ? 'mailto:support@deveway.com?subject=طلب رفع الحظر' : 'mailto:support@deveway.com?subject=Ban removal request'}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', background: 'transparent', color: '#fff',
          borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
          fontSize: 15, fontWeight: 600, textDecoration: 'none',
        }}
      >
        <Mail size={16} /> {isAr ? 'تواصل مع الدعم' : 'Contact support'}
      </a>
    </div>
  )
}