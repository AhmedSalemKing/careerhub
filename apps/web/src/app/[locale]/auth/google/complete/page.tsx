'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

export default function GoogleCompleteProfile() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()

  const [userData, setUserData] = useState<any>(null)
  const [accountType, setAccountType] = useState('STUDENT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const dataParam = searchParams.get('data')
    if (!dataParam) { router.push('/ar/login'); return }
    try {
      const data = JSON.parse(decodeURIComponent(dataParam))
      setUserData(data)
      // Store token immediately so the user is authenticated
      localStorage.setItem('careerhub_token', data.accessToken)
      localStorage.setItem('deveway_token', data.accessToken)
      localStorage.setItem('careerhub_user', JSON.stringify(data))
      localStorage.setItem('deveway_user', JSON.stringify(data))
      document.cookie = `careerhub_token=${data.accessToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=None; Secure`
      setToken(data.accessToken)
      setUser(data)
      window.dispatchEvent(new Event('auth:updated'))
    } catch {
      router.push('/ar/login?error=parse_failed')
    }
  }, [searchParams, router, setToken, setUser])

  const handleComplete = async () => {
    setLoading(true)
    setError('')
    try {
      await api.patch('/auth/update-account-type', { accountType })
    } catch {
      // Non-fatal — still redirect
    } finally {
      setLoading(false)
      router.push('/ar/dashboard')
    }
  }

  if (!userData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1221' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #5120c8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f1221, #1a1040)',
      padding: 24, direction: 'rtl',
    }}>
      <div style={{
        background: '#161929', borderRadius: 24, padding: 40,
        maxWidth: 480, width: '100%',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Avatar + Welcome */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {userData.profile?.avatar && (
            <img
              src={userData.profile.avatar}
              alt="avatar"
              style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px', display: 'block', border: '3px solid #5120c8' }}
            />
          )}
          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            أهلاً {userData.profile?.firstName}!
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 15 }}>
            تم ربط حسابك بـ Google بنجاح. اختر نوع حسابك للمتابعة.
          </p>
        </div>

        {/* Account type cards */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ color: '#94a3b8', fontSize: 14, display: 'block', marginBottom: 12 }}>
            نوع الحساب
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { value: 'STUDENT', label: 'طالب 🎓', desc: 'أريد التعلم واكتساب مهارات جديدة' },
              { value: 'INSTRUCTOR', label: 'محاضر 👨‍🏫', desc: 'أريد تدريس ومشاركة معرفتي' },
              { value: 'CONSULTANT', label: 'مستشار 🧑‍💼', desc: 'أريد تقديم جلسات استشارية' },
            ].map(type => (
              <div
                key={type.value}
                onClick={() => setAccountType(type.value)}
                style={{
                  padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                  border: `2px solid ${accountType === type.value ? '#5120c8' : 'rgba(255,255,255,0.08)'}`,
                  background: accountType === type.value ? 'rgba(81,32,200,0.15)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{type.label}</div>
                <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{type.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>{error}</p>
        )}

        <button
          onClick={handleComplete}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 12,
            background: loading ? '#374151' : '#5120c8',
            color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 16, fontWeight: 700, transition: 'all 0.2s ease',
          }}
        >
          {loading ? 'جاري الحفظ...' : 'متابعة →'}
        </button>
      </div>
    </div>
  )
}
