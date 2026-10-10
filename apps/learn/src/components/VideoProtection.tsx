'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'

interface Props {
  userName?: string
  userEmail?: string
}

export default function VideoProtection({ userName, userEmail }: Props) {
  const storeUser = useAuthStore((s) => s.user)
  const [wmPos, setWmPos] = useState({ top: '88%', left: '88%' })

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

  // Anti screen-recording hardening: reposition the watermark every ~9s
  // so a recording cannot simply be cropped to remove it.
  useEffect(() => {
    const move = () => {
      const top = 10 + Math.random() * 75 // 10% – 85%
      const left = 10 + Math.random() * 75 // 10% – 85%
      setWmPos({ top: `${top}%`, left: `${left}%` })
    }
    const interval = setInterval(move, 9000)
    return () => clearInterval(interval)
  }, [])

  const email = userEmail || storeUser?.email || ''
  const watermarkText = email
    ? `DeveWay ${email}`
    : userName
      ? `DeveWay ${userName}`
      : 'DeveWay'

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
      <div
        data-wm="1"
        dir="ltr"
        style={{
          position: 'absolute',
          top: wmPos.top,
          left: wmPos.left,
          transition: 'top 1.2s ease, left 1.2s ease',
          color: '#ffffff',
          opacity: 0.4,
          fontSize: '13px',
          fontWeight: 600,
          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          pointerEvents: 'none',
          direction: 'ltr',
        }}
      >
        {watermarkText}
      </div>
    </div>
  )
}
