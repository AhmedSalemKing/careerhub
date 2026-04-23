let pingInterval: ReturnType<typeof setInterval> | null = null

export function startKeepAlive() {
  if (typeof window === 'undefined') return
  if (pingInterval) return // already running

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api')
    .replace(/\/api$/, '')

  const ping = async () => {
    try {
      await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      })
    } catch (_) {}
  }

  ping()
  pingInterval = setInterval(ping, 14 * 60 * 1000) // every 14 minutes
}
