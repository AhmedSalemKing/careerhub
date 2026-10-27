'use client'
import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

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

    const handleSuccess = async () => {
      try {
        const data = JSON.parse(decodeURIComponent(dataParam))
        const { accessToken, ...rest } = data
        const user: any = { ...rest }

        // Clear token from URL immediately (security: won't stay in browser history)
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', window.location.pathname)
        }

        if (!accessToken) {
          router.push('/ar/login')
          return
        }

        localStorage.setItem('careerhub_token', accessToken)
        localStorage.setItem('deveway_token', accessToken)
        document.cookie = `careerhub_token=${accessToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=None; Secure`
        setToken(accessToken)

        if (user.status === 'PENDING') {
          localStorage.setItem('careerhub_user', JSON.stringify(user))
          localStorage.setItem('deveway_user', JSON.stringify(user))
          setUser(user)
          router.push('/ar/pending-approval')
          return
        }

        if (!user || !user.id) {
          router.push('/ar/login')
          return
        }

        localStorage.setItem('careerhub_user', JSON.stringify(user))
        localStorage.setItem('deveway_user', JSON.stringify(user))

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
    }

    handleSuccess()
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
