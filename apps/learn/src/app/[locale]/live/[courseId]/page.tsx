'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Mic, MicOff, Video, VideoOff, Users, X, Radio, Volume2, VolumeX, Maximize, Minimize, LogOut } from 'lucide-react'

export default function LivePage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale() as 'ar' | 'en'
  const isAr = locale === 'ar'
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string

  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewerCount, setViewerCount] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const clientRef = useRef<any>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  useEffect(() => {
    let cleanup: (() => void) | undefined

    const join = async () => {
      try {
        const agoraToken = sessionStorage.getItem('agora_token')
        const channelName = sessionStorage.getItem('agora_channel')
        const uid = parseInt(sessionStorage.getItem('agora_uid') || '0')
        const appId = sessionStorage.getItem('agora_appid')

        if (!agoraToken || !channelName || !appId) {
          setError(isAr ? 'بيانات البث غير متاحة' : 'Stream credentials not found')
          setLoading(false)
          return
        }

        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
        AgoraRTC.setLogLevel(4)

        const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
        client.setClientRole('audience')
        clientRef.current = client

        client.on('user-joined', () => setViewerCount(v => v + 1))
        client.on('user-left', () => setViewerCount(v => Math.max(0, v - 1)))

        client.on('user-published', async (user: any, mediaType: string) => {
          await client.subscribe(user, mediaType as 'video' | 'audio')
          if (mediaType === 'video' && remoteVideoRef.current) {
            user.videoTrack?.play(remoteVideoRef.current)
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play()
          }
        })

        client.on('user-unpublished', (user: any, mediaType: string) => {
          if (mediaType === 'video') user.videoTrack?.stop()
          if (mediaType === 'audio') user.audioTrack?.stop()
        })

        await client.join(appId, channelName, agoraToken, uid)
        setJoined(true)
        setLoading(false)

        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''
        if (token) {
          fetch(`${API}/live/viewers/${courseId}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ delta: 1 })
          }).catch(() => { })
        }

        cleanup = () => {
          if (token) {
            fetch(`${API}/live/viewers/${courseId}`, {
              method: 'PATCH',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ delta: -1 })
            }).catch(() => { })
          }
          client.leave().catch(() => { })
        }

      } catch (e: any) {
        console.error('Agora error:', e)
        setError(e.message || (isAr ? 'فشل الاتصال بالبث' : 'Failed to connect to stream'))
        setLoading(false)
      }
    }

    join()

    return () => {
      cleanup?.()
    }
  }, [courseId])

  const handleLeave = async () => {
    try {
      if (clientRef.current) {
        await clientRef.current.leave()
      }
    } catch (e) { }
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''
    if (token) {
      fetch(`${API}/live/viewers/${courseId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: -1 })
      }).catch(() => { })
    }
    router.back()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(220,38,38,0.3)', borderTopColor: '#dc2626', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{isAr ? 'جاري الانضمام للبث...' : 'Connecting to stream...'}</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
      <Radio size={48} color="rgba(220,38,38,0.5)" />
      <p style={{ color: '#dc2626', fontSize: 16, fontWeight: 700, textAlign: 'center' }}>{error}</p>
      <button onClick={() => router.back()} style={{ padding: '11px 24px', borderRadius: 11, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
        {isAr ? 'العودة' : 'Go Back'}
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', direction: isAr ? 'rtl' : 'ltr' }}>

      {/* Header bar */}
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'block', animation: 'pulse 2s infinite' }} />
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
          <span style={{ color: '#dc2626', fontSize: 12, fontWeight: 800 }}>{isAr ? 'بث مباشر' : 'LIVE'}</span>
        </div>
        {viewerCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
            <Users size={12} />
            {viewerCount} {isAr ? 'مشاهد' : 'watching'}
          </div>
        )}
        <button onClick={handleLeave} style={{ marginRight: isAr ? 0 : 'auto', marginLeft: isAr ? 'auto' : 0, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: 'rgba(220,38,38,0.2)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.3)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
          <LogOut size={13} />
          {isAr ? 'مغادرة البث' : 'Leave Stream'}
        </button>
      </div>

      {/* Video area */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div ref={remoteVideoRef} style={{ width: '100%', maxWidth: 1080, aspectRatio: '16/9', background: '#111' }} />

        {/* Waiting for host */}
        {joined && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}>
            <Radio size={48} color="rgba(220,38,38,0.5)" style={{ marginBottom: 12 }} />
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              {isAr ? 'في انتظار المحاضر...' : 'Waiting for the instructor...'}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'center', gap: 12, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => setIsMuted(m => !m)} style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isMuted ? 'rgba(255,255,255,0.1)' : '#5120c8', border: 'none', cursor: 'pointer', color: '#fff' }}>
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <button onClick={() => setIsFullscreen(f => !f)} style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#fff' }}>
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
        <button onClick={handleLeave} style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#dc2626', border: 'none', cursor: 'pointer', color: '#fff' }}>
          <LogOut size={18} />
        </button>
      </div>
    </div>
  )
}
