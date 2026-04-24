import { post } from './api'

const tracked = new Set<string>()

export function trackPageView(page: string) {
  const key = page
  if (tracked.has(key)) return
  tracked.add(key)

  post('/users/track-activity', {
    action: 'PAGE_VIEW',
    page,
    metadata: { timestamp: Date.now() },
  }).catch(() => {})

  setTimeout(() => tracked.delete(key), 30000)
}

export function trackAction(action: string, metadata?: Record<string, any>) {
  post('/users/track-activity', {
    action,
    metadata,
  }).catch(() => {})
}