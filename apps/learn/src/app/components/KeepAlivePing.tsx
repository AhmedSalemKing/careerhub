'use client'

import { useEffect } from 'react'

export default function KeepAlivePing() {
  useEffect(() => {
    // Keep Render warm - ping on mount and every 5 minutes
    const ping = () => {
      fetch('https://deve-way.onrender.com/api/health', {
        signal: AbortSignal.timeout(5000)
      }).catch(() => {})
    }

    ping() // Initial ping
    const interval = setInterval(ping, 5 * 60 * 1000) // Every 5 minutes

    return () => clearInterval(interval)
  }, [])

  return null
}
