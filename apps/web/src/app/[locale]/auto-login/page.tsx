'use client'

import { useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { useAuthStore } from '../../../stores/authStore'
import { api } from '../../../lib/api'
import { setToken, setUser } from '../../../lib/auth'
import { learnSyncUrl } from '../../../lib/learn-link'

/** Landing page for the emailed auto-login link sent when an admin approves a consultant. */
export default function AutoLoginPage() {
  const locale = useLocale()
  const ar = locale === 'ar'
  const store = useAuthStore()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const params = new URLSearchParams(window.location.search)
    const linkToken = params.get('token')
    // Drop the one-time token from the address bar / history right away.
    window.history.replaceState(null, '', window.location.pathname)

    const fail = () => window.location.replace(`/${locale}/login?error=expired`)
    if (!linkToken) return fail()

    api
      .post<{ data?: { user?: Record<string, unknown>; accessToken?: string } }>('/auth/auto-login', { token: linkToken })
      .then((res) => {
        const token = res?.data?.data?.accessToken
        const user = res?.data?.data?.user as any
        if (!token || !user) return fail()

        // Same session setup as the normal login form.
        store.setToken(token)
        setToken(token)
        localStorage.setItem('deveway_token', token)
        localStorage.setItem('careerhub_token', token)
        document.cookie = `careerhub_token=${token}; path=/; SameSite=Lax; max-age=604800`
        store.setUser(user as any)
        setUser(user as any)
        localStorage.setItem('deveway_user', JSON.stringify(user))
        localStorage.setItem('careerhub_user', JSON.stringify(user))
        window.dispatchEvent(new Event('auth:updated'))

        window.location.replace(learnSyncUrl(`${window.location.origin}/${locale}/dashboard`, locale, token))
      })
      .catch(fail)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="flex min-h-[60vh] items-center justify-center" dir={ar ? 'rtl' : 'ltr'}>
      <p role="status" style={{ color: 'var(--ink-2)' }}>{ar ? 'جارٍ تسجيل دخولك…' : 'Signing you in…'}</p>
    </main>
  )
}
