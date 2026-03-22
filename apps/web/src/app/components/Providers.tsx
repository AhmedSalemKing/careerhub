'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import type { Locale } from '../../i18n'
import { ToastProvider } from '../../lib/toast'
import { useAuthStore } from '../../stores/authStore'
import { useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode; locale: Locale }) {
  const [queryClient] = useState(() => new QueryClient())
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  )
}

