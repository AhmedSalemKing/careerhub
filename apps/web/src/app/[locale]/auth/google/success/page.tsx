'use client'
import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export default function GoogleAuthSuccess() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()

  useEffect(() => {
    const dataParam = searchParams.get('data')
    if (!dataParam) {
      router.push('/ar/login?error=no_data')
      return
    }

    try {
      const data = JSON.parse(decodeURIComponent(dataParam))
      const { accessToken, ...user } = data

      // Handle PENDING status - redirect to pending page
      if (user.status === 'PENDING') {
        localStorage.setItem('careerhub_token', accessToken)
        localStorage.setItem('deveway_token', accessToken)
        localStorage.setItem('careerhub_user', JSON.stringify(user))
        localStorage.setItem('deveway_user', JSON.stringify(user))
        setToken(accessToken)
        setUser(user)
        router.push('/ar/pending-approval')
        return
      }

      localStorage.setItem('careerhub_token', accessToken)
      localStorage.setItem('deveway_token', accessToken)
      localStorage.setItem('careerhub_user', JSON.stringify(user))
      localStorage.setItem('deveway_user', JSON.stringify(user))
      document.cookie = `careerhub_token=${accessToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=None; Secure`

      setToken(accessToken)
      setUser(user)

      window.dispatchEvent(new Event('auth:updated'))

      const locale = 'ar'
      if (user.accountType === 'ADMIN' || user.accountType === 'SUPER_ADMIN') {
        router.push(`/${locale}/admin`)
      } else {
        router.push(`/${locale}/dashboard`)
      }
    } catch (e) {
      router.push('/ar/login?error=parse_failed')
    }
  }, [searchParams, router, setToken, setUser])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f1221', color: '#fff', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, border: '3px solid #5120c8',
        borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{ color: '#94a3b8' }}>جاري تسجيل الدخول...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
