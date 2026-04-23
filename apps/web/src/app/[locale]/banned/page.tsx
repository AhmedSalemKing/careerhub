'use client'
import { ShieldX, Mail } from 'lucide-react'

export default function BannedPage() {
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
      <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>تم حظر حسابك</h1>
      <p style={{ color: '#94a3b8', fontSize: 16, maxWidth: 420, lineHeight: 1.7 }}>
        تم حظر حسابك بشكل دائم بسبب انتهاك شروط الاستخدام.
        لا يمكنك الوصول إلى المنصة.
      </p>
      <p style={{ color: '#6b7280', fontSize: 14 }}>
        للتواصل مع الدعم: support@deveway.com
      </p>
      <a
        href="mailto:support@deveway.com?subject=طلب رفع الحظر"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 24px', background: 'transparent', color: '#fff',
          borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
          fontSize: 15, fontWeight: 600, textDecoration: 'none',
        }}
      >
        <Mail size={16} /> تواصل مع الدعم
      </a>
    </div>
  )
}