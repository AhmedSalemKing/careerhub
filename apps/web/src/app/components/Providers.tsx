'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import type { Locale } from '../../i18n'
import { ToastProvider } from '../../lib/toast'
import { useAuthStore } from '../../stores/authStore'
import { createQueryClient } from '../../lib/query-client'
import { startKeepAlive } from '../../lib/keepAlive'
import { ThemeProvider, useTheme } from 'next-themes'
import { SiteConfigProvider } from '../contexts/SiteConfigContext'
import { normalisePrimary } from '../../lib/utils'

export const SITE_NAME = 'DeveWay'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

/* ══════════════════════════════════════
   ✅ FIXED: Smart Background Handling
   ══════════════════════════════════════ */
const DARK_HEX_PATTERNS = /^#(0d0d0d|000000|111111|1a1a1a|0a0a0a|0d0d10|0a0a15)$/i

function isDarkColor(hex: string): boolean {
  return DARK_HEX_PATTERNS.test(hex.trim())
}

export function applySiteSettings(s: {
  primaryColor?: string
  backgroundColor?: string
  buttonColor?: string
  siteName?: string
}) {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  const isDarkMode = root.classList.contains('dark')
  
  // Primary Color - always apply, but never let DB blue override brand purple
  if (s.primaryColor) {
    const primary = normalisePrimary(s.primaryColor)
    root.style.setProperty('--primary', primary)
    root.style.setProperty('--primary-hover', primary)
    root.style.setProperty('--primary-foreground', '#ffffff')
    root.style.setProperty('--primary-fg', '#ffffff')
    try {
      root.style.setProperty('--primary-rgb', hexToRgb(primary))
    } catch {}
  }
  
  /* ── Background: Only set for LIGHT mode, skip if dark color ── */
  if (s.backgroundColor) {
    if (!isDarkMode && !isDarkColor(s.backgroundColor)) {
      root.style.setProperty('--background', s.backgroundColor)
    }
    // Dark mode: DON'T override - let CSS handle it with #0D0D0D
  }
  
  if (s.buttonColor) root.style.setProperty('--button-color', s.buttonColor)
  
  document.title = s.siteName || SITE_NAME
}

/* ── Handles smooth transition when theme changes ── */
function ThemeTransitionHandler({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const prevTheme = useRef(resolvedTheme)

  useEffect(() => {
    const html = document.documentElement

    requestAnimationFrame(() => {
      html.classList.remove('no-transition')
    })

    if (prevTheme.current && prevTheme.current !== resolvedTheme) {
      html.classList.add('theme-transition')
      html.style.colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light'

      const timeout = setTimeout(() => {
        html.classList.remove('theme-transition')
      }, 350)

      return () => clearTimeout(timeout)
    }

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

  useEffect(() => {
    startKeepAlive()
  }, [])

  // Load site settings
  useEffect(() => {
    fetch(`${API_BASE}/admin/site-settings`)
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
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="deveway-theme"
    >
      <ThemeTransitionHandler>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <SiteConfigProvider>{children}</SiteConfigProvider>
          </ToastProvider>
        </QueryClientProvider>
      </ThemeTransitionHandler>
    </ThemeProvider>
  )
}