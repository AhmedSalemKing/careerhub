'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import type { Locale } from '../../i18n'
import { ToastProvider } from '../../lib/toast'
import { useAuthStore } from '../../stores/authStore'
import { createQueryClient } from '../../lib/query-client'
import { api } from '../../lib/api'
import type { AuthUser } from '../../stores/authStore'

type ApiResponse<T> = { data?: T }

export function Providers({ children }: { children: React.ReactNode; locale: Locale }) {
  const [queryClient] = useState(() => createQueryClient())
  const hydrate = useAuthStore((s) => s.hydrate)
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    hydrate()

    // After hydrating, fetch /auth/me to refresh user data.
    // This enables cross-domain auth: if the token came from a cookie
    // (set on another port/subdomain), the user object is fetched fresh.
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('deveway_token') ?? document.cookie.match(/deveway_token=([^;]+)/)?.[1])
      : null

    if (token) {
      api
        .get<ApiResponse<{ user: AuthUser }>>('/auth/me')
        .then((res) => {
          const user = res.data?.data?.user
          if (user) useAuthStore.getState().setUser(user)
        })
        .catch(() => {
          // Silently ignore — token might be expired; interceptor handles redirect
        })
    }
  }, [hydrate])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  )
}
