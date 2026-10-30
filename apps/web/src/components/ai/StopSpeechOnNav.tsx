'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function StopSpeechOnNav() {
  const pathname = usePathname()

  useEffect(() => {
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
  }, [pathname])

  return null
}
