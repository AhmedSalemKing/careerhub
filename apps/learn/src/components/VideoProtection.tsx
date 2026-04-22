'use client'
import { useEffect } from 'react'

interface Props {
  userName?: string
  userEmail?: string
}

export default function VideoProtection({ userName, userEmail }: Props) {
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

  const watermarkText = userName || userEmail || 'DeveWay'

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${(i % 5) * 22 + 5}%`,
            top: `${Math.floor(i / 5) * 25 + 10}%`,
            color: 'rgba(255,255,255,0.06)',
            fontSize: '14px',
            fontWeight: 600,
            transform: 'rotate(-30deg)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          {watermarkText}
        </div>
      ))}
    </div>
  )
}
