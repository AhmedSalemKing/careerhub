'use client'
import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

interface Props {
  userName?: string
  userEmail?: string
}

const WM_COLS = 6
const WM_ROWS = 4

export default function VideoProtection({ userName, userEmail }: Props) {
  const storeUser = useAuthStore((s) => s.user)

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

  const email = userEmail || storeUser?.email || ''
  const watermarkText = email
    ? `DeveWay ${email}`
    : userName
      ? `DeveWay ${userName}`
      : 'DeveWay'

  return (
    <div
      data-wm="1"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        userSelect: 'none',
        overflow: 'hidden',
        zIndex: 5,
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
          opacity: 0.22,
        }}
      >
        {Array.from({ length: WM_COLS * WM_ROWS }).map((_, i) => (
          <div
            key={i}
            dir="ltr"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
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
