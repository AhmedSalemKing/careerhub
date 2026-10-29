'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { post } from '@/lib/api'

interface RoomData {
  roomUrl: string
  token: string | null
  topic?: string
}

function formatTimer(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':')
}

export default function ConsultingGoLivePage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const sessionId = params.sessionId as string

  const [roomData, setRoomData] = useState<RoomData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ending, setEnding] = useState(false)
  const [ended, setEnded] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [timerStart, setTimerStart] = useState<number | null>(null)

  useEffect(() => {
    if (!sessionId) return
    async function enterRoom() {
      try {
        // Consultant path: start the room and mark it IN_PROGRESS
        const res = await post(`/consulting/sessions/${sessionId}/start-room`, {})
        const data = res.data?.data
        const roomUrl = data?.roomUrl || data?.dailyRoomUrl
        if (!roomUrl) {
          setError(isAr ? 'لم يتم إرجاع رابط الجلسة' : 'No room URL returned')
          return
        }
        setRoomData({ roomUrl, token: data?.token ?? null, topic: data?.session?.topic })
        setTimerStart(Date.now())
      } catch (startErr: any) {
        if (startErr?.response?.status === 403) {
          // Student path: join an already-running room
          try {
            const res = await post(`/consulting/sessions/${sessionId}/join-room`, {})
            const data = res.data?.data
            const roomUrl = data?.roomUrl || data?.dailyRoomUrl
            if (!roomUrl) {
              setError(isAr ? 'الجلسة لم تبدأ بعد' : 'Session has not started yet')
              return
            }
            setRoomData({ roomUrl, token: data?.token ?? null })
            setTimerStart(Date.now())
          } catch (joinErr: any) {
            setError(
              joinErr?.response?.data?.message ||
              (isAr ? 'لم تبدأ الجلسة بعد — انتظر المستشار' : 'Session not started yet — wait for the consultant')
            )
          }
        } else {
          setError(
            startErr?.response?.data?.message ||
            (isAr ? 'تعذر بدء الجلسة' : 'Failed to start session')
          )
        }
      } finally {
        setLoading(false)
      }
    }
    enterRoom()
  }, [sessionId])

  useEffect(() => {
    if (!timerStart || ended) return
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - timerStart) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [timerStart, ended])

  async function handleEnd() {
    if (ending || ended) return
    setEnding(true)
    try {
      await post(`/consulting/sessions/${sessionId}/end`, { durationSeconds: elapsed })
    } catch { }
    setEnded(true)
    router.push(`/${locale}/dashboard/client-sessions`)
  }

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        color: 'var(--foreground)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--card)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
            DeveWay
          </span>
          <span
            style={{
              padding: '2px 10px',
              borderRadius: '20px',
              background: 'color-mix(in srgb, var(--accent) 20%, transparent)',
              color: 'var(--accent)',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            {isAr ? 'جلسة مباشرة' : 'Live Session'}
          </span>
          {roomData?.topic && (
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              {roomData.topic}
            </span>
          )}
          {roomData && !ended && (
            <span
              style={{
                background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                color: 'var(--primary)',
                padding: '4px 14px',
                borderRadius: '20px',
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              {formatTimer(elapsed)}
            </span>
          )}
        </div>

        <button
          onClick={handleEnd}
          disabled={ending || ended}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background:
              ending || ended
                ? 'color-mix(in srgb, var(--error) 50%, transparent)'
                : 'var(--error)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 18px',
            cursor: ending || ended ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            fontSize: '0.875rem',
            opacity: ending ? 0.7 : 1,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
          {ended
            ? isAr ? 'تم الإنهاء' : 'Ended'
            : ending
            ? isAr ? 'جاري الإنهاء...' : 'Ending...'
            : isAr ? 'إنهاء الجلسة' : 'End Session'}
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
        {loading && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
              fontSize: '1rem',
            }}
          >
            {isAr ? 'جاري إعداد الجلسة...' : 'Setting up session...'}
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'color-mix(in srgb, var(--error) 15%, transparent)',
              color: 'var(--error)',
              border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)',
              textAlign: 'center',
              marginTop: '40px',
            }}
          >
            {error}
          </div>
        )}

        {ended && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'color-mix(in srgb, var(--accent) 20%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {isAr ? 'تم إنهاء الجلسة بنجاح' : 'Session ended successfully'}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              {isAr ? 'جاري تحويلك...' : 'Redirecting...'}
            </p>
          </div>
        )}

        {!loading && !error && !ended && roomData && (
          <div
            style={{
              flex: 1,
              minHeight: '500px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              background: '#000',
            }}
          >
            <iframe
              src={
                roomData.token
                  ? `${roomData.roomUrl}?t=${roomData.token}`
                  : roomData.roomUrl
              }
              allow="camera; microphone; fullscreen; speaker; display-capture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none', minHeight: '500px' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
