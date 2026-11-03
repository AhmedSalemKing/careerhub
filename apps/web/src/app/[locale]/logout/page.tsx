'use client'

import { useEffect } from 'react'
import { removeRefreshToken, removeToken, removeUser } from '../../../lib/auth'

/**
 * Web-side logout landing page. Learn redirects here after clearing its own
 * session, so a logout started on learn also signs the user out of web.
 * It never redirects back to learn, so there is no logout loop: web-initiated
 * logout goes web -> learn /logout?return=<web login>, learn-initiated logout
 * goes learn /logout -> web /logout -> web login.
 */
const AUTH_KEYS = [
  'deveway_token', 'deveway_refresh', 'deveway_user',
  'careerhub_token', 'careerhub_refresh', 'careerhub_user',
  'token', 'access_token', 'refresh_token', 'user',
  'auth-storage', 'deveway-auth',
]

const COOKIE_NAMES = [
  'deveway_token', 'deveway_refresh', 'deveway_user',
  'careerhub_token', 'careerhub_refresh', 'careerhub_user',
  'access_token', 'token',
]

export default function WebLogoutPage() {
  useEffect(() => {
    // Shared helpers first (they also clear the domain-scoped cookies)
    try { removeToken(); removeRefreshToken(); removeUser() } catch {}

    AUTH_KEYS.forEach((k) => {
      try { localStorage.removeItem(k) } catch {}
      try { sessionStorage.removeItem(k) } catch {}
    })

    // Cookies may have been written host-only, on the parent domain, with
    // SameSite=Lax or SameSite=None; Secure. A delete must match the Domain
    // it was set with, so clear each name for every variation.
    const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT'
    const host = window.location.hostname
    const parent = host.split('.').slice(-2).join('.')
    const domains = ['', host, `.${host}`, parent, `.${parent}`]
    COOKIE_NAMES.forEach((name) => {
      domains.forEach((domain) => {
        const d = domain ? `; domain=${domain}` : ''
        try {
          document.cookie = `${name}=; ${expired}; path=/${d}`
          document.cookie = `${name}=; ${expired}; path=/${d}; SameSite=None; Secure`
        } catch {}
      })
    })

    try { window.dispatchEvent(new Event('auth:updated')) } catch {}

    const seg = window.location.pathname.split('/')[1]
    const locale = seg === 'en' ? 'en' : 'ar'
    window.location.replace(`/${locale}/login`)
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p style={{ fontFamily: 'sans-serif', color: 'var(--muted-foreground, #888)' }}>
        جاري تسجيل الخروج...
      </p>
    </div>
  )
}
