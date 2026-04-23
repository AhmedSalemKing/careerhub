'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { get } from '@/lib/api'
import { Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'

export default function PendingApprovalPage() {
  const router = useRouter()
  const store = useAuthStore()
  const { user, token } = store
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [checkCount, setCheckCount] = useState(0)

  const checkApproval = useCallback(async () => {
    try {
      const res = await get('/auth/me')
      const freshUser = res?.data?.data ?? res?.data
      
      if (freshUser?.status === 'ACTIVE' || freshUser?.status === 'active') {
        setStatus('approved')
        store.setUser(freshUser)
        localStorage.setItem('careerhub_user', JSON.stringify(freshUser))
        setTimeout(() => {
          router.push('/ar/dashboard')
        }, 2500)
        return
      }
      
      if (freshUser?.status === 'REJECTED' || freshUser?.status === 'BANNED') {
        setStatus('rejected')
        return
      }
      
      setCheckCount(prev => prev + 1)
    } catch(e) {
      console.error('[PendingApproval] Check failed:', e)
      setCheckCount(prev => prev + 1)
    }
  }, [store, router])

  useEffect(() => {
    if (!token) {
      router.push('/ar/login')
      return
    }

    checkApproval()
    
    const interval = setInterval(checkApproval, 15000)
    return () => clearInterval(interval)
  }, [token, checkApproval, router])

  if (status === 'approved') return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f1221, #1a1040)',
      flexDirection: 'column', gap: 20, direction: 'rtl',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(22,163,74,0.15)',
        border: '2px solid #16a34a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse 1s ease',
      }}>
        <CheckCircle2 size={40} color="#16a34a" />
      </div>
      <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>تمت الموافقة على حسابك!</h2>
      <p style={{ color: '#86efac', fontSize: 16 }}>جاري تحويلك للداشبورد...</p>
      <div style={{
        width: 200, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', background: '#16a34a', borderRadius: 2,
          animation: 'progress 2.5s linear forwards',
        }} />
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        @keyframes progress { from{width:0} to{width:100%} }
      `}</style>
    </div>
  )

  if (status === 'rejected') return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f1221, #1a1040)',
      flexDirection: 'column', gap: 20, direction: 'rtl',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(239,68,68,0.15)', border: '2px solid #ef4444',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <XCircle size={40} color="#ef4444" />
      </div>
      <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>تم رفض طلب انضمامك</h2>
      <p style={{ color: '#94a3b8', fontSize: 15, textAlign: 'center', maxWidth: 400 }}>
        للأ��ف تم رفض طلبك. يمكنك التواصل مع الدعم لمزيد من المعلومات.
      </p>
      <button
        onClick={() => { router.push('/ar/login') }}
        style={{
          padding: '12px 28px', background: '#5120c8', color: '#fff',
          borderRadius: 12, border: 'none', cursor: 'pointer',
          fontSize: 15, fontWeight: 600,
        }}
      >
        العودة لتسجيل الدخول
      </button>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f1221, #1a1040)',
      flexDirection: 'column', gap: 24, direction: 'rtl', padding: 24,
    }}>
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '3px solid rgba(81,32,200,0.3)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#5120c8',
          animation: 'spin 1.5s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Clock size={36} color="#5120c8" />
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 700, marginBottom: 12 }}>
          طلبك قيد المراجعة
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.7, maxWidth: 420 }}>
          شكرا لانضمامك لـ DeveWay! يقوم فريقنا بمراجعة طلبك.
          ستتم إعادة توجيهك تلقائيا فور الموافقة.
        </p>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '20px 32px', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
          <RefreshCw size={14} color="#6b7280" style={{ animation: 'spin 2s linear infinite' }} />
          <span style={{ color: '#6b7280', fontSize: 13 }}>
            يتم التحقق تلقائيا كل 15 ثانية
          </span>
        </div>
        <span style={{ color: '#4b5563', fontSize: 12 }}>
          عدد المحاولات: {checkCount}
        </span>
      </div>

      {user && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '12px 20px',
        }}>
          {user.profile?.avatar ? (
            <img src={user.profile.avatar} alt="avatar"
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#5120c8', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#fff', fontWeight: 700,
            }}>
              {user.email?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
              {user.profile?.firstName} {user.profile?.lastName}
            </div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>{user.email}</div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}