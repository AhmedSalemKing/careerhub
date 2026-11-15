'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle, RefreshCw, Mail } from 'lucide-react'
import { useLocale } from 'next-intl'

export default function RejectedPage() {
  const isAr = useLocale() === 'ar'
  const router = useRouter()
  const [reason, setReason] = useState('')
  
  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('careerhub_user') || '{}')
      if (userData.rejectedReason) setReason(userData.rejectedReason)
    } catch(e) {}
    
    localStorage.removeItem('careerhub_token')
    localStorage.removeItem('careerhub_user')
    localStorage.removeItem('deveway_token')
    localStorage.removeItem('deveway_user')
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f1221, #1a1040)',
      flexDirection: 'column', gap: 24, padding: 24, direction: 'rtl', textAlign: 'center',
    }}>
      <div style={{
        width: 90, height: 90, borderRadius: '50%',
        background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <XCircle size={44} color="#ef4444" />
      </div>
      
      <div>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          {isAr ? 'تم رفض طلب انضمامك' : 'Your join request was rejected'}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 16, maxWidth: 460, lineHeight: 1.7 }}>
          {isAr ? 'للأسف لم يتم قبول طلب انضمامك في الوقت الحالي.' : 'Unfortunately your join request was not accepted at this time.'}
        </p>
      </div>

      {reason && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 14, padding: '16px 24px', maxWidth: 460,
        }}>
          <p style={{ color: '#fca5a5', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{isAr ? 'سبب الرفض:' : 'Reason for rejection:'}</p>
          <p style={{ color: '#94a3b8', fontSize: 15 }}>{reason}</p>
        </div>
      )}

      <div style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '20px 28px', maxWidth: 460,
      }}>
        <p style={{ color: '#d1d5db', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
          {isAr ? 'ماذا يمكنك فعله' : 'What you can do'}
        </p>
        <ul style={{ color: '#94a3b8', fontSize: 14, lineHeight: 2, textAlign: 'right', paddingRight: 20 }}>
          <li>{isAr ? 'راجع متطلبات الانضمام' : 'Review the joining requirements'}</li>
          <li>{isAr ? 'تأكد من اكتمال بيانات ملفك الشخصي' : 'Make sure your profile information is complete'}</li>
          <li>{isAr ? 'تواصل مع الدعم لمعرفة السبب' : 'Contact support to find out the reason'}</li>
          <li>{isAr ? 'أعد التسجيل بعد تحسين بياناتك' : 'Re-register after improving your information'}</li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => router.push('/ar/register')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', background: '#5120c8', color: '#fff',
            borderRadius: 12, border: 'none', cursor: 'pointer',
            fontSize: 15, fontWeight: 600,
          }}
        >
          <RefreshCw size={16} /> {isAr ? 'إعادة التسجيل' : 'Register again'}
        </button>
        
        <a
          href={isAr ? 'mailto:support@deveway.com?subject=استفسار عن سبب الرفض' : 'mailto:support@deveway.com?subject=Question about the rejection reason'}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', background: 'transparent', color: '#fff',
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)',
            fontSize: 15, fontWeight: 600, textDecoration: 'none',
          }}
        >
          <Mail size={16} /> {isAr ? 'تواصل م�� الدعم' : 'Contact support'}
        </a>
      </div>
    </div>
  )
}