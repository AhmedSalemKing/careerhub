'use client'

import { useEffect } from 'react'

// Auth keys the learn app (and the web token bridge) can leave behind
const AUTH_KEYS = [
  'deveway_token', 'deveway_refresh', 'deveway_user',
  'careerhub_token', 'careerhub_refresh', 'careerhub_user',
  'token', 'accessToken', 'access_token', 'auth_token',
  'refreshToken', 'userName', 'user_name', 'user_avatar',
]

// Only redirect back to the web app or this app (prevents open redirects)
function isAllowedReturn(url: string): boolean {
  let origin: string
  try { origin = new URL(url).origin } catch { return false }
  const allowed = [
    window.location.origin,
    process.env.NEXT_PUBLIC_MAIN_URL,
    process.env.NEXT_PUBLIC_WEB_URL,
    'https://deveway-teal.vercel.app',
  ]
  return allowed.some((u) => {
    if (!u) return false
    try { return new URL(u).origin === origin } catch { return false }
  })
}

/**
 * Cross-app logout bridge. The web app sends the user here on logout so the
 * learn origin's session is cleared too, then this page returns to `?return=`.
 */
export default function LogoutPage() {
  useEffect(() => {
    AUTH_KEYS.forEach((k) => {
      try { localStorage.removeItem(k) } catch {}
      try { sessionStorage.removeItem(k) } catch {}
    })

    // Clear auth-looking cookies on this origin (host-only, path=/)
    try {
      document.cookie.split(';').forEach((c) => {
        const name = c.split('=')[0].trim()
        if (name && /token|auth|session|user/i.test(name)) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        }
      })
    } catch {}

    const seg = window.location.pathname.split('/')[1]
    const locale = seg === 'en' ? 'en' : 'ar'
    let returnUrl = ''
    try { returnUrl = new URLSearchParams(window.location.search).get('return') || '' } catch {}
    const dest = returnUrl && isAllowedReturn(returnUrl) ? returnUrl : `/${locale}`

    const t = setTimeout(() => { window.location.replace(dest) }, 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--background)', color: 'var(--foreground)',
      fontFamily: 'inherit',
    }}>
      <p style={{ fontSize: '0.95rem', opacity: 0.7 }}>
        جارٍ تسجيل الخروج...
      </p>
    </div>
  )
}
