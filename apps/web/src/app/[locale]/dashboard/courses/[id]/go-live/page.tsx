'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
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
  AlertTriangle, Upload, RotateCcw, User, MonitorOff
} from 'lucide-react'
import { useLiveSocket } from '../../../../../../hooks/useLiveSocket'
import { confirmToast } from '../../../../../../lib/confirm-toast'
import { LIVE_RECORDING_SUPPORTED, liveRecordingNote, formatLiveTime } from '../../../../../../lib/live'
import toast from 'react-hot-toast'

/**
 * An aborted request is intentional cleanup — the page navigated away, the
 * component unmounted, or the browser cancelled a pending device request — not
 * a real failure. Every catch that reports an error returns early on it so the
 * instructor never sees an error they cannot act on.
 */
function isAbortError(error: any): boolean {
  return error?.name === 'AbortError'
}

/**
 * The Agora SDK has no cancellation signal: `client.join()` keeps retrying its
 * gateway handshake and can stay pending forever on a sleeping server. This cap
 * turns that hang into a real, retryable error instead of an endless
 * "جارٍ الاتصال بالبث…" overlay.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => { clearTimeout(timer); resolve(value) },
      (error) => { clearTimeout(timer); reject(error) },
    )
  })
}

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
  // button is released as soon as this is true: waiting for the server would
  // block the instructor on a cold API, which is exactly what we avoid.
  const [cameraReady, setCameraReady] = useState(false)
  // True when getUserMedia failed. This is a warning only: the instructor can
  // still go live audio-only, and the retry button stays available.
  const [cameraError, setCameraError] = useState(false)

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
  // The socket is opened from the moment the page mounts instead of when the
  // stream starts: its 'connect' event is the fastest reliable signal that a
  // cold API is awake, and that is what clears the "connecting to server"
  // state. Joining the room early is harmless — the gateway excludes the
  // instructor from the viewer count and nothing is announced until
  // 'live-started' is emitted.
  } = useLiveSocket(courseId, instructorName, 'instructor', instructorAvatar)

  // Mirror of the hook's `connected` flag for callbacks that outlive the render
  // they were created in: the warm-up promise settles long after it was
  // created, so a captured `connected` would be stale.
  const socketConnectedRef = useRef(false)
  useEffect(() => { socketConnectedRef.current = connected }, [connected])

  const localVideoRef = useRef<HTMLDivElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const previewStreamRef = useRef<MediaStream | null>(null)
  const pipVideoRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<any>(null)
  const localTracksRef = useRef<any[]>([])
  const screenTrackRef = useRef<any>(null)
  const timerRef = useRef<any>(null)

  // ── Client-side recording (MediaRecorder → Bunny.net) ───────────────────
  // The browser records the instructor's camera + microphone locally while
  // the stream is running. When the stream ends the file is uploaded to the
  // API, which stores it on Bunny.net and turns it into a lesson. Nothing is
  // recorded unless the instructor asked for it.
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  // The finished file is kept so a failed upload can be retried without
  // recording the session again.
  const recordingBlobRef = useRef<Blob | null>(null)
  const recordingMimeRef = useRef<string>('video/webm')
  // Fires when the recorder produced no data at all, so a dead recorder is
  // reported instead of silently uploading an empty file.
  const recordingWatchdogRef = useRef<any>(null)
  // Resolver of the "the recorder stopped" promise.
  const recordingStoppedRef = useRef<((blob: Blob | null) => void) | null>(null)
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'uploading' | 'done' | 'error'>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  // Whether there is a file that can be uploaded again after a failure.
  const [hasRecordingFile, setHasRecordingFile] = useState(false)

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await get(`/courses/${courseId}`)
      return res.data?.data ?? res.data
    }
  })

  const courseTitle = course?.titleAr || course?.titleEn || course?.title || ''
  const liveLink = learnUrlWithToken(`/${locale}/live/${courseId}`)

  // Does the instructor want a recording of this session? For a lesson live the
  // preference lives in the lesson content, for a course live it is the
  // course-level recording flag.
  const recordingRequested = useMemo(() => {
    if (lessonId) {
      const sections = (course?.sections ?? []) as {
        lessons?: {
          id?: string
          content?: { saveRecording?: boolean } | null
        }[]
      }[]
      const lessons = sections.flatMap((s) => s?.lessons ?? [])
      const lesson = lessons.find((l) => l?.id === lessonId)
      const content = lesson?.content
      if (content && typeof content === 'object' && 'saveRecording' in content) {
        return content.saveRecording !== false
      }
      return true
    }
    return course?.autoPublishRecording !== false
  }, [course, lessonId])

  // ── Recording helpers ───────────────────────────────────────────────────
  // The mime type the browser can actually record. WebM is the norm
  // (Chrome/Firefox), Safari records MP4.
  const pickRecordingMimeType = (): string => {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return ''
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ]
    for (const candidate of candidates) {
      try {
        if (MediaRecorder.isTypeSupported(candidate)) return candidate
      } catch {
        /* isTypeSupported throws on some old browsers — try the next one */
      }
    }
    return ''
  }

  // The native MediaStreamTrack behind an Agora track.
  //
  // The published track is the best source (it is literally what the students
  // receive), but the SDK does not always expose it, so the original source
  // track is used as a fallback. Both are real MediaStreamTracks the
  // MediaRecorder can record.
  const nativeTrackOf = (track: any): MediaStreamTrack | null => {
    if (!track) return null
    try {
      const published = track.getMediaStreamTrack?.(true)
      if (published) return published
      if (track.mediaStreamTrack) return track.mediaStreamTrack
      if (track._originMediaStreamTrack) return track._originMediaStreamTrack
    } catch {
      /* the SDK may refuse the call — fall through to the next source */
    }
    return null
  }

  // Starts the local recording on the tracks that are actually being
  // published. The screen-share track is not recorded: the recording follows
  // the camera + microphone, which is what a lecture session needs.
  const startRecording = (tracks: any[]) => {
    if (!recordingRequested) return
    // Old browser without MediaRecorder: skip silently, never break the live.
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return
    const mimeType = pickRecordingMimeType()
    if (!mimeType) return
    try {
      const nativeTracks = tracks
        .map(nativeTrackOf)
        .filter((track): track is MediaStreamTrack => !!track)
      if (!nativeTracks.length) {
        console.warn('[Recording] no native track available — the session will not be recorded')
        return
      }
      const stream = new MediaStream(nativeTracks)
      const recorder = new MediaRecorder(stream, { mimeType })
      recordingChunksRef.current = []
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) recordingChunksRef.current.push(e.data)
      }
      recorder.onerror = () => {
        console.error('[Recording] recorder failed')
        setRecordingState('error')
      }
      // The file is assembled whenever the recorder stops — no matter if the
      // stream ended or the watchdog gave up.
      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: recordingMimeRef.current })
        recordingBlobRef.current = blob.size > 0 ? blob : null
        setHasRecordingFile(!!recordingBlobRef.current)
        mediaRecorderRef.current = null
        const resolve = recordingStoppedRef.current
        recordingStoppedRef.current = null
        resolve?.(recordingBlobRef.current)
      }
      recorder.start(1000)
      mediaRecorderRef.current = recorder
      // Only the family is kept ("video/webm"), the codec list would end up
      // in the upload's content type and be rejected by the API.
      recordingMimeRef.current = mimeType.split(';')[0]
      setRecordingState('recording')

      // Watchdog: a recorder that produces no data is not recording anything.
      // Better to say so than to upload an empty file and call it a recording.
      clearTimeout(recordingWatchdogRef.current)
      recordingWatchdogRef.current = setTimeout(() => {
        if (mediaRecorderRef.current !== recorder) return
        if (recordingChunksRef.current.length > 0) return
        console.warn('[Recording] the recorder produced no data')
        try { recorder.stop() } catch { /* already stopped */ }
        setRecordingState('error')
      }, 6000)
    } catch (e: any) {
      // An aborted start is cleanup, not a recording failure.
      if (isAbortError(e)) return
      console.error('[Recording] could not start', e?.message)
      setRecordingState('error')
    }
  }

  // Stops the recorder and waits for the last chunk to arrive. Resolves with
  // the finished file (or null when nothing was recorded).
  const stopRecording = (): Promise<Blob | null> => {
    const recorder = mediaRecorderRef.current
    clearTimeout(recordingWatchdogRef.current)
    if (!recorder) return Promise.resolve(recordingBlobRef.current)
    if (recorder.state === 'inactive') {
      // Already stopped (the watchdog gave up) — nothing left to wait for.
      mediaRecorderRef.current = null
      return Promise.resolve(recordingBlobRef.current)
    }
    return new Promise<Blob | null>((resolve) => {
      recordingStoppedRef.current = resolve
      try {
        recorder.stop()
      } catch {
        recordingStoppedRef.current = null
        resolve(recordingBlobRef.current)
      }
    })
  }

  // Uploads the recording. The upload never blocks the end-of-stream flow:
  // it runs in the background and the instructor may leave the page (only
  // the tab has to stay open until the upload finished).
  const uploadRecording = async () => {
    const blob = recordingBlobRef.current
    if (!blob || !blob.size) {
      setRecordingState('error')
      return
    }
    setRecordingState('uploading')
    setUploadProgress(0)
    const extension = recordingMimeRef.current.includes('mp4') ? 'mp4' : 'webm'
    const formData = new FormData()
    formData.append('file', blob, `live-recording-${courseId}-${Date.now()}.${extension}`)
    formData.append('courseId', courseId)
    formData.append('title', isAr ? 'تسجيل البث المباشر' : 'Live Session Recording')
    try {
      await post('/live/save-recording', formData, {
        // A recording can be much bigger than a normal request — the default
        // 60s timeout would cut it in the middle.
        timeout: 0,
        onUploadProgress: (e: any) => {
          if (e?.total) setUploadProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      setUploadProgress(100)
      setRecordingState('done')
      toast.success(isAr ? 'تم حفظ التسجيل بنجاح' : 'The recording was saved')
      // The page used to jump back to the course list the moment the stream
      // ended. It now waits for the recording, then goes back on its own.
      setTimeout(() => {
        router.push(`/${locale}/dashboard/my-courses`)
      }, 2000)
    } catch (e: any) {
      // An aborted upload is cleanup (the tab is leaving), not a failure.
      if (isAbortError(e)) return
      console.error('[Recording] upload failed', e?.message)
      setRecordingState('error')
      toast.error(isAr ? 'فشل رفع التسجيل — يمكنك إعادة المحاولة' : 'Upload failed — you can retry')
    }
  }

  // A tab that is closed mid-upload loses the recording, so the browser is
  // asked to confirm the navigation first.
  useEffect(() => {
    if (recordingState !== 'uploading') return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [recordingState])

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
      // A successful (re)try clears the previous camera failure.
      setCameraError(false)
      setPrepNote('')
      return true
    } catch (e: any) {
      // An aborted device request is cleanup, not a camera failure.
      if (isAbortError(e)) return false
      const name = e?.name || ''
      console.error('[Camera] init failed:', e)
      // Warning only: starting without a camera falls back to audio-only.
      setCameraError(true)
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
      setCameraError(false)
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

  // A camera failure blocks "Go Live", so the instructor needs a way to try
  // again without reloading the page (the permission might just have been
  // granted, or the device plugged back in).
  const handleRetryCamera = async () => {
    setCameraError(false)
    setPrepNote('')
    setPrepStage('camera')
    const ok = await startPreview()
    setCameraReady(true)
    if (ok) {
      setPrepStage(prev => (
        prev === 'camera' ? (serverState === 'ready' || connected ? 'ready' : 'server') : prev
      ))
    } else {
      // Do not leave a spinner over a black preview: the overlay then says the
      // camera is not active.
      setPrepStage('ready')
    }
  }

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
        // An aborted warm-up is cleanup, not a server failure.
        if (isAbortError(e)) return
        if (cancelled) return
        const status = e?.response?.status
        // No HTTP status means the request never reached the API (timeout,
        // network drop). If the live socket is connected, the API is
        // demonstrably awake — a stale probe failure is not an outage, and
        // showing the red banner here is exactly the false alarm the socket
        // signal exists to prevent.
        if (!status && socketConnectedRef.current) {
          setServerState('ready')
          setServerError('')
          setPrepStage(prev => (prev === 'server' ? 'ready' : prev))
          return
        }
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

  // The live socket connects to the very same API host. A connected socket
  // therefore means the server is awake, so the "connecting to server" state is
  // cleared the moment the socket is up instead of waiting for a cold-start
  // warm-up request — which can take minutes because the shared client retries
  // timeouts twice. A 'failed' warm-up is left alone: it is a real answer from
  // the server (auth, permissions) and the instructor must see it.
  useEffect(() => {
    if (!connected) return
    if (serverState !== 'connecting') return
    setServerState('ready')
    setServerError('')
    setPrepStage(prev => (prev === 'server' ? 'ready' : prev))
  }, [connected, serverState])

  // Announce the live start on the SHARED socket (the one useLiveSocket owns).
  // The hook joins the room in its 'connect' handler, so waiting for
  // `connected` guarantees the announcement is not dropped. Exactly one socket
  // serves the room for this page — the page never registers a listener of its
  // own.
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
    : cameraError
      ? (isAr ? 'تعذر فتح الكاميرا' : 'Camera unavailable')
      : !cameraReady
        ? (isAr ? 'جارٍ تحضير الكاميرا...' : 'Preparing camera...')
        : serverState === 'connecting'
          ? (isAr ? 'جارٍ الاتصال بالخادم...' : 'Connecting to server...')
          : (isAr ? 'جاهز للبث' : 'Ready to go live')
  // The camera warning stays visible (informational) even though "Go Live" is
  // still available: the stream would simply be audio-only.
  const prepStatusDone = cameraReady && !cameraError && serverState === 'ready'

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

      // Bounded: a sleeping or blocked gateway must not leave the page on
      // "جارٍ الاتصال بالبث…" forever. Agora walks several edge/gateway
      // fallbacks when the nearest node refuses the WebSocket, which can take
      // over a minute, so the cap matches the student page's 90s window —
      // otherwise a join that would have succeeded is reported as a failure.
      await withTimeout(
        client.join(data.appId, data.channelName, data.token, 1),
        90000,
        isAr
          ? 'انتهت مهلة الاتصال بخادم البث — حاول مرة أخرى'
          : 'The streaming server did not respond — please try again',
      )

      // Hand the camera over to Agora: releasing the getUserMedia handle first
      // avoids two open handles fighting over the same device (black preview).
      // If the SDK then fails, handleEndLive-style cleanup restores it below.
      stopPreview()

      // Microphone first, camera best-effort: a missing camera (no device,
      // denied permission, failed preview) must not stop the lecture. Asking
      // Agora for both at once throws when either is unavailable, so fall back
      // to an audio-only track.
      let micTrack: any
      let camTrack: any = null
      try {
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks()
        micTrack = tracks[0]
        camTrack = tracks[1]
      } catch (e) {
        if (isAbortError(e)) throw e
        console.warn('[Live] no camera available — streaming audio only', e)
        micTrack = await AgoraRTC.createMicrophoneAudioTrack()
        setCameraError(true)
      }
      const published = camTrack ? [micTrack, camTrack] : [micTrack]
      localTracksRef.current = [micTrack, camTrack]
      setMicOn(true)
      setCamOn(!!camTrack)

      if (camTrack && localVideoRef.current) camTrack.play(localVideoRef.current)

      await client.publish(published)

      // The recording runs on the very same tracks that are being published,
      // so what is saved is what the students saw.
      startRecording(published)

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
      // An aborted start is cleanup, not a failure to go live.
      if (isAbortError(e)) return
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

  // Tears the screen share down and, when the page is still live, puts the
  // camera back on air. Shared by the toolbar button and by the browser's own
  // "Stop sharing" bar, so both paths leave the same state behind.
  const stopScreenShare = async (silent = false) => {
    const track = screenTrackRef.current
    // Null the ref first: stopping the track fires 'track-ended' again, and the
    // handler must not re-enter this function.
    screenTrackRef.current = null
    if (track) {
      try { await clientRef.current?.unpublish(track) } catch { /* already gone */ }
      try { track.stop() } catch { /* already stopped */ }
      try { track.close() } catch { /* already closed */ }
    }
    // Republish the camera only when the session is still running: during the
    // end-of-stream cleanup the client is about to leave anyway.
    const camTrack = localTracksRef.current[1]
    if (camTrack && clientRef.current && liveStarted && !streamEnded) {
      try {
        await clientRef.current.publish(camTrack)
      } catch (e) {
        console.warn('[ScreenShare] the camera could not be republished', e)
      }
    }
    setScreenSharing(false)
    if (!silent) toast.success(isAr ? 'توقف مشاركة الشاشة' : 'Screen sharing stopped')
  }

  const toggleScreenShare = async () => {
    if (!clientRef.current || !liveStarted) return
    if (screenSharing) {
      await stopScreenShare()
      return
    }
    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      let screenTrack: any
      try {
        screenTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: '1080p_1',
        }, 'disable')
      } catch(e: any) {
        // A dismissed picker or an aborted share is a user choice, not a
        // failure: no error toast for it.
        if (isAbortError(e)) return
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

      await clientRef.current.publish(track)

      // The browser's own "Stop sharing" bar does not touch React state, so
      // clean up from the track event instead of leaving a dead share on air.
      if (typeof track.on === 'function') {
        track.on('track-ended', () => {
          if (!screenTrackRef.current) return
          void stopScreenShare()
        })
      }

      // Play screen in main immediately (avoids flash)
      if (localVideoRef.current) track.play(localVideoRef.current)

      // Set state — useEffect will handle PiP camera placement
      // after React renders the PiP container
      setScreenSharing(true)
      toast.success(isAr ? 'جاري مشاركة الشاشة' : 'Screen sharing started')
    } catch(e: any) {
      // An aborted publish is cleanup, not a share failure.
      if (isAbortError(e)) return
      console.error('[ScreenShare]', e.message)
      const failed = screenTrackRef.current
      screenTrackRef.current = null
      if (failed) {
        try { failed.stop() } catch { /* already stopped */ }
        try { failed.close() } catch { /* already closed */ }
      }
      setScreenSharing(false)
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

      // The recorder is stopped before the tracks are released: the last
      // chunk still needs the live tracks to be alive.
      const wasRecording = !!mediaRecorderRef.current
      const recording = wasRecording ? await stopRecording() : null

      // Audio-only sessions have no camera track, so skip the empty slot.
      localTracksRef.current.filter(Boolean).forEach(t => { t.stop(); t.close() })
      // Stop sharing explicitly: the share badge and the PiP must disappear
      // with the stream, and unpublishing keeps the client state consistent.
      if (screenTrackRef.current) {
        try { await clientRef.current?.unpublish(screenTrackRef.current) } catch { /* already gone */ }
        try { screenTrackRef.current.stop() } catch { /* already stopped */ }
        try { screenTrackRef.current.close() } catch { /* already closed */ }
        screenTrackRef.current = null
        setScreenSharing(false)
      }
      if (clientRef.current) await clientRef.current.leave()
      await post(`/live/end/${courseId}`, {})

      if (recordingRequested && recording) {
        // The upload must not hold the end-of-stream flow back: it runs in
        // the background and the page keeps showing its progress.
        void uploadRecording()
        toast(
          isAr
            ? 'انتهى البث — جارٍ حفظ التسجيل'
            : 'Stream ended — saving the recording',
          { icon: '🎥' },
        )
        return
      }

      if (recordingRequested) {
        // The recording was requested but nothing was captured (the browser
        // has no MediaRecorder, or the stream was too short). Say so
        // instead of implying a recording exists.
        toast(
          isAr
            ? 'انتهى البث — لم يتم تسجيل أي مقطع في هذا المتصفح'
            : 'Stream ended — this browser did not capture a recording',
          { icon: '🎥' },
        )
      } else {
        toast.success(isAr ? 'تم إنهاء البث' : 'Stream ended')
      }
      router.push(`/${locale}/dashboard/my-courses`)
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
            {recordingState === 'recording' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fca5a5', fontSize: 10, fontWeight: 800, letterSpacing: '0.08em' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', animation: 'livePulse 1.5s infinite' }} />
                REC
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

              {/* After going live the camera box can be empty: an audio-only
                  session (no camera track at all) or a camera the instructor
                  turned off. Show who is broadcasting instead of a black hole. */}
              {liveStarted && !streamEnded && !camOn && !screenSharing && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#0f1115', pointerEvents: 'none' }}>
                  <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={40} color="#94a3b8" />
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>
                    {cameraError
                      ? (isAr ? 'لا توجد كاميرا — بث صوتي فقط' : 'No camera — audio only')
                      : (isAr ? 'الكاميرا متوقفة' : 'Camera is off')}
                  </span>
                </div>
              )}

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
                      <div style={{ width: 72, height: 72, borderRadius: '50%', background: cameraError ? 'rgba(148,163,184,0.12)' : 'rgba(220,38,38,0.15)', border: `1px solid ${cameraError ? 'rgba(148,163,184,0.25)' : 'rgba(220,38,38,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {cameraError
                          ? <User size={30} color="#94a3b8" />
                          : <Radio size={28} color="#dc2626" />}
                      </div>
                      <p style={{ color: subtext, fontSize: 13, margin: 0 }}>
                        {cameraError
                          ? (isAr ? 'لا توجد كاميرا — يمكنك البث بالصوت فقط' : 'No camera — you can still stream audio only')
                          : (isAr ? 'الكاميرا غير مفعلة' : 'Camera not active')}
                      </p>
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
                    : cameraError
                      ? <AlertTriangle size={13} color="#f59e0b" />
                      : <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#f1f5f9', animation: 'spin 0.9s linear infinite' }} />}
                  <span style={{ color: prepStatusDone ? '#86efac' : cameraError ? '#f59e0b' : subtext, fontSize: 11, fontWeight: 700 }}>
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
                  {recordingState === 'uploading' && (
                    <p style={{ color: subtext, fontSize: 12, margin: 0 }}>
                      {isAr ? 'جارٍ رفع التسجيل...' : 'Uploading the recording...'}
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
                  <button onClick={toggleScreenShare} title={screenSharing ? (isAr?'إيقاف المشاركة':'Stop Sharing') : (isAr?'مشاركة الشاشة':'Screen Share')} style={{ width: 44, height: 44, borderRadius: '50%', background: screenSharing ? '#5120c8' : 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'all 0.15s' }}>
                    {screenSharing ? <MonitorOff size={18} /> : <MonitorUp size={18} />}
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
                  {cameraError && (
                    <button
                      onClick={handleRetryCamera}
                      disabled={starting}
                      title={isAr ? 'إعادة محاولة فتح الكاميرا' : 'Try opening the camera again'}
                      style={{ height: 48, paddingInline: 16, borderRadius: 14, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', cursor: starting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: 13, fontWeight: 700, opacity: starting ? 0.7 : 1 }}>
                      <RotateCcw size={15} />
                      {isAr ? 'إعادة محاولة الكاميرا' : 'Retry camera'}
                    </button>
                  )}
                  <button onClick={handleStartLive} disabled={starting || !cameraReady} style={{ height: 48, paddingInline: 28, borderRadius: 14, background: '#dc2626', border: 'none', cursor: starting||!cameraReady?'not-allowed':'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, fontWeight: 800, opacity: starting||!cameraReady?0.5:1 }}>
                    {starting
                      ? <><div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />{prepLabel}</>
                      : <><Play size={18} />{prepLabel}</>}
                  </button>
                </>
              )}
            </div>

            {/* ── Recording status ──────────────────────────────────────────
                Only rendered when the instructor asked for a recording. The
                four states mirror the lifecycle of the file: it is being
                captured, it is being uploaded, it is stored, or it failed. */}
            {recordingRequested && recordingState !== 'idle' && (
              <div style={{
                padding: '12px 14px',
                background: cardBg,
                borderRadius: 12,
                border: `1px solid ${border}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                {recordingState === 'recording' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#dc2626', animation: 'livePulse 1.5s infinite', flexShrink: 0 }} />
                    <span style={{ color: '#fca5a5', fontSize: 12, fontWeight: 700 }}>
                      {isAr ? 'جارٍ التسجيل...' : 'Recording...'}
                    </span>
                    <span style={{ color: subtext, fontSize: 11, marginLeft: isAr ? 0 : 'auto', marginRight: isAr ? 'auto' : 0 }}>
                      {isAr ? 'يتم التسجيل في متصفحك' : 'Recording happens in your browser'}
                    </span>
                  </div>
                )}

                {recordingState === 'uploading' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                      <span style={{ color: text, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Upload size={13} color="#f59e0b" />
                        {isAr ? 'جارٍ رفع التسجيل...' : 'Uploading the recording...'}
                      </span>
                      <span style={{ color: subtext, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{uploadProgress}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#dc2626', transition: 'width 0.2s ease' }} />
                    </div>
                    <p style={{ color: '#fbbf24', fontSize: 11, margin: '8px 0 0', lineHeight: 1.6 }}>
                      {isAr ? 'التسجيل لا يزال يُرفع — لا تغلق الصفحة' : 'The recording is still uploading — do not close the page'}
                    </p>
                  </div>
                )}

                {recordingState === 'done' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <CheckCircle2 size={15} color="#16a34a" />
                    <span style={{ color: '#86efac', fontSize: 12, fontWeight: 700, flex: 1, minWidth: 140 }}>
                      {isAr ? 'تم حفظ التسجيل بنجاح' : 'The recording was saved'}
                    </span>
                    <button
                      onClick={() => router.push(`/${locale}/dashboard/my-courses`)}
                      style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, color: text, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                    >
                      {isAr ? 'العودة إلى كورساتي' : 'Back to my courses'}
                    </button>
                  </div>
                )}

                {recordingState === 'error' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <AlertTriangle size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <span style={{ color: '#fbbf24', fontSize: 12, fontWeight: 700, flex: 1, minWidth: 140 }}>
                      {isAr ? 'لم يتم حفظ التسجيل' : 'The recording could not be saved'}
                    </span>
                    {/* The retry button only makes sense when there is a file to
                        send again — a dead recorder has nothing to retry. */}
                    {hasRecordingFile && (
                      <button
                        onClick={() => uploadRecording()}
                        style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', color: '#fcd34d', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                      >
                        {isAr ? 'إعادة المحاولة' : 'Retry'}
                      </button>
                    )}
                  </div>
                )}
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

            {/* Recording notice — before going live the instructor knows that
                the session is captured in the browser and uploaded afterwards. */}
            {LIVE_RECORDING_SUPPORTED && recordingRequested && !liveStarted && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', color: subtext, fontSize: 12, lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{liveRecordingNote(locale)}</span>
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
