'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

interface ProtectedVideoProps {
  courseId: string
  token?: string
  studentName?: string
  poster?: string | null
  locale?: string
}

const TOKEN_KEYS = [
  'deveway_token',
  'careerhub_token',
  'access_token',
  'accessToken',
  'token',
]

function readTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  for (const key of TOKEN_KEYS) {
    const v = localStorage.getItem(key) || sessionStorage.getItem(key)
    if (v) return v
  }
  const m = document.cookie.match(/deveway_token=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

function decodeEmailFromToken(raw: string): string | undefined {
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

export default function ProtectedVideo({
  courseId,
  token: tokenProp,
  studentName: studentNameProp,
  poster,
  locale = 'ar',
}: ProtectedVideoProps) {
  const isAr = locale === 'ar'
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [key, setKey] = useState(0)

  const storeUser = useAuthStore((s) => s.user)

  const token = tokenProp || readTokenFromStorage() || ''
  const studentName =
    studentNameProp ||
    storeUser?.email ||
    (token ? decodeEmailFromToken(token) : undefined) ||
    ''

  const apiBase = api.defaults.baseURL || 'https://api.deveways.com/api'
  const streamUrl = token
    ? `${apiBase}/live/stream/${courseId}?token=${encodeURIComponent(token)}`
    : ''

  const blockContext = (e: React.MouseEvent) => e.preventDefault()

  // Suppress Ctrl+S / Ctrl+U while this player is mounted.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'u', 'S', 'U'].includes(e.key)) {
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleRetry = () => {
    setRefreshing(true)
    setTimeout(() => {
      setError(false)
      setKey((k) => k + 1)
      setRefreshing(false)
    }, 600)
  }

  if (!token) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio: '16/9',
          background: '#0f1117',
          border: '1px solid #1e2333',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          direction: isAr ? 'rtl' : 'ltr',
        }}>
        <svg
          width="38"
          height="38"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#7c3aed"
          strokeWidth="1.5"
          strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <div style={{ fontWeight: 500, color: '#f3f4f6' }}>
          {isAr ? 'يجب تسجيل الدخول لمشاهدة التسجيل' : 'Sign in to watch the recording'}
        </div>
      </div>
    )
  }

  return (
    <div
      onContextMenu={blockContext}
      style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      {/* Watermark */}
      {studentName && (
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            right: 16,
            zIndex: 3,
            color: 'rgba(255,255,255,0.18)',
            fontSize: '0.72rem',
            fontWeight: 300,
            pointerEvents: 'none',
            fontFamily: "'PingAR', sans-serif",
            direction: 'rtl',
            letterSpacing: '0.05em',
          }}>
          {studentName} · DeveWay
        </div>
      )}

      {error ? (
        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            background: '#0f1117',
            border: '1px solid #1e2333',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            direction: isAr ? 'rtl' : 'ltr',
          }}>
          <svg
            width="38"
            height="38"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="1.5"
            strokeLinecap="round">
            <path d="M15 10l4.553-2.369A1 1 0 0121 8.535v6.93a1 1 0 01-1.447.894L15 14" />
            <rect x="2" y="6" width="13" height="12" rx="2" />
            <line x1="8" y1="10" x2="14" y2="16" stroke="#6b7280" strokeWidth="2" />
            <line x1="14" y1="10" x2="8" y2="16" stroke="#6b7280" strokeWidth="2" />
          </svg>
          <div style={{ fontWeight: 500, color: '#f3f4f6' }}>
            {isAr ? 'تعذّر تشغيل الفيديو' : 'Playback failed'}
          </div>
          <button
            onClick={handleRetry}
            disabled={refreshing}
            style={{
              background: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              padding: '9px 24px',
              fontSize: '0.88rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              opacity: refreshing ? 0.6 : 1,
            }}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              style={refreshing ? { animation: 'spin 1s linear infinite' } : {}}>
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
            </svg>
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
            {refreshing ? (isAr ? 'جارٍ...' : 'Loading...') : (isAr ? 'إعادة المحاولة' : 'Retry')}
          </button>
        </div>
      ) : (
        <video
          key={key}
          ref={videoRef}
          src={streamUrl}
          controls
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          playsInline
          poster={poster || undefined}
          onContextMenu={blockContext}
          onError={() => setError(true)}
          style={{ width: '100%', borderRadius: 12, display: 'block', aspectRatio: '16/9' }}
        />
      )}
    </div>
  )
}
