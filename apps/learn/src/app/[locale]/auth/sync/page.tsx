'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { api } from '../../../../lib/api'

const ALLOWED_RETURN_HOSTS = [
  'deveway-teal.vercel.app',
  'devewayhub.vercel.app',
  'deveway.com',
  'www.deveway.com',
  'deveways.com',
  'www.deveways.com',
  'localhost',
  '127.0.0.1',
]

function isAllowedReturn(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
    return ALLOWED_RETURN_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

/**
 * Post-login SSO bridge. The web app sends the browser here right after login
 * with ?token=...&return=<web url>. We store the token, then go back.
 * (TokenSync in the root layout also picks up ?token= and hydrates the store.)
 */
export default function AuthSyncPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'ar'

  useEffect(() => {
    const run = async () => {
    const qs = new URLSearchParams(window.location.search)
    const token = qs.get('token')
    const returnUrl = qs.get('return')

    if (token && token !== 'null' && token !== 'undefined') {
      try {
        const previous =
          localStorage.getItem('deveway_token') || localStorage.getItem('careerhub_token')
        if (previous && previous !== token) {
          // Different session: drop the previous account's cached user record
          localStorage.removeItem('deveway_user')
          localStorage.removeItem('careerhub_user')
        }
        localStorage.setItem('deveway_token', token)
        localStorage.setItem('careerhub_token', token)
      } catch {}

      // Fetch the user NOW so the page we land on already has it in storage
      // (the auth store hydrates from it) instead of rendering signed-in but
      // user-less. Bounded so a slow API cannot stall the login.
      try {
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 4000,
        })
        const body = (res.data as any)?.data ?? res.data
        const user = body?.user ?? body
        if (user?.id) {
          const json = JSON.stringify(user)
          localStorage.setItem('deveway_user', json)
          localStorage.setItem('careerhub_user', json)
        }
      } catch {}
    }

    const dest = returnUrl && isAllowedReturn(returnUrl) ? returnUrl : `/${locale}/courses`
    // Drop the token from the URL/history before leaving
    window.history.replaceState({}, '', window.location.pathname)
    window.location.replace(dest)
    }
    run()
  }, [locale])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--background)' }}>
      <p style={{ fontFamily: 'PingAR, sans-serif', fontWeight: 300, color: 'var(--muted)', fontSize: 14 }}>
        {locale === 'en' ? 'Signing you in...' : 'جاري تسجيل الدخول...'}
      </p>
    </div>
  )
}
