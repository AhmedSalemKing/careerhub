'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import type { Locale } from '../../i18n'
import { ToastProvider } from '../../lib/toast'
import { useAuthStore } from '../../stores/authStore'
import { createQueryClient } from '../../lib/query-client'
import { ThemeProvider, useTheme } from 'next-themes'

export const SITE_NAME = 'DeveWay'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

export function applySiteSettings(s: {
  primaryColor?: string
  backgroundColor?: string
  buttonColor?: string
  siteName?: string
}) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (s.primaryColor) {
    root.style.setProperty('--primary', s.primaryColor)
    root.style.setProperty('--primary-hover', s.primaryColor)
    try {
      root.style.setProperty('--primary-rgb', hexToRgb(s.primaryColor))
    } catch {}
  }
  if (s.backgroundColor) root.style.setProperty('--background', s.backgroundColor)
  if (s.buttonColor) root.style.setProperty('--button-color', s.buttonColor)
  document.title = s.siteName || SITE_NAME
}

/* ── Handles smooth transition when theme changes ── */
function ThemeTransitionHandler({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme } = useTheme()
  const prevTheme = useRef(resolvedTheme)

  useEffect(() => {
    const html = document.documentElement

    // Remove no-transition on first load (after layout script sets initial theme)
    requestAnimationFrame(() => {
      html.classList.remove('no-transition')
    })

    // Add smooth transition when theme actually changes
    if (prevTheme.current && prevTheme.current !== resolvedTheme) {
      html.classList.add('theme-transition')
      html.style.colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light'

      const timeout = setTimeout(() => {
        html.classList.remove('theme-transition')
      }, 350)

      return () => clearTimeout(timeout)
    }

    // Always keep colorScheme in sync
    if (resolvedTheme) {
      html.style.colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light'
    }

    prevTheme.current = resolvedTheme
  }, [resolvedTheme])

  return <>{children}</>
}

/* ── Main Providers ── */
export function Providers({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const [queryClient] = useState(() => createQueryClient())
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Load site settings and apply CSS variables on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/admin/site-settings`)
      .then((r) => r.json())
      .then((res) => {
        const s = res?.data?.settings ?? res?.data
        if (s && typeof s === 'object') applySiteSettings(s)
      })
      .catch(() => {
        if (typeof document !== 'undefined') document.title = SITE_NAME
      })
  }, [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange
    >
      <ThemeTransitionHandler>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>{children}</ToastProvider>
        </QueryClientProvider>
      </ThemeTransitionHandler>
    </ThemeProvider>
  )
}