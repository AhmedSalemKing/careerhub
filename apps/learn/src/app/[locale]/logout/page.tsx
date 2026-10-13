'use client'

import { useEffect } from 'react'

const AUTH_KEYS = [
  'deveway_token', 'deveway_refresh', 'deveway_user',
  'careerhub_token', 'careerhub_refresh', 'careerhub_user',
  'token', 'accessToken', 'access_token', 'auth_token',
  'refreshToken', 'userName', 'user_name', 'user_avatar',
]

const ALLOWED_RETURN_HOSTS = [
  'deveway-teal.vercel.app',
  'devewayhub.vercel.app',
  'deveway.com',
  'www.deveway.com',
]

function isAllowedReturn(url: string): boolean {
  try {
    const u = new URL(url)
    return ALLOWED_RETURN_HOSTS.includes(u.hostname)
  } catch {
    return false
  }
}

export default function LogoutPage() {
  useEffect(() => {
    // 1) Clear all auth keys
    AUTH_KEYS.forEach((k) => {
      try { localStorage.removeItem(k) } catch {}
      try { sessionStorage.removeItem(k) } catch {}
    })

    // 2) Clear any auth-looking non-httpOnly cookies
    try {
      document.cookie.split(';').forEach((c) => {
        const name = c.split('=')[0].trim()
        if (name && /token|auth|session|user/i.test(name)) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        }
      })
    } catch {}

    // 3) Zap any IndexedDB / caches that could hold auth
    try { if ('caches' in window) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
    } } catch {}

    // 4) Determine destination — from ?return= if whitelisted, else web login
    const params = new URLSearchParams(window.location.search)
    const returnUrl = params.get('return')
    const locale = window.location.pathname.split('/')[1] || 'ar'

    const dest = returnUrl && isAllowedReturn(returnUrl)
      ? returnUrl
      : `https://deveway-teal.vercel.app/${locale}/login`

    // 5) Navigate away immediately. Every clear above is synchronous, so there is
    // nothing to wait for. Doing this synchronously (instead of a 250ms timer
    // whose cleanup could cancel it before it fires) guarantees the redirect runs.
    const go = () => {
      try {
        // location.replace avoids adding this page to browser history
        window.location.replace(dest)
      } catch {
        window.location.href = dest
      }
    }
    go()
  }, [])

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background, #0d0d12)',
        color: 'var(--foreground, #f5f5f7)',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '3px solid rgba(81,32,200,0.2)',
            borderTopColor: '#5120c8',
            margin: '0 auto 1rem',
            animation: 'dv-spin 0.8s linear infinite',
          }}
        />
        <p style={{ fontSize: '0.95rem', opacity: 0.75, margin: 0 }}>
          جارٍ تسجيل الخروج...
        </p>
        <style>{`@keyframes dv-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}
