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
        const user: any = { ...data }

        const getCookie = (name: string): string | null => {
          if (typeof document === 'undefined') return null
          const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
          return match ? decodeURIComponent(match[1]) : null
        }

        let accessToken = getCookie('access_token') || getCookie('auth_token') || getCookie('careerhub_token')

        if (accessToken) {
          localStorage.setItem('careerhub_token', accessToken)
          localStorage.setItem('deveway_token', accessToken)
          document.cookie = `careerhub_token=${accessToken}; path=/; max-age=${7 * 24 * 3600}; SameSite=None; Secure`
          setToken(accessToken)
        } else {
          try {
            const res = await api.get('/auth/me', { withCredentials: true } as any)
            const me = res.data?.data || res.data?.user || res.data
            if (me) {
              Object.assign(user, me)
            }
          } catch (e: any) {
            const status = e?.response?.status
            const code = e?.response?.data?.code || e?.response?.data?.message
            if (status === 401 && code === 'ACCOUNT_DELETED') {
              router.push('/ar/login?error=account_deleted')
              return
            }
            if (status === 401) {
              router.push('/ar/login')
              return
            }
            // ignore other errors
          }
        }

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
