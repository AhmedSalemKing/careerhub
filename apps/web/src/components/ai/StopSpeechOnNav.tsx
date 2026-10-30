'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function StopSpeechOnNav() {
  const pathname = usePathname()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
    }
  }, [pathname])
  return null
}
