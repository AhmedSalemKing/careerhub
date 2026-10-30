'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function StopSpeechOnNav() {
  const pathname = usePathname()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
      document.querySelectorAll('audio').forEach(a => {
        a.pause()
        a.currentTime = 0
      })
    }
  }, [pathname])
  return null
}
