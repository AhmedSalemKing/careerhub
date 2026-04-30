'use client'
import { useState, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { get, post } from '../../../../../../lib/api'
import { AuthGate } from '../../../../../components/AuthGate'
import {
  Radio, Users, Clock, Copy, Check, CheckCircle2,
  Mic, MicOff, Video, VideoOff, X,
  Play, Square
} from 'lucide-react'

export default function GoLivePage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [liveStarted, setLiveStarted] = useState(false)
  const [starting, setStarting] = useState(false)
  const [ending, setEnding] = useState(false)
  const [agoraData, setAgoraData] = useState<any>(null)
  const [viewerCount, setViewerCount] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [copied, setCopied] = useState(false)
  const [micEnabled, setMicEnabled] = useState(true)
  const [camEnabled, setCamEnabled] = useState(true)
  const localVideoRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<any>(null)
  const localTrackRef = useRef<any[]>([])
  const timerRef = useRef<any>(null)

  const bg = '#0d0d0d'
  const cardBg = '#111111'
  const border = 'rgba(255,255,255,0.08)'
  const text = '#f1f5f9'
  const subtext = '#94a3b8'

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await get(`/courses/${courseId}`)
      return res.data?.data ?? res.data
    }
  })

  const courseTitle = course?.titleAr || course?.titleEn || course?.title || ''

  useEffect(() => {
    if (liveStarted) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(timerRef.current)
      setElapsed(0)
    }
    return () => clearInterval(timerRef.current)
  }, [liveStarted])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  const handleStartLive = async () => {
    setStarting(true)
    try {
      const res = await post(`/live/start/${courseId}`, {})
      const data = res.data?.data ?? res.data

      if (!data?.token) throw new Error('No token received')

      setAgoraData(data)

      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      AgoraRTC.setLogLevel(4)

      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
      await client.setClientRole('host')
      clientRef.current = client

      client.on('user-joined', () => setViewerCount(v => v + 1))
      client.on('user-left', () => setViewerCount(v => Math.max(0, v - 1)))

      await client.join(data.appId, data.channelName, data.token, 1)

      const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
      localTrackRef.current = [micTrack, camTrack]

      if (localVideoRef.current) {
        camTrack.play(localVideoRef.current)
      }

      await client.publish([micTrack, camTrack])
      setLiveStarted(true)
      alert(isAr ? 'بدأ البث المباشر!' : 'Live stream started!')
    } catch(e: any) {
      console.error(e)
      alert(e.message || (isAr ? 'فشل بدء البث' : 'Failed to start live'))
    } finally {
      setStarting(false)
    }
  }

  const handleEndLive = async () => {
    if (!confirm(isAr ? 'هل تريد إنهاء البث المباشر؟' : 'End the live stream?')) return
    setEnding(true)
    try {
      localTrackRef.current.forEach((t: any) => { t.stop(); t.close() })
      if (clientRef.current) await clientRef.current.leave()

      await post(`/live/end/${courseId}`, {})
      alert(isAr ? 'تم إنهاء البث' : 'Live stream ended')
      router.push(`/${locale}/dashboard/my-courses`)
    } catch(e: any) {
      alert(e.message || (isAr ? 'حدث خطأ' : 'Error'))
    } finally {
      setEnding(false)
    }
  }

  const toggleMic = async () => {
    const micTrack = localTrackRef.current[0]
    if (micTrack) {
      micTrack.setEnabled(!micTrack.enabled)
      setMicEnabled(micTrack.enabled)
    }
  }

  const toggleCam = async () => {
    const camTrack = localTrackRef.current[1]
    if (camTrack) {
      camTrack.setEnabled(!camTrack.enabled)
      setCamEnabled(camTrack.enabled)
    }
  }

  const liveLink = typeof window !== 'undefined'
    ? `${window.location.origin}/${locale}/courses`
    : `/${locale}/courses`

  return (
    <AuthGate>
      <div style={{ minHeight: '100vh', background: bg, direction: isAr ? 'rtl' : 'ltr' }}>
        <style>{`
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
          @keyframes spin{to{transform:rotate(360deg)}}
        `}</style>

        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 14, background: '#0a0a0a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            {liveStarted && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', display: 'block', animation: 'pulse 2s infinite' }} />}
            <span style={{ color: liveStarted ? '#dc2626' : subtext, fontSize: 13, fontWeight: 800 }}>
              {liveStarted ? (isAr ? 'البث جاري الآن' : 'LIVE') : (isAr ? 'استوديو البث' : 'Live Studio')}
            </span>
            {liveStarted && <span style={{ color: '#dc2626', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>{formatTime(elapsed)}</span>}
          </div>

          {liveStarted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: subtext, fontSize: 12 }}>
              <Users size={13} />
              {viewerCount} {isAr ? 'مشاهد' : 'viewers'}
            </div>
          )}

          <button onClick={() => router.push(`/${locale}/dashboard/my-courses`)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtext }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

            {/* Video preview */}
            <div>
              <div ref={localVideoRef} style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {!liveStarted && (
                  <div style={{ textAlign: 'center', padding: 24 }}>
                    <Radio size={48} color="rgba(220,38,38,0.3)" style={{ marginBottom: 12 }} />
                    <p style={{ color: subtext, fontSize: 14 }}>{isAr ? 'اضغط "بدء البث" لتفعيل الكاميرا' : 'Click "Start Live" to enable camera'}</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              {liveStarted && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                  <button
                    onClick={toggleCam}
                    style={{ width: 44, height: 44, borderRadius: '50%', background: camEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(220,38,38,0.3)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    {camEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                  </button>
                  <button
                    onClick={toggleMic}
                    style={{ width: 44, height: 44, borderRadius: '50%', background: micEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(220,38,38,0.3)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                  </button>
                  <button onClick={handleEndLive} disabled={ending} style={{ height: 44, paddingInline: 20, borderRadius: 22, background: '#dc2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, fontWeight: 700 }}>
                    <Square size={14} />{isAr ? 'إنهاء البث' : 'End Stream'}
                  </button>
                </div>
              )}
            </div>

            {/* Side panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Course info */}
              <div style={{ background: cardBg, borderRadius: 14, border: `1px solid ${border}`, padding: '16px' }}>
                <h3 style={{ color: text, fontSize: 14, fontWeight: 800, margin: '0 0 6px' }}>{courseTitle}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Radio size={12} color="#dc2626" />
                  <span style={{ color: '#dc2626', fontSize: 12, fontWeight: 700 }}>{isAr ? 'بث مباشر' : 'Live Course'}</span>
                </div>
              </div>

              {/* Start/End button */}
              {!liveStarted ? (
                <button onClick={handleStartLive} disabled={starting} style={{ width: '100%', padding: '16px', borderRadius: 14, background: '#dc2626', color: '#ffffff', border: 'none', cursor: starting ? 'wait' : 'pointer', fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: starting ? 0.7 : 1 }}>
                  {starting
                    ? <><div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />{isAr ? 'جاري التحضير...' : 'Preparing...'}</>
                    : <><Play size={18} />{isAr ? 'بدء البث المباشر' : 'Start Live Stream'}</>}
                </button>
              ) : (
                <button onClick={handleEndLive} disabled={ending} style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(220,38,38,0.15)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.3)', cursor: ending ? 'wait' : 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Square size={15} />{isAr ? 'إنهاء البث' : 'End Stream'}
                </button>
              )}

              {/* Share link */}
              <div style={{ background: cardBg, borderRadius: 14, border: `1px solid ${border}`, padding: '14px' }}>
                <div style={{ color: subtext, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                  {isAr ? 'رابط الكورس للطلاب' : 'Course Link for Students'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: subtext, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {liveLink}
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(liveLink); setCopied(true); setTimeout(() => setCopied(false), 2000) }} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copied ? '#16a34a' : subtext, flexShrink: 0 }}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              {!liveStarted && (
                <div style={{ background: 'rgba(220,38,38,0.06)', borderRadius: 14, border: '1px solid rgba(220,38,38,0.2)', padding: '14px' }}>
                  <div style={{ color: '#dc2626', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                    {isAr ? 'قبل البدء' : 'Before Going Live'}
                  </div>
                  {[
                    isAr ? 'تأكد من اتصال الإنترنت' : 'Check internet connection',
                    isAr ? 'اسمح بالوصول للكاميرا والميكروفون' : 'Allow camera & mic access',
                    isAr ? 'سيتم إشعار الطلاب تلقائياً' : 'Students will be notified automatically',
                  ].map((tip, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <CheckCircle2 size={12} color="#dc2626" />
                      <span style={{ color: subtext, fontSize: 11 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  )
}
