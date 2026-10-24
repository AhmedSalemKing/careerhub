'use client'
import { useState, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { get, post } from '../../../../../../lib/api'
import { AuthGate } from '@/app/components/AuthGate'
import { learnUrlWithToken } from '../../../../../../lib/learn-link'
import {
  Radio, Users, Copy, Check, Mic, MicOff,
  Video, VideoOff, X, CheckCircle2, Play, Square,
  MonitorUp, Hand, MessageSquare, TrendingUp,
  UserCheck, UserX, Send, Wifi, WifiOff, Info,
} from 'lucide-react'
import { useLiveSocket } from '../../../../../../hooks/useLiveSocket'
import { confirmToast } from '../../../../../../lib/confirm-toast'
import { LIVE_RECORDING_SUPPORTED, liveRecordingNote, formatLiveTime } from '../../../../../../lib/live'
import toast from 'react-hot-toast'

export default function GoLivePage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const searchParams = useSearchParams()
  const lessonId = searchParams?.get('lessonId') || null

  const border = 'rgba(255,255,255,0.08)'
  const cardBg = '#111111'
  const text = '#f1f5f9'
  const subtext = '#94a3b8'

  const [liveStarted, setLiveStarted] = useState(false)
  const [starting, setStarting] = useState(false)
  const [ending, setEnding] = useState(false)
  // True once the stream is over: the page stays open while the recording is
  // uploaded, so the "End Stream" button must not be usable any more.
  const [streamEnded, setStreamEnded] = useState(false)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [screenSharing, setScreenSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [peakViewers, setPeakViewers] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [activeTab, setActiveTab] = useState<'questions'|'comments'>('questions')
  const [newComment, setNewComment] = useState('')
  const [pipPos, setPipPos] = useState({ x: 16, y: 16 })
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  // ── Preparation progress (Issue 1) ──────────────────────────────────────
  //  camera     -> getUserMedia running; no API call has been made yet
  //  server     -> camera preview is on screen, Agora token fetching in background
  //  ready      -> preview live + token warmed up, safe to go live
  //  connecting -> user pressed Go Live (POST /live/start + Agora join)
  type PrepStage = 'camera' | 'server' | 'ready' | 'connecting'
  const [prepStage, setPrepStage] = useState<PrepStage>('camera')
  const [prepNote, setPrepNote] = useState('')
  const [previewActive, setPreviewActive] = useState(false)
  // State of the background server warm-up. 'failed' means the API could not
  // be reached — the page shows a retry button instead of a blank screen.
  const [serverState, setServerState] = useState<'idle' | 'connecting' | 'ready' | 'failed'>('idle')
  const [serverError, setServerError] = useState('')
  // Bumping this re-runs only the background warm-up (the camera is left
  // untouched), so a retry never re-asks for the camera permission.
  const [warmUpAttempt, setWarmUpAttempt] = useState(0)
  // The channel/appId of the session that just went live. It is announced to
  // the room as soon as the shared (hook) socket is connected — the page does
  // not open a socket of its own.
  const [pendingStart, setPendingStart] = useState<{ channelName: string; appId: string } | null>(null)
  // True once the camera attempt settled (successfully or not). The Go Live
  // button is enabled as soon as this is true: waiting for the server would
  // block the instructor on a cold API, which is exactly what we avoid.
  const [cameraReady, setCameraReady] = useState(false)

  // Cloud recording state
  const [connectionState, setConnectionState] = useState<
    'idle' | 'connecting' | 'connected' | 'reconnecting' | 'failed'
  >('idle')
  const [isCloudRecording, setIsCloudRecording] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => { const r = await get('/auth/me'); return r.data?.data ?? r.data }
  })
  const instructorName = me?.profile?.firstName || (isAr ? 'المحاضر' : 'Instructor')
  const instructorAvatar = me?.profile?.avatar || ''

  const {
    connected,
    viewerCount,
    comments,
    questions,
    sendComment,
    approveQuestion,
    answerQuestion,
    dismissQuestion,
    broadcastLiveStarted,
    broadcastLiveEnded,
  } = useLiveSocket(courseId, instructorName, 'instructor', instructorAvatar)

  const localVideoRef = useRef<HTMLDivElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const previewStreamRef = useRef<MediaStream | null>(null)
  const pipVideoRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<any>(null)
  const localTracksRef = useRef<any[]>([])
  const screenTrackRef = useRef<any>(null)
  const timerRef = useRef<any>(null)


  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await get(`/courses/${courseId}`)
      return res.data?.data ?? res.data
    }
  })

  const courseTitle = course?.titleAr || course?.titleEn || course?.title || ''
  const liveLink = learnUrlWithToken(`/${locale}/live/${courseId}`)

  useEffect(() => {
    if (liveStarted) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(timerRef.current)
      setElapsed(0)
    }
    return () => clearInterval(timerRef.current)
  }, [liveStarted])

  useEffect(() => {
    if (viewerCount > peakViewers) setPeakViewers(viewerCount)
  }, [viewerCount])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  // ── Camera-first preparation (Issue 1) ──────────────────────────────────
  // getUserMedia is purely local, so the instructor sees themselves instantly
  // even when the Render API is cold. The network is only touched AFTER the
  // preview is on screen, and never blocks it.
  const stopPreview = () => {
    previewStreamRef.current?.getTracks().forEach(t => t.stop())
    previewStreamRef.current = null
    if (previewVideoRef.current) previewVideoRef.current.srcObject = null
    setPreviewActive(false)
  }

  const startPreview = async (): Promise<boolean> => {
    if (previewStreamRef.current) return true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      })
      previewStreamRef.current = stream
      stream.getVideoTracks().forEach(t => (t.enabled = camOn))
      stream.getAudioTracks().forEach(t => (t.enabled = micOn))
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream
        previewVideoRef.current.muted = true
        previewVideoRef.current.play?.().catch(() => {})
      }
      setPreviewActive(true)
      return true
    } catch (e: any) {
      const name = e?.name || ''
      setPrepNote(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? (isAr ? 'لم يتم منح إذن الكاميرا/الميكروفون — سيخبرك المتصفح عند بدء البث' : 'Camera/mic permission denied — your browser will ask again when the stream starts')
          : (isAr ? 'تعذر فتح الكاميرا — تحقق من توصيلها ثم أعد المحاولة' : 'Could not open the camera — check that it is connected and try again'),
      )
      return false
    }
  }

  // Step 1 — the camera, and nothing else. getUserMedia is purely local, so
  // the instructor sees themselves instantly even when the API is cold. No
  // network call is involved and the Go Live button is released as soon as
  // the camera attempt settles.
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setPrepStage('camera')
      setCameraReady(false)
      await startPreview()
      if (cancelled) { stopPreview(); return }
      setCameraReady(true)
      // Only move forward: the warm-up may already have finished.
      setPrepStage(prev => (prev === 'camera' ? 'server' : prev))
    })()

    return () => {
      cancelled = true
      stopPreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  // Step 2 — the server warm-up, in the background. It never blocks the
  // preview and never blocks the Go Live button: a failure only produces a
  // retry button, the start flow re-issues the request anyway.
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setServerState('connecting')
      setServerError('')
      try {
        // The token itself is only a warm-up (the real one is issued by
        // POST /live/start for the final channel) — what matters here is that
        // the request wakes a cold API so the actual start is fast.
        await get(`/live/token/${courseId}`)
        if (cancelled) return
        setServerState('ready')
        setPrepStage(prev => (prev === 'server' ? 'ready' : prev))
      } catch (e: any) {
        if (cancelled) return
        const status = e?.response?.status
        setServerState('failed')
        setServerError(
          status === 403
            ? (isAr
                ? 'انتهى البث المباشر لهذه الجلسة مسبقاً'
                : 'This live session has already ended')
            : (isAr
                ? 'تعذر الاتصال بالخادم — يمكنك إعادة المحاولة'
                : 'Could not reach the server — you can retry'),
        )
        setPrepStage(prev => (prev === 'server' ? 'ready' : prev))
      }
    })()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, warmUpAttempt])

  // Announce the live start on the SHARED socket (the one useLiveSocket owns).
  // The hook connects it as soon as `liveStarted` becomes true and joins the
  // room in its 'connect' handler, so waiting for `connected` guarantees the
  // announcement is not dropped. Exactly one socket serves the room for this
  // page — the page never registers a listener of its own.
  useEffect(() => {
    if (!pendingStart || !connected) return
    broadcastLiveStarted(pendingStart.channelName, pendingStart.appId)
    setPendingStart(null)
  }, [pendingStart, connected, broadcastLiveStarted])

  // The button label mirrors the preparation progress:
  //   camera → "جارٍ تحضير الكاميرا..."
  //   server → "جارٍ الاتصال بالخادم..."
  const prepLabel = starting
    ? (isAr ? 'جارٍ الاتصال بالخادم...' : 'Connecting to server...')
    : !cameraReady
      ? (isAr ? 'جارٍ تحضير الكاميرا...' : 'Preparing camera...')
      : (isAr ? 'ابدأ البث' : 'Go Live')

  // Small status line under the video so the instructor always knows what the
  // page is doing, without the camera preview being covered by an overlay.
  //   "جارٍ تحضير الكاميرا..." → "جارٍ الاتصال بالخادم..." → "جاهز للبث"
  const prepStatus = starting
    ? (isAr ? 'جارٍ الاتصال بالخادم...' : 'Connecting to server...')
    : !cameraReady
      ? (isAr ? 'جارٍ تحضير الكاميرا...' : 'Preparing camera...')
      : serverState === 'connecting'
        ? (isAr ? 'جارٍ الاتصال بالخادم...' : 'Connecting to server...')
        : (isAr ? 'جاهز للبث' : 'Ready to go live')
  const prepStatusDone = cameraReady && serverState === 'ready'

  const handleStartLive = async () => {
    setStarting(true)
    setPrepStage('connecting')
    try {
      // Always go through the shared axios client: it resolves the correct API
      // host (env var, else https://api.deveways.com/api) and attaches the JWT
      // from the auth interceptor, so the request is never sent unauthenticated
      // to a stale host.
      let data: any

      if (lessonId) {
        // Lesson-based live — call lesson-start first
        const res = await post(`/live/lesson-start/${lessonId}`, {})
        data = res.data?.data ?? res.data
        if (!data?.token) {
          // Fallback: the lesson-start response may not contain a token,
          // so try the regular start endpoint with lessonId context
          const res2 = await post(`/live/start/${courseId}`, { lessonId })
          data = res2.data?.data ?? res2.data
          if (!data?.token) throw new Error('No stream token')
        }
      } else {
        const res = await post(`/live/start/${courseId}`, {})
        data = res.data?.data ?? res.data
        if (!data?.token) throw new Error('No stream token')
      }

      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      AgoraRTC.setLogLevel(4)

      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
      await client.setClientRole('host')
      clientRef.current = client

      // Fetch a server-signed token for this channel
      const tokenRes = await get(`/live/token?channelName=${data.channelName}&role=publisher`)
      const { token: rtcToken, uid: rtcUid } = tokenRes.data?.data ?? tokenRes.data

      client.on('token-privilege-will-expire', async () => {
        try {
          const r = await get(`/live/token?channelName=${data.channelName}&role=publisher`)
          const { token: newToken } = r.data?.data ?? r.data
          await client.renewToken(newToken)
        } catch (e) {
          console.error('Token renewal failed:', e)
        }
      })

      client.on('connection-state-changed', (state: string) => {
        const map: Record<string, typeof connectionState> = {
          DISCONNECTED: 'idle', CONNECTING: 'connecting',
          CONNECTED: 'connected', RECONNECTING: 'reconnecting',
        }
        setConnectionState(map[state] || 'idle')
      })

      setConnectionState('connecting')

      await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID!, data.channelName, rtcToken, rtcUid)

      // Hand the camera over to Agora: releasing the getUserMedia handle first
      // avoids two open handles fighting over the same device (black preview).
      // If the SDK then fails, handleEndLive-style cleanup restores it below.
      stopPreview()

      // Each source is optional: a broken camera must not cancel the lecture
      // and a missing microphone must not either. The stream starts as long as
      // at least one of them works (Facebook/Instagram Live behaviour).
      let micTrack: any = null
      let camTrack: any = null
      try {
        micTrack = await AgoraRTC.createMicrophoneAudioTrack()
      } catch (e: any) {
        console.warn('[Live] microphone unavailable:', e?.message)
      }
      try {
        camTrack = await AgoraRTC.createCameraVideoTrack()
      } catch (e: any) {
        console.warn('[Live] camera unavailable:', e?.message)
      }

      if (!micTrack && !camTrack) {
        throw new Error(
          isAr
            ? 'تعذر الوصول للميكروفون والكاميرا'
            : 'Could not access the microphone or the camera',
        )
      }

      const tracksToPublish = [micTrack, camTrack].filter(Boolean)

      // Positions are fixed: 0 = mic, 1 = camera, so the toggle buttons keep
      // working even when one of the two is missing.
      localTracksRef.current = [micTrack, camTrack]
      setMicOn(!!micTrack)
      setCamOn(!!camTrack)

      // The instructor has to know the session is audio-only — otherwise the
      // recording silently comes out with a black canvas and nobody understands
      // why. The live itself keeps going.
      if (!camTrack) {
        toast(
          isAr
            ? 'تعذّر تشغيل الكاميرا — سيتم البث والتسجيل بالصوت فقط'
            : 'Camera unavailable — streaming and recording in audio-only mode',
          { icon: '⚠️' },
        )
      }

      if (localVideoRef.current && camTrack) camTrack.play(localVideoRef.current)

      await client.publish(tracksToPublish)

      // Start Agora Cloud Recording (server-side, non-blocking)
      try {
        const recRes = await fetch(
          `${apiUrl}/live/${courseId}/recording/start`,
          { method: 'POST', credentials: 'include' },
        )
        if (recRes.ok) setIsCloudRecording(true)
      } catch (e) {
        console.error('Cloud recording start failed (non-fatal):', e)
      }

      // Mark live first so the useLiveSocket hook connects its own socket, then
      // announce on THAT socket once it has joined the room. Emitting before the
      // socket exists (or before it joins the room) silently drops the event,
      // which is why viewers never received "stream-started".
      //
      // The page must NOT open a second socket of its own: two instructor
      // sockets in the same room meant the room was registered twice.
      setLiveStarted(true)
      setPendingStart({ channelName: data.channelName, appId: data.appId })
      setServerState('ready')

      toast.success(isAr ? 'البث المباشر بدأ!' : 'Live stream started!')
    } catch(e: any) {
      toast.error(e.message || (isAr ? 'فشل بدء البث' : 'Failed to start'))
      // Leave the instructor with a working preview instead of a black box,
      // and report that the server is reachable again.
      try { clientRef.current?.leave() } catch {}
      clientRef.current = null
      void startPreview()
      setPrepStage('ready')
      setServerState('ready')
    } finally {
      setStarting(false)
      setPrepStage(prev => (prev === 'connecting' ? 'ready' : prev))
    }
  }

  const toggleMic = async () => {
    const micTrack = localTracksRef.current[0]
    if (micTrack) { await micTrack.setEnabled(!micOn); setMicOn(m => !m); return }
    // Pre-live: toggle the preview stream's audio track directly
    previewStreamRef.current?.getAudioTracks().forEach(t => (t.enabled = !micOn))
    if (previewStreamRef.current) setMicOn(m => !m)
  }

  const toggleCam = async () => {
    const camTrack = localTracksRef.current[1]
    if (camTrack) { await camTrack.setEnabled(!camOn); setCamOn(c => !c); return }
    // Pre-live: toggle the preview stream's video track directly
    previewStreamRef.current?.getVideoTracks().forEach(t => (t.enabled = !camOn))
    if (previewStreamRef.current) setCamOn(c => !c)
  }

  useEffect(() => {
    if (!liveStarted) return
    const camTrack = localTracksRef.current[1]
    if (screenSharing) {
      // Screen share active: play screen in main, camera in PiP
      if (screenTrackRef.current && localVideoRef.current) {
        screenTrackRef.current.play(localVideoRef.current)
      }
      if (camTrack && pipVideoRef.current) {
        camTrack.play(pipVideoRef.current)
      }
    } else {
      // Screen share off: play camera in main
      if (camTrack && localVideoRef.current) {
        camTrack.play(localVideoRef.current)
      }
    }
  }, [screenSharing, liveStarted])

  // Screen share is a pure Agora publish. It never starts, stops, flushes or
  // uploads a recording. Recording reads a canvas composite instead of the raw
  // Agora tracks, so switching the video source only re-points the canvas at
  // the screen share (or back at the camera) — the running recorder is
  // untouched and keeps capturing throughout.
  const toggleScreenShare = async () => {
    if (!clientRef.current || !liveStarted) return
    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      if (screenSharing) {
        // Stop screen share and restore the camera as the published video.
        const camTrack = localTracksRef.current[1]
        try {
          if (screenTrackRef.current) {
            await clientRef.current.unpublish(screenTrackRef.current)
            screenTrackRef.current.stop()
            screenTrackRef.current.close()
            screenTrackRef.current = null
          }
        } finally {
          // Runs even if unpublishing the screen failed, so the students keep
          // a video feed whenever a camera exists.
          if (camTrack) {
            try { await clientRef.current.publish(camTrack) } catch (e: any) {
              console.error('[ScreenShare] could not restore camera', e?.message)
            }
          }
          setScreenSharing(false)
        }
        toast.success(isAr ? 'توقف مشاركة الشاشة' : 'Screen sharing stopped')
      } else {
        // Start screen share
        let screenTrack: any
        try {
          screenTrack = await AgoraRTC.createScreenVideoTrack({
            encoderConfig: '1080p_1',
          }, 'disable')
        } catch(e: any) {
          if (e.message?.includes('Permission denied') || e.message?.includes('cancel')) {
            toast.error(isAr ? 'تم إلغاء مشاركة الشاشة' : 'Screen sharing cancelled')
          } else {
            toast.error(isAr ? 'فشل مشاركة الشاشة' : 'Screen share failed')
          }
          return
        }
        const track = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack
        screenTrackRef.current = track

        const camTrack = localTracksRef.current[1]
        if (camTrack) await clientRef.current.unpublish(camTrack)
        try {
          await clientRef.current.publish(track)
        } catch (e: any) {
          // Publishing the screen failed: put the camera back so the stream
          // does not lose its video feed, then clean the screen track up.
          screenTrackRef.current = null
          try { track.stop(); track.close() } catch {}
          if (camTrack) {
            try { await clientRef.current.publish(camTrack) } catch {}
          }
          throw e
        }

        // Play screen in main immediately (avoids flash)
        if (localVideoRef.current) track.play(localVideoRef.current)

        // Set state — useEffect will handle PiP camera placement
        // after React renders the PiP container
        setScreenSharing(true)
        toast.success(isAr ? 'جاري مشاركة الشاشة' : 'Screen sharing started')
      }
    } catch(e: any) {
      console.error('[ScreenShare]', e.message)
      toast.error(isAr ? 'حدث خطأ' : 'Error')
    }
  }

  const handleEndLive = async () => {
    setEnding(true)
    setStreamEnded(true)
    try {
      // Notify all viewers BEFORE stopping
      broadcastLiveEnded()
      // Wait a moment for socket to send
      await new Promise(r => setTimeout(r, 500))

      // Stop Agora Cloud Recording before leaving
      if (isCloudRecording) {
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/live/${courseId}/recording/stop`,
            { method: 'POST', credentials: 'include' },
          )
        } catch (e) {
          console.error('Recording stop failed (non-fatal):', e)
        }
      }

      try {
        if (clientRef.current) await clientRef.current.leave()
      } catch (e: any) {
        console.error('[Live] leave failed:', e?.message)
      }

      localTracksRef.current.filter(Boolean).forEach(t => { t.stop(); t.close() })
      if (screenTrackRef.current) { screenTrackRef.current.stop(); screenTrackRef.current.close() }
      await post(`/live/end/${courseId}`, {})

      setSessionEnded(true)
      setConnectionState('idle')
      toast.success(isAr ? 'تم إنهاء البث' : 'Stream ended')
      setTimeout(() => {
        router.push(`/${locale}/dashboard/my-courses`)
      }, 3000)
    } catch(e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setEnding(false)
    }
  }

  const pendingQuestions = questions.filter(q => !q.approved && !q.answered)
  const approvedQuestions = questions.filter(q => q.approved && !q.answered)

  return (
    <AuthGate>
      {/* End Stream Confirm Dialog */}
      {showEndConfirm && (
        <>
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:200, backdropFilter:'blur(4px)' }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#111', borderRadius:20, border:'1px solid rgba(255,255,255,0.1)', padding:'28px', width:'min(380px,calc(100vw-32px))', zIndex:201, textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(220,38,38,0.15)', border:'1px solid rgba(220,38,38,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Square size={24} color="#dc2626" />
            </div>
            <h3 style={{ color:'#f1f5f9', fontSize:18, fontWeight:900, margin:'0 0 8px' }}>
              {isAr ? 'إنهاء البث المباشر؟' : 'End Live Stream?'}
            </h3>
            <p style={{ color:'#94a3b8', fontSize:13, margin:'0 0 24px', lineHeight:1.6 }}>
              {isAr ? 'سيتم إنهاء البث وإشعار جميع المشاهدين تلقائياً' : 'Stream will end and all viewers will be notified automatically'}
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowEndConfirm(false)} style={{ flex:1, padding:'12px', borderRadius:11, background:'rgba(255,255,255,0.06)', color:'#94a3b8', border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={async () => { setShowEndConfirm(false); await handleEndLive() }} style={{ flex:1, padding:'12px', borderRadius:11, background:'#dc2626', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700 }}>
                {isAr ? 'نعم، إنهاء البث' : 'Yes, End Stream'}
              </button>
            </div>
          </div>
        </>
      )}

      <div style={{ minHeight: '100vh', background: '#0a0a0a', direction: isAr ? 'rtl' : 'ltr', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
        <style>{`
          @keyframes livePulse{0%,100%{opacity:1}50%{opacity:.3}}
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        `}</style>

        {/* TOP BAR */}
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 14, background: '#0d0d0d', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {liveStarted && !streamEnded && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', animation: 'livePulse 1.5s infinite' }} />}
            <span style={{ color: liveStarted && !streamEnded ? '#dc2626' : subtext, fontSize: 12, fontWeight: 800, letterSpacing: '0.05em' }}>
              {streamEnded
                ? (isAr ? 'انتهى البث' : 'STREAM ENDED')
                : liveStarted
                  ? (isAr ? 'على الهواء' : 'ON AIR')
                  : (isAr ? 'استوديو البث' : 'LIVE STUDIO')}
            </span>
            {liveStarted && !streamEnded && <span style={{ color: '#dc2626', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>{formatTime(elapsed)}</span>}
            {isCloudRecording && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fca5a5', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'livePulse 1.5s infinite' }} />
                REC
              </span>
            )}
            {connectionState === 'reconnecting' && (
              <span style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700 }}>
                {isAr ? 'جارٍ إعادة الاتصال...' : 'Reconnecting...'}
              </span>
            )}
          </div>

          {liveStarted && (
            <div style={{ display: 'flex', gap: 16, marginRight: isAr ? 0 : 'auto', marginLeft: isAr ? 'auto' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Users size={13} color="#94a3b8" />
                <span style={{ color: text, fontSize: 13, fontWeight: 700 }}>{viewerCount}</span>
                <span style={{ color: subtext, fontSize: 11 }}>{isAr ? 'مباشر' : 'live'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <TrendingUp size={13} color="#94a3b8" />
                <span style={{ color: text, fontSize: 13, fontWeight: 700 }}>{peakViewers}</span>
                <span style={{ color: subtext, fontSize: 11 }}>{isAr ? 'ذروة' : 'peak'}</span>
              </div>
              {pendingQuestions.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <Hand size={12} color="#d97706" />
                  <span style={{ color: '#d97706', fontSize: 12, fontWeight: 700 }}>{pendingQuestions.length}</span>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: isAr ? 'auto' : 0, marginLeft: isAr ? 0 : 'auto' }}>
            {connected ? (
              <span style={{ color:'#16a34a', fontSize: 10, display:'flex', alignItems:'center', gap: 3 }}>
                <Wifi size={11} />{isAr ? 'متصل' : 'Connected'}
              </span>
            ) : liveStarted ? (
              <span style={{ color:'#f59e0b', fontSize: 10, display:'flex', alignItems:'center', gap: 3 }}>
                <WifiOff size={11} />{isAr ? 'غير متصل' : 'Disconnected'}
              </span>
            ) : null}
            <button onClick={() => router.push(`/${locale}/dashboard/my-courses`)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtext }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 0, overflow: 'hidden' }}>

          {/* LEFT: Video + Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '20px', gap: 16, overflow: 'auto', minWidth: 0 }}>

            {/* Lesson banner */}
            {lessonId && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                <span style={{ color: '#f87171', fontSize: '0.85rem', fontWeight: 600 }}>
                  {isAr ? 'بث مباشر لمحاضرة مجدولة' : 'Live for scheduled lesson'}
                </span>
              </div>
            )}

            {/* Video */}
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', border: `1px solid ${border}`, aspectRatio: '16/9' }}>
              <div ref={localVideoRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />

              {/* Camera preview before going live (fast path: getUserMedia only, no network) */}
              {!liveStarted && (
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                />
              )}

              {!liveStarted && !previewActive && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, pointerEvents: 'none' }}>
                  {prepStage === 'camera' && (
                    <>
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#f1f5f9', animation: 'spin 0.9s linear infinite' }} />
                      </div>
                      <p style={{ color: subtext, fontSize: 13, margin: 0 }}>{isAr ? 'جارٍ تجهيز الكاميرا…' : 'Preparing camera…'}</p>
                    </>
                  )}
                  {prepStage === 'server' && (
                    <>
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Radio size={28} color="#dc2626" />
                      </div>
                      <p style={{ color: subtext, fontSize: 13, margin: 0 }}>{isAr ? 'جارٍ الاتصال بالخادم…' : 'Connecting to the server…'}</p>
                    </>
                  )}
                  {prepStage === 'ready' && (
                    <>
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Radio size={28} color="#dc2626" />
                      </div>
                      <p style={{ color: subtext, fontSize: 13, margin: 0 }}>{isAr ? 'الكاميرا غير مفعلة' : 'Camera not active'}</p>
                    </>
                  )}
                  {prepStage === 'connecting' && (
                    <>
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#f1f5f9', animation: 'spin 0.9s linear infinite' }} />
                      </div>
                      <p style={{ color: subtext, fontSize: 13, margin: 0 }}>{isAr ? 'جارٍ الاتصال بالبث…' : 'Connecting to the stream…'}</p>
                    </>
                  )}
                </div>
              )}

              {/* Preparation status line — never covers the camera preview */}
              {!liveStarted && (
                <div style={{
                  position: 'absolute',
                  bottom: 12,
                  [isAr ? 'right' : 'left']: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 20,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  pointerEvents: 'none',
                  zIndex: 5,
                }}>
                  {prepStatusDone
                    ? <CheckCircle2 size={13} color="#16a34a" />
                    : <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#f1f5f9', animation: 'spin 0.9s linear infinite' }} />}
                  <span style={{ color: prepStatusDone ? '#86efac' : subtext, fontSize: 11, fontWeight: 700 }}>
                    {prepStatus}
                  </span>
                </div>
              )}

              {liveStarted && !streamEnded && (
                <div style={{ position: 'absolute', top: 12, [isAr?'right':'left']: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(220,38,38,0.9)', backdropFilter: 'blur(4px)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'livePulse 1.5s infinite' }} />
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>LIVE</span>
                </div>
              )}

              {/* The stream is over — the camera is released, so the preview
                  area says what happened instead of showing a black box. */}
              {streamEnded && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(10,10,10,0.92)', zIndex: 6 }}>
                  <CheckCircle2 size={34} color="#16a34a" />
                  <p style={{ color: text, fontSize: 15, fontWeight: 800, margin: 0 }}>
                    {isAr ? 'انتهى البث المباشر' : 'The live stream has ended'}
                  </p>
                  {isCloudRecording && (
                    <p style={{ color: subtext, fontSize: 12, margin: 0 }}>
                      {isAr ? 'سيظهر التسجيل في مكتبة الكورس خلال بضع دقائق' : 'Recording will appear in the course library in a few minutes'}
                    </p>
                  )}
                </div>
              )}

              {screenSharing && (
                <div style={{ position: 'absolute', top: 12, [isAr?'left':'right']: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: 'rgba(81,32,200,0.85)' }}>
                  <MonitorUp size={12} color="#fff" />
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{isAr ? 'مشاركة شاشة' : 'Screen Share'}</span>
                </div>
              )}

              {screenSharing && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 70,
                    right: isAr ? 'auto' : 16,
                    left: isAr ? 16 : 'auto',
                    width: 160,
                    height: 90,
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '2px solid rgba(255,255,255,0.3)',
                    cursor: 'grab',
                    zIndex: 10,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    background: '#000',
                  }}
                  onMouseDown={(e) => {
                    const startX = e.clientX - pipPos.x
                    const startY = e.clientY - pipPos.y
                    const handleMouseMove = (me: MouseEvent) => {
                      setPipPos({ x: me.clientX - startX, y: me.clientY - startY })
                    }
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove)
                      document.removeEventListener('mouseup', handleMouseUp)
                    }
                    document.addEventListener('mousemove', handleMouseMove)
                    document.addEventListener('mouseup', handleMouseUp)
                  }}
                >
                  <div ref={pipVideoRef} style={{ width: '100%', height: '100%' }} />
                  <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                    <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, padding: '2px 6px', borderRadius: 4 }}>
                      {isAr ? 'كاميرتك' : 'Your Camera'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px', background: cardBg, borderRadius: 14, border: `1px solid ${border}` }}>
              {liveStarted ? (
                <>
                  <button onClick={toggleMic} title={micOn ? (isAr?'كتم':'Mute') : (isAr?'تفعيل':'Unmute')} style={{ width: 44, height: 44, borderRadius: '50%', background: micOn ? 'rgba(255,255,255,0.08)' : '#dc2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'all 0.15s' }}>
                    {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                  </button>
                  <button onClick={toggleCam} title={camOn ? (isAr?'إيقاف الكاميرا':'Stop Camera') : (isAr?'تشغيل الكاميرا':'Start Camera')} style={{ width: 44, height: 44, borderRadius: '50%', background: camOn ? 'rgba(255,255,255,0.08)' : '#dc2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'all 0.15s' }}>
                    {camOn ? <Video size={18} /> : <VideoOff size={18} />}
                  </button>
                  <button onClick={toggleScreenShare} title={isAr?'مشاركة الشاشة':'Screen Share'} style={{ width: 44, height: 44, borderRadius: '50%', background: screenSharing ? '#5120c8' : 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'all 0.15s' }}>
                    <MonitorUp size={18} />
                  </button>
                  <div style={{ width: 1, height: 32, background: border }} />
                  <button onClick={() => setShowEndConfirm(true)} disabled={ending || streamEnded} style={{ height: 44, paddingInline: 20, borderRadius: 22, background: '#dc2626', border: 'none', cursor: ending||streamEnded?'not-allowed':'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, fontWeight: 800, opacity: ending||streamEnded?0.7:1 }}>
                    <Square size={15} />
                    {streamEnded ? (isAr ? 'انتهى البث' : 'Stream Ended') : (isAr ? 'إنهاء البث' : 'End Stream')}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                    {[
                      { icon: micOn ? Mic : MicOff, label: isAr?'ميكروفون':'Mic', on: micOn, onClick: toggleMic },
                      { icon: camOn ? Video : VideoOff, label: isAr?'كاميرا':'Camera', on: camOn, onClick: toggleCam },
                    ].map((btn, i) => (
                      <button key={i} onClick={btn.onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: btn.on ? 'rgba(255,255,255,0.06)' : 'rgba(220,38,38,0.15)', border: `1px solid ${btn.on ? border : 'rgba(220,38,38,0.3)'}`, cursor: 'pointer', color: btn.on ? text : '#dc2626', fontSize: 12, fontWeight: 600 }}>
                        <btn.icon size={14} />
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleStartLive} disabled={starting || !cameraReady} style={{ height: 48, paddingInline: 28, borderRadius: 14, background: '#dc2626', border: 'none', cursor: starting||!cameraReady?'wait':'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, fontWeight: 800, opacity: starting||!cameraReady?0.7:1 }}>
                    {starting
                      ? <><div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />{prepLabel}</>
                      : <><Play size={18} />{prepLabel}</>}
                  </button>
                </>
              )}
            </div>

            {/* Cloud recording status */}
            {isCloudRecording && (
              <div style={{ padding: '10px 14px', background: cardBg, borderRadius: 12, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'livePulse 1.5s infinite', flexShrink: 0 }} />
                <span style={{ color: '#fca5a5', fontSize: 12, fontWeight: 600 }}>
                  {isAr ? 'جارٍ التسجيل السحابي...' : 'Cloud recording in progress...'}
                </span>
              </div>
            )}

            {/* Session ended message */}
            {sessionEnded && (
              <div style={{ textAlign: 'center', padding: '16px', background: cardBg, borderRadius: 12, border: `1px solid ${border}` }}>
                <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>
                  {isAr ? 'انتهى البث بنجاح ✓' : 'Stream ended successfully ✓'}
                </p>
                <p style={{ color: subtext, fontSize: 12, margin: 0 }}>
                  {isAr ? 'سيظهر التسجيل في مكتبة الكورس خلال بضع دقائق' : 'Recording will appear in the course library in a few minutes'}
                </p>
              </div>
            )}

            {/* Share link — the link carries a long JWT, so the container must
                never be allowed to overflow (Issue 3). */}
            <div style={{ padding: '14px 16px', background: cardBg, borderRadius: 12, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, maxWidth: '100%', overflow: 'hidden', overflowWrap: 'break-word', wordBreak: 'break-all' }}>
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div style={{ color: subtext, fontSize: 10, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isAr?'رابط الجلسة للمشاركة':'Share Link'}</div>
                <div
                  dir="ltr"
                  title={liveLink}
                  style={{
                    color: text,
                    fontSize: 12,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-all',
                  }}
                >{liveLink}</div>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(liveLink); setCopied(true); setTimeout(()=>setCopied(false),2000); toast.success(isAr?'تم نسخ الرابط':'Link copied!') }} style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copied?'#16a34a':subtext, flexShrink: 0 }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            {/* Camera/server preparation note (Issue 1) */}
            {prepNote && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontSize: 12, lineHeight: 1.6 }}>
                {prepNote}
              </div>
            )}

            {/* The background server warm-up failed — offer a retry instead of
                leaving the instructor with a dead page. */}
            {serverState === 'failed' && serverError && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5', fontSize: 12, lineHeight: 1.6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ flex: 1, minWidth: 160 }}>{serverError}</span>
                <button
                  onClick={() => setWarmUpAttempt(a => a + 1)}
                  style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)', color: '#fecaca', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                >
                  {isAr ? 'إعادة المحاولة' : 'Retry'}
                </button>
              </div>
            )}

            {/* Cloud recording notice — before going live */}
            {!liveStarted && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', color: subtext, fontSize: 12, lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{isAr ? 'سيتم تسجيل الجلسة تلقائياً على السحابة وستظهر في مكتبة الكورس بعد انتهاء البث.' : 'The session will be automatically recorded to the cloud and appear in the course library after the stream ends.'}</span>
              </div>
            )}
          </div>

          {/* RIGHT: Questions & Comments Panel */}
          <div style={{ borderLeft: isAr?'none':'1px solid #1a1a1a', borderRight: isAr?'1px solid #1a1a1a':'none', display: 'flex', flexDirection: 'column', background: '#0d0d0d', overflow: 'hidden' }}>

            {/* Panel tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
              {[
                { key: 'questions', ar:'الأسئلة', en:'Questions', icon: Hand, badge: pendingQuestions.length },
                { key: 'comments', ar:'التعليقات', en:'Comments', icon: MessageSquare, badge: comments.length },
              ].map(tab => {
                const active = activeTab === tab.key
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', background: 'none', border: 'none', cursor: 'pointer', color: active ? '#f1f5f9' : subtext, borderBottom: `2px solid ${active ? '#dc2626' : 'transparent'}`, fontSize: 12, fontWeight: 700, transition: 'all 0.15s' }}>
                    <tab.icon size={13} />
                    {isAr ? tab.ar : tab.en}
                    {tab.badge > 0 && <span style={{ padding: '1px 6px', borderRadius: 10, background: tab.key === 'questions' ? '#d97706' : '#5120c8', color: '#fff', fontSize: 9, fontWeight: 800 }}>{tab.badge}</span>}
                  </button>
                )
              })}
            </div>

            {/* Questions panel */}
            {activeTab === 'questions' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                {!liveStarted ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                    <Hand size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: 8 }} />
                    <p style={{ color: subtext, fontSize: 12 }}>{isAr?'ستظهر الأسئلة هنا أثناء البث':'Questions will appear here during stream'}</p>
                  </div>
                ) : pendingQuestions.length === 0 && approvedQuestions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                    <p style={{ color: subtext, fontSize: 12 }}>{isAr?'لا توجد أسئلة بعد':'No questions yet'}</p>
                  </div>
                ) : (
                  <>
                    {pendingQuestions.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ color: '#d97706', fontSize: 10, fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em' }}>
                          {isAr?'في انتظار الموافقة':'PENDING APPROVAL'} ({pendingQuestions.length})
                        </div>
                        {pendingQuestions.map(q => (
                          <div key={q.id} style={{ padding: '12px', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)', marginBottom: 8, animation: 'slideIn 0.3s ease' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#5120c8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>{q.userName[0]}</div>
                              <span style={{ color: text, fontSize: 11, fontWeight: 700 }}>{q.userName}</span>
                              <span style={{ color: subtext, fontSize: 10, marginRight: isAr?0:'auto', marginLeft: isAr?'auto':0 }}>{formatLiveTime(q.timestamp, locale)}</span>
                            </div>
                            <p style={{ color: text, fontSize: 12, margin: '0 0 10px', lineHeight: 1.5 }}>{q.text}</p>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => approveQuestion(q.id)} style={{ flex: 1, padding: '6px', borderRadius: 7, background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', color: '#16a34a', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                <UserCheck size={11} />{isAr?'موافقة':'Approve'}
                              </button>
                              <button onClick={() => dismissQuestion(q.id)} style={{ width: 32, height: 32, borderRadius: 7, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserX size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {approvedQuestions.length > 0 && (
                      <div>
                        <div style={{ color: '#16a34a', fontSize: 10, fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em' }}>
                          {isAr?'موافق عليها - للإجابة':'APPROVED - TO ANSWER'} ({approvedQuestions.length})
                        </div>
                        {approvedQuestions.map(q => (
                          <div key={q.id} style={{ padding: '12px', borderRadius: 10, border: '1px solid rgba(22,163,74,0.25)', background: 'rgba(22,163,74,0.06)', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <CheckCircle2 size={12} color="#16a34a" />
                              <span style={{ color: text, fontSize: 11, fontWeight: 700 }}>{q.userName}</span>
                            </div>
                            <p style={{ color: text, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{q.text}</p>
                            <button onClick={() => answerQuestion(q.id)} style={{ marginTop: 8, width: '100%', padding: '5px', borderRadius: 7, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', color: '#16a34a', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                              {isAr?'تم الإجابة':'Mark Answered'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Comments panel */}
            {activeTab === 'comments' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {comments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                      <MessageSquare size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: 8 }} />
                      <p style={{ color: subtext, fontSize: 12 }}>{isAr?'ستظهر التعليقات هنا':'Comments will appear here'}</p>
                    </div>
                  ) : comments.map((c, i) => (
                    <div key={c.id || i} style={{ display: 'flex', gap: 8, animation: 'slideIn 0.2s ease' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#5120c8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                        {c.userName[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ color: '#7c6bc9', fontSize: 11, fontWeight: 700 }}>{c.userName} </span>
                        <span style={{ color: '#e2e8f0', fontSize: 12 }}>{c.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding:'10px', borderTop:`1px solid ${border}`, flexShrink: 0 }}>
                  <div style={{ display:'flex', gap:6 }}>
                    <input value={newComment} onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && newComment.trim() && (sendComment(newComment), setNewComment(''))}
                      placeholder={isAr?'أضف تعليقاً...':'Add comment...'}
                      style={{ flex:1, padding:'8px 12px', borderRadius:20, background:'rgba(255,255,255,0.06)', border:`1px solid ${border}`, color:text, fontSize:12, outline:'none' }} />
                    <button onClick={() => { if(newComment.trim()) { sendComment(newComment); setNewComment('') } }}
                      style={{ width:32, height:32, borderRadius:'50%', background: newComment.trim() ? '#5120c8' : 'rgba(255,255,255,0.06)', border:'none', cursor: newComment.trim() ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink: 0 }}>
                      <Send size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats bottom */}
            <div style={{ padding: '12px 14px', borderTop: `1px solid ${border}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, flexShrink: 0 }}>
              {[
                { label: isAr?'مشاهدون':'Live', val: viewerCount, color: '#dc2626' },
                { label: isAr?'الذروة':'Peak', val: peakViewers, color: '#d97706' },
                { label: isAr?'أسئلة':'Questions', val: questions.length, color: '#5120c8' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '8px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${border}` }}>
                  <div style={{ color: s.color, fontSize: 16, fontWeight: 900 }}>{s.val}</div>
                  <div style={{ color: subtext, fontSize: 9, marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  )
}
