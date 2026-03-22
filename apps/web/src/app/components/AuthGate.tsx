'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useAuthStore } from '../../stores/authStore'

export function AuthGate({
  children,
  requireRole,
}: {
  children: React.ReactNode
  requireRole?: 'ADMIN' | 'COACH'
}) {
  const router = useRouter()
  const locale = useLocale()
  const { user } = useAuthStore()
  const [ready, setReady] = useState(false)
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current) return
    checked.current = true

    const token = localStorage.getItem('careerhub_token')
    if (!token) {
      router.replace(`/${locale}/login`)
      return
    }

    setReady(true)
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (requireRole && user && user.role !== requireRole) {
    router.replace(`/${locale}/dashboard`)
    return null
  }

  return <>{children}</>
}
