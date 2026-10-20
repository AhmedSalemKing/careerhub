'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import type { Locale } from '../../i18n'
import { ToastProvider } from '../../lib/toast'
import { useAuthStore } from '../../stores/authStore'
import { createQueryClient } from '../../lib/query-client'
import { syncAuthUser } from '../../lib/auth-sync'

export function Providers({ children }: { children: React.ReactNode; locale: Locale }) {
  const [queryClient] = useState(() => createQueryClient())
  const hydrate = useAuthStore((s) => s.hydrate)
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    hydrate()

    // After hydrating, refresh the user from /auth/me (cross-domain cookie
    // logins). syncAuthUser() is single-flight, so this shares one request
    // with the other callers instead of firing its own.
    syncAuthUser()
  }, [hydrate])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  )
}
