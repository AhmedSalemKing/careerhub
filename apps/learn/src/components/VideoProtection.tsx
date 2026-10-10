'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'

interface Props {
  userName?: string
  userEmail?: string
}

const WM_COLS = 6
const WM_ROWS = 5
const WM_TILE_COUNT = WM_COLS * WM_ROWS

const WM_TOKEN_KEYS = [
  'deveway_token',
  'careerhub_token',
  'access_token',
  'accessToken',
  'token',
]

function decodeEmailFromToken(raw: string | null): string | undefined {
  if (!raw || raw.split('.').length !== 3) return undefined
  try {
    let b = raw.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    while (b.length % 4) b += '='
    const payload = JSON.parse(atob(b))
    return typeof payload?.email === 'string' ? payload.email : undefined
  } catch {
    return undefined
  }
}

function readEmailFromStorage(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    let raw: string | null = null
    for (const key of WM_TOKEN_KEYS) {
      raw = localStorage.getItem(key)
      if (raw) break
    }
    if (!raw) {
      const m = document.cookie.match(/deveway_token=([^;]+)/)
      if (m) raw = decodeURIComponent(m[1])
    }
    return decodeEmailFromToken(raw)
  } catch {
    return undefined
  }
}

export default function VideoProtection({ userName, userEmail }: Props) {
  const storeUser = useAuthStore((s) => s.user)
  const [storageEmail, setStorageEmail] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (userEmail || storeUser?.email || storageEmail) return
    const decoded = readEmailFromStorage()
    if (decoded) setStorageEmail(decoded)
  }, [userEmail, storeUser?.email, storageEmail])

  useEffect(() => {
    // 1. Disable right-click on video area
    const preventContext = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'VIDEO' || target.closest('.video-container')) {
        e.preventDefault()
      }
    }

    // 2. Pause videos when tab is hidden
    const handleVisibility = () => {
      if (document.hidden) {
        document.querySelectorAll('video').forEach((v) => v.pause())
      }
    }

    // 3. Block common capture shortcuts
    const preventKeys = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault()
        navigator.clipboard?.writeText('').catch(() => {})
      }
      if (e.key === 'F12') e.preventDefault()
      if (e.ctrlKey && e.shiftKey && e.key === 'I') e.preventDefault()
      if (e.ctrlKey && e.key === 'u') e.preventDefault()
    }

    // 4. Override getDisplayMedia to block screen capture
    const mediaDevices = navigator.mediaDevices as any
    let originalGetDisplayMedia: typeof mediaDevices.getDisplayMedia | null = null
    if (mediaDevices?.getDisplayMedia) {
      originalGetDisplayMedia = mediaDevices.getDisplayMedia.bind(mediaDevices)
      mediaDevices.getDisplayMedia = async () => {
        document.querySelectorAll('video').forEach((v) => v.pause())
        throw new DOMException('Screen capture not allowed', 'NotAllowedError')
      }
    }

    document.addEventListener('contextmenu', preventContext)
    document.addEventListener('visibilitychange', handleVisibility)
    document.addEventListener('keydown', preventKeys)

    return () => {
      document.removeEventListener('contextmenu', preventContext)
      document.removeEventListener('visibilitychange', handleVisibility)
      document.removeEventListener('keydown', preventKeys)
      if (originalGetDisplayMedia && mediaDevices) {
        mediaDevices.getDisplayMedia = originalGetDisplayMedia
      }
    }
  }, [])

  const email = userEmail || storeUser?.email || storageEmail || ''
  const watermarkText = email
    ? `DeveWay ${email}`
    : userName
      ? `DeveWay ${userName}`
      : 'DeveWay'

  return (
    <div
      data-wm="1"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        userSelect: 'none',
        overflow: 'hidden',
        zIndex: 2147483000,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-20%',
          width: '140%',
          height: '140%',
          transform: 'rotate(-30deg)',
          display: 'grid',
          gridTemplateColumns: `repeat(${WM_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${WM_ROWS}, 1fr)`,
          gap: '50px 70px',
          opacity: 0.28,
        }}
      >
        {Array.from({ length: WM_TILE_COUNT }).map((_, i) => (
          <div
            key={i}
            dir="ltr"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              textShadow: '0 1px 2px rgba(0,0,0,0.6)',
              userSelect: 'none',
            }}
          >
            {watermarkText}
          </div>
        ))}
      </div>
    </div>
  )
}
