'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function StopSpeechOnNav() {
  const pathname    = usePathname()
  const prevPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (prevPathRef.current !== null && prevPathRef.current !== pathname) {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel()
      }
      if (typeof document !== 'undefined') {
        document.querySelectorAll('audio').forEach((a) => {
          try {
            a.pause()
            a.currentTime = 0
            a.src = ''
            a.load()
          } catch { /* ignore */ }
        })
      }
    }
    prevPathRef.current = pathname
  }, [pathname])

  return null
}
