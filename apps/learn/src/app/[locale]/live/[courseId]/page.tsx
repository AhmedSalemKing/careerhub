'use client'
import { useState, useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import {
  Radio, Users, Volume2, VolumeX, Maximize2, Minimize2,
  LogOut, Hand, MessageSquare, Send, X, Wifi, WifiOff, Square
} from 'lucide-react'
import { useLiveSocket } from '../../../../hooks/useLiveSocket'
import { syncAuthUser } from '../../../../lib/auth-sync'
import { webLoginUrl } from '../../../../lib/constants'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'

export default function LiveViewerPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const tl = useTranslations('learn')
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string

  const API = 'https://deve-way.onrender.com/api'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [joined, setJoined] = useState(false)
  const [hasVideo, setHasVideo] = useState(false)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showPanel, setShowPanel] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [hasQuestion, setHasQuestion] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [showQuestionInput, setShowQuestionInput] = useState(false)
  const [userName, setUserName] = useState(tl('viewer'))
  const [userAvatar, setUserAvatar] = useState('')
  const [streamEnded, setStreamEnded] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [streamReady, setStreamReady] = useState(false)
  const [tokenData, setTokenData] = useState<any>(null)
  const [userToken, setUserToken] = useState('')

  // Connection state machine:
  //  loading    -> resolving session / enrollment
  //  waiting    -> stream not started yet (polling until it goes live)
  //  connecting -> stream is live, Agora join in progress (30s cap)
  //  failed     -> join failed or timed out (retry available)
  //  watching   -> connected and receiving the stream
  //  ended      -> stream finished
  const [liveState, setLiveState] = useState<'loading' | 'waiting' | 'connecting' | 'failed' | 'watching' | 'ended'>('loading')
  const [connectError, setConnectError] = useState('')

  const videoContainerRef = useRef<HTMLDivElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<any>(null)
  const socketRef = useRef<any>(null)
  const loadingTimeoutRef = useRef<any>(null)
  const pollRef = useRef<any>(null)
  const connectTimeoutRef = useRef<any>(null)
  // Track whether we have already joined for the current live session so polling
  // and socket events don't trigger duplicate Agora joins.
  const joinedRef = useRef(false)
  const joiningRef = useRef(false)
  // True only once the video track is actually playing (we're watching).
  const watchingRef = useRef(false)

  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || sessionStorage.getItem('token') ||
       localStorage.getItem('careerhub_token') || localStorage.getItem('deveway_token') || '')
    : ''

  useEffect(() => {
    const stored = localStorage.getItem('userName') || localStorage.getItem('user_name') || ''
    if (stored) setUserName(stored)
    const storedAvatar = localStorage.getItem('user_avatar') || ''
    if (storedAvatar) setUserAvatar(storedAvatar)

    const t = typeof window !== 'undefined'
      ? (localStorage.getItem('token') || sessionStorage.getItem('token') ||
         localStorage.getItem('careerhub_token') || localStorage.getItem('deveway_token') || '')
      : ''
    if (t) {
      syncAuthUser()
        .then((user: any) => {
          const profile = user?.profile
          if (profile) {
            const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || tl('viewer')
            setUserName(name)
            setUserAvatar(profile.avatar || '')
            localStorage.setItem('userName', name)
            localStorage.setItem('user_avatar', profile.avatar || '')
          }
        })
        .catch(() => {})
    }
  }, [])

  // Parse lessonId from URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setLessonId(params.get('lessonId'))
  }, [])

  const {
    connected,
    viewerCount: socketViewerCount,
    comments: socketComments,
    streamEnded: hookStreamEnded,
    streamStarted: hookStreamStarted,
    sendComment,
    sendQuestion,
  } = useLiveSocket(courseId, userName, 'viewer', userAvatar)

  // Sync hook state to local state
  useEffect(() => {
    if (hookStreamEnded) {
      setStreamEnded(true)
      clientRef.current?.leave().catch(() => {})
    }
  }, [hookStreamEnded])

  // Check stream status: enrollment + token fetch (no Agora init).
  // `silent` is used by the background poll so it doesn't flash the loading UI.
  const checkStreamStatus = async (userToken: string, silent = false) => {
    if (!userToken) return
    if (!silent) {
      setLoading(true)
      setLiveState('loading')
    }
    setError('')

    clearTimeout(loadingTimeoutRef.current)
    if (!silent) {
      loadingTimeoutRef.current = setTimeout(() => {
        // Safety net: never leave the generic spinner up forever.
        setLoading(false)
        setJoined(true)
        setLiveState(prev => (prev === 'loading' ? 'waiting' : prev))
      }, 15000)
    }

    try {
      const courseRes = await fetch(`${API}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
        signal: AbortSignal.timeout(8000)
      })
      if (!courseRes.ok) throw new Error('Course not found')
      const courseData = await courseRes.json()
      const course = courseData?.data || courseData

      if (course?.liveStatus === 'ended' || course?.liveStatus === 'ENDED') {
        clearTimeout(loadingTimeoutRef.current)
        setLiveState('ended')
        setError('ended')
        setLoading(false)
        return
      }

      const isEnrolled = course?.isEnrolled === true
      const price = parseFloat(course?.price || '0')

      if (!isEnrolled && price > 0) {
        const payRes = await fetch(`${API}/payments/checkout/course/${courseId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale })
        }).then(r => r.json()).catch(() => null)

        clearTimeout(loadingTimeoutRef.current)
        if (payRes?.data?.url) {
          window.location.href = payRes.data.url
        } else {
          setError(tl('enrollFirst'))
          setLiveState('failed')
          setLoading(false)
        }
        return
      }

      if (!isEnrolled && price === 0) {
        await fetch(`${API}/courses/${courseId}/enroll`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' }
        }).catch(() => {})
      }

      // Has the instructor started the stream? Two supported flows:
      //   * course-level live  -> Course.liveStatus === 'live'
      //   * lesson-level live  -> Lesson.liveStatus === 'live' (lessonId in the URL)
      // Only then do we fetch a token and attempt to connect. Before that we show
      // the explicit "waiting" state instead of an endless spinner.
      // Enrolled viewers receive full lesson objects from /courses/:id, so the
      // lesson's liveStatus is available here without any API change.
      const lesson = lessonId
        ? (course?.sections || [])
            .flatMap((s: any) => s?.lessons || [])
            .find((l: any) => l?.id === lessonId || l?.lessonId === lessonId)
        : null

      const courseLive = course?.liveStatus === 'live' || course?.liveStatus === 'LIVE'
      const lessonLive = lesson?.liveStatus === 'live' || lesson?.liveStatus === 'LIVE'
      const liveNow = lessonId ? (lessonLive || (lesson ? false : courseLive)) : courseLive

      if (!liveNow) {
        clearTimeout(loadingTimeoutRef.current)
        setStreamReady(false)
        setTokenData(null)
        setLoading(false)
        setJoined(false)
        // Only move to "waiting" when we're not mid-join.
        if (!joinedRef.current && !joiningRef.current) {
          setLiveState('waiting')
        }
        return
      }

      // Already connected for this live session — nothing more to do.
      if (joinedRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        setLoading(false)
        return
      }

      const tokenEndpoint = lessonId
        ? `${API}/live/lesson-token/${lessonId}`
        : `${API}/live/token/${courseId}`
      const tokenRes = await fetch(tokenEndpoint, {
        headers: { Authorization: `Bearer ${userToken}` },
        signal: AbortSignal.timeout(8000)
      })

      if (tokenRes.status === 403) {
        clearTimeout(loadingTimeoutRef.current)
        setLiveState('ended')
        setError('ended')
        setLoading(false)
        return
      }

      if (!tokenRes.ok) {
        clearTimeout(loadingTimeoutRef.current)
        setLoading(false)
        setJoined(true)
        setConnectError(tl('failedToConnect'))
        setLiveState('failed')
        return
      }

      const data = await tokenRes.json()
      const td = data?.data || data

      if (!td?.token || !td?.appId || !td?.channelName) {
        clearTimeout(loadingTimeoutRef.current)
        setLoading(false)
        setJoined(true)
        setConnectError(tl('failedToConnect'))
        setLiveState('failed')
        return
      }

      clearTimeout(loadingTimeoutRef.current)
      setTokenData(td)
      setStreamReady(true)
      setLoading(false)
      setJoined(true)
      // Stream is live and we hold a token: auto-connect (no manual click needed).
      void handleJoinStream(td)
    } catch (e: any) {
      clearTimeout(loadingTimeoutRef.current)
      console.error('[Live] Check error:', e.message)
      // Connection-level failures stay inside the player so the student gets the
      // inline retry button instead of a full-page error.
      const msg = (e.name === 'AbortError' || e.name === 'TimeoutError')
        ? tl('connectionTimeout')
        : (e.message || tl('failedToConnect'))
      setConnectError(msg)
      setLiveState('failed')
      setLoading(false)
    }
  }

  // Init Agora + start stream playback. Accepts an explicit token payload so it
  // can be called automatically from polling/socket detection, while still being
  // safe to call from the manual "Join Live Stream" button.
  const handleJoinStream = async (overrideTokenData?: any) => {
    const td = overrideTokenData || tokenData
    if (!td || clientRef.current || joiningRef.current) return

    joiningRef.current = true
    setConnectError('')
    setLiveState('connecting')

    // Fail the connection attempt after 30s instead of spinning forever. The
    // cap applies until we are actually watching (video track playing), so a live
    // stream that never publishes video still surfaces the retry button.
    clearTimeout(connectTimeoutRef.current)
    connectTimeoutRef.current = setTimeout(() => {
      if (!watchingRef.current) {
        setLiveState('failed')
        setConnectError(tl('connectionTimeout'))
        joiningRef.current = false
        joinedRef.current = false
        try { clientRef.current?.leave() } catch {}
        clientRef.current = null
      }
    }, 30000)

    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      AgoraRTC.setLogLevel(4)

      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
      await client.setClientRole('audience')
      clientRef.current = client

      // Resume AudioContext after user gesture (browser autoplay policy)
      try {
        if (typeof window !== 'undefined') {
          const ACtor = (window.AudioContext || (window as any).webkitAudioContext)
          if (ACtor) {
            const ctx = new ACtor()
            await ctx.resume()
          }
        }
      } catch (ae) {
        console.error('[Live] AudioContext resume:', ae)
      }

      client.on('user-published', async (user: any, mediaType: 'audio' | 'video') => {
        await client.subscribe(user, mediaType)
        if (mediaType === 'video' && videoContainerRef.current) {
          user.videoTrack?.play(videoContainerRef.current)
          setHasVideo(true)
          // We are successfully watching — clear the connection timeout.
          clearTimeout(connectTimeoutRef.current)
          joinedRef.current = true
          joiningRef.current = false
          watchingRef.current = true
          setLiveState('watching')
          const overlay = document.getElementById('waiting-overlay')
          if (overlay) overlay.style.display = 'none'
        }
        if (mediaType === 'audio') {
          try { await user.audioTrack?.play() } catch (ae) { console.error('[Live] Audio play:', ae) }
        }
      })

      client.on('user-unpublished', (user: any, mediaType: 'audio' | 'video') => {
        if (mediaType === 'video') {
          user.videoTrack?.stop()
          setHasVideo(false)
          watchingRef.current = false
          // The published video stopped; if the whole stream hasn't ended, keep
          // the user in a "connecting" style state until video returns.
          if (!streamEnded) setLiveState('connecting')
          const overlay = document.getElementById('waiting-overlay')
          if (overlay) overlay.style.display = 'flex'
        }
        if (mediaType === 'audio') user.audioTrack?.stop()
      })

      client.on('token-privilege-will-expire', async () => {
        const renewEndpoint = lessonId
          ? `${API}/live/lesson-token/${lessonId}`
          : `${API}/live/token/${courseId}`
        const res = await fetch(renewEndpoint, {
          headers: { Authorization: `Bearer ${userToken}` }
        }).then(r => r.json()).catch(() => null)
        if (res?.data?.token) await client.renewToken(res.data.token)
      })

      await client.join(td.appId, td.channelName, td.token, td.uid)

      // Joined the channel. Mark the join as done so a poll or socket event
      // doesn't retry; the connection timeout is cleared once video arrives.
      joinedRef.current = true
      joiningRef.current = false

      fetch(`${API}/live/viewers/${courseId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: 1 })
      }).catch(() => {})

    } catch (e: any) {
      console.error('[Live] Join failed:', e.message)
      clearTimeout(connectTimeoutRef.current)
      joiningRef.current = false
      joinedRef.current = false
      watchingRef.current = false
      try { clientRef.current?.leave() } catch {}
      clientRef.current = null
      const msg = (e.name === 'AbortError' || e.name === 'TimeoutError')
        ? tl('connectionTimeout')
        : (e.message?.includes('CAN_NOT_GET_GATEWAY') || e.message?.includes('dynamic key'))
          ? tl('sessionExpired')
          : (e.message || tl('failedToConnect'))
      setConnectError(msg)
      setLiveState('failed')
    }
  }

  // Manual retry from the failed state.
  const handleRetry = async () => {
    clearTimeout(connectTimeoutRef.current)
    joinedRef.current = false
    joiningRef.current = false
    watchingRef.current = false
    try { await clientRef.current?.leave() } catch {}
    clientRef.current = null
    setHasVideo(false)
    setConnectError('')
    setLiveState('connecting')
    await checkStreamStatus(userToken || token, false)
  }

  // When socket detects the stream started, re-check immediately and auto-connect
  // (no manual refresh or button click required).
  useEffect(() => {
    if (hookStreamStarted && !streamReady) {
      setStreamEnded(false)
      setTokenData(null)
      joinedRef.current = false
      watchingRef.current = false
      checkStreamStatus(userToken || token)
    }
  }, [hookStreamStarted])

  // Poll the session status every 15s while the stream has not started yet, so the
  // student is auto-connected as soon as the instructor goes live. Polling stops
  // once we are connected or the stream ends.
  useEffect(() => {
    if (liveState !== 'waiting') return
    const t = userToken || token
    if (!t) return

    pollRef.current = setInterval(() => {
      if (joinedRef.current || joiningRef.current) return
      checkStreamStatus(t, true)
    }, 15000)

    return () => {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [liveState, userToken, token, lessonId])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [socketComments])

  useEffect(() => {
    if (socketViewerCount > 0) {
      setViewerCount(socketViewerCount)
    }
  }, [socketViewerCount])

  // On mount: check stream status (does NOT init Agora — only on user click)
  useEffect(() => {
    if (lessonId === null) return

    const t = localStorage.getItem('token') || sessionStorage.getItem('token') ||
      localStorage.getItem('careerhub_token') || localStorage.getItem('deveway_token') || ''

    if (!t) {
      window.location.href = webLoginUrl(locale, `/${locale}/live/${courseId}`)
      return
    }

    setUserToken(t)
    checkStreamStatus(t)

    return () => {
      clearTimeout(loadingTimeoutRef.current)
      clearTimeout(connectTimeoutRef.current)
      clearInterval(pollRef.current)
      watchingRef.current = false
      joinedRef.current = false
      if (token) {
        fetch(`${API}/live/viewers/${courseId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ delta: -1 })
        }).catch(() => {})
      }
      clientRef.current?.leave().catch(() => {})
    }
  }, [courseId, lessonId])

  const handleSendComment = () => {
    if (!newComment.trim()) return
    sendComment(newComment)
    setNewComment('')
  }

  const handleRaiseHand = () => {
    if (hasQuestion) {
      setHasQuestion(false)
      setShowQuestionInput(false)
      toast.success(tl('questionCancelled'))
    } else {
      setShowQuestionInput(true)
    }
  }

  const handleSubmitQuestion = () => {
    if (!questionText.trim()) return
    sendQuestion(questionText)
    setHasQuestion(true)
    setShowQuestionInput(false)
    toast.success(tl('questionSent'))
    setQuestionText('')
  }

  const handleLeave = async () => {
    if (clientRef.current) await clientRef.current.leave().catch(() => {})
    if (token) {
      fetch(`${API}/live/viewers/${courseId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: -1 })
      }).catch(() => {})
    }
    router.back()
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
      setFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setFullscreen(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(220,38,38,0.2)', borderTopColor: '#dc2626', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{tl('connectingToStream')}</div>
    </div>
  )

  if (error === 'ended') return (
    <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, padding:24, direction:isAr?'rtl':'ltr' }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(107,114,128,0.1)', border:'1px solid rgba(107,114,128,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Square size={32} color="#6b7280" />
      </div>
      <h2 style={{ color:'#f1f5f9', fontSize:20, fontWeight:900, margin:0 }}>
        {tl('streamEndedTitle')}
      </h2>
      <p style={{ color:'#94a3b8', fontSize:14, textAlign:'center', maxWidth:320, lineHeight:1.7 }}>
        {tl('streamEndedDesc')}
      </p>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={() => router.push(`/${locale}/courses/${courseId}`)} style={{ padding:'11px 22px', borderRadius:11, background:'#5120c8', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700 }}>
          {tl('viewCourse')}
        </button>
        <button onClick={() => router.push(`/${locale}/courses`)} style={{ padding:'11px 22px', borderRadius:11, background:'rgba(255,255,255,0.06)', color:'#94a3b8', border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer', fontSize:13, fontWeight:600 }}>
          {tl('browseCourses')}
        </button>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, direction: isAr?'rtl':'ltr' }}>
      <Radio size={56} color="rgba(220,38,38,0.3)" />
      <h3 style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 800, margin: 0, textAlign: 'center' }}>{tl('couldNotJoin')}</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', maxWidth: 360, lineHeight: 1.6 }}>{error}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => router.push(`/${locale}/courses`)} style={{ padding: '11px 22px', borderRadius: 11, background: 'rgba(255,255,255,0.08)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          {tl('backToCourses')}
        </button>
        <button onClick={() => window.location.reload()} style={{ padding: '11px 22px', borderRadius: 11, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          {tl('tryAgain')}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', direction: isAr ? 'rtl' : 'ltr' }}>
      <style>{`
        @keyframes livePulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* TOP BAR */}
      <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', animation: 'livePulse 1.5s infinite' }} />
          <span style={{ color: '#dc2626', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em' }}>LIVE</span>
        </div>
           {viewerCount > 0 && (
             <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
               <Users size={12} color="rgba(255,255,255,0.5)" />
               <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{viewerCount}</span>
             </div>
           )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: isAr ? 0 : 'auto', marginLeft: isAr ? 'auto' : 0 }}>
          {connected ? (
            <>
              <Wifi size={12} color="#16a34a" />
              <span style={{ color: '#16a34a', fontSize: 11 }}>{tl('connected')}</span>
            </>
          ) : (
            <>
              <WifiOff size={12} color="#f59e0b" />
              <span style={{ color: '#f59e0b', fontSize: 11 }}>{tl('connecting')}</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowPanel(p => !p)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
            <MessageSquare size={12} />
            {showPanel ? tl('hide') : tl('show')}
          </button>
          <button onClick={handleLeave} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', cursor: 'pointer', color: '#dc2626', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <LogOut size={12} />
            {tl('leave')}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: showPanel ? '1fr 300px' : '1fr', overflow: 'hidden' }}>

        {/* Video */}
        <div style={{ position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div ref={videoContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />

          {!hasVideo && !streamEnded && (
             <div id="waiting-overlay" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' }}>

               {/* WAITING — instructor has not started the stream yet */}
               {liveState === 'waiting' && (
                 <>
                   <div style={{ position: 'relative', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(220,38,38,0.25)', animation: 'livePulse 2s ease-in-out infinite' }} />
                     <span style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px solid rgba(220,38,38,0.4)', animation: 'livePulse 2s ease-in-out infinite 0.4s' }} />
                     <Radio size={28} color="rgba(220,38,38,0.55)" />
                   </div>
                   <p style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 800, margin: 0 }}>
                     {tl('streamNotStartedTitle')}
                   </p>
                   <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, maxWidth: 340, lineHeight: 1.7, margin: 0 }}>
                     {tl('streamNotStartedDesc')}
                   </p>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                     <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', animation: 'livePulse 1.2s infinite' }} />
                     <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{tl('waitingForInstructor')}</span>
                   </div>
                 </>
               )}

               {/* CONNECTING — stream is live, Agora join in progress (30s cap) */}
               {liveState === 'connecting' && (
                 <>
                   <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(220,38,38,0.2)', borderTopColor: '#dc2626', animation: 'spin 0.8s linear infinite' }} />
                   <p style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700, margin: 0 }}>
                     {tl('connectingToStream')}
                   </p>
                   <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
                     {tl('connectionMayTakeAMoment')}
                   </p>
                 </>
               )}

               {/* FAILED — connection failed or timed out; offer a retry */}
               {liveState === 'failed' && (
                 <>
                   <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <WifiOff size={28} color="#f87171" />
                   </div>
                   <p style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 800, margin: 0 }}>
                     {tl('failedToConnect')}
                   </p>
                   <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, maxWidth: 340, lineHeight: 1.7, margin: 0 }}>
                     {connectError || tl('connectionTimeout')}
                   </p>
                   <button onClick={handleRetry} style={{
                     padding: '11px 30px', borderRadius: 10, background: '#dc2626',
                     color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 800,
                   }}>
                     {tl('tryAgain')}
                   </button>
                 </>
               )}

               {/* Fallback: live but no token yet — allow a manual join once. */}
               {liveState !== 'waiting' && liveState !== 'connecting' && liveState !== 'failed' && streamReady && (
                 <>
                   <div style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Radio size={28} color="rgba(220,38,38,0.4)" />
                   </div>
                   <p style={{ color: '#f87171', fontSize: 14, fontWeight: 700 }}>
                     {tl('liveStreamActive')}
                   </p>
                   <button onClick={() => handleJoinStream()} style={{
                     padding: '12px 32px', borderRadius: 10, background: '#dc2626',
                     color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15,
                     fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8,
                     animation: 'pulse 1.5s infinite',
                   }}>
                     <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />
                     {tl('joinLiveStream')}
                   </button>
                 </>
               )}
             </div>
           )}

           {streamEnded && (
             <div style={{
               position: 'absolute', inset: 0, zIndex: 50,
               background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
               display: 'flex', flexDirection: 'column',
               alignItems: 'center', justifyContent: 'center', gap: 16,
             }}>
               <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(107,114,128,0.15)', border:'1px solid rgba(107,114,128,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                 <Square size={28} color="#6b7280" />
               </div>
                <h2 style={{ color:'#f1f5f9', fontSize:20, fontWeight:900, margin:0 }}>
                  {tl('liveEnded')}
                </h2>
                <p style={{ color:'#94a3b8', fontSize:14, margin:0 }}>
                  {tl('thanksForWatching')}
                </p>
                <button onClick={() => router.push(`/${locale}/courses/${courseId}`)} style={{ padding:'11px 24px', borderRadius:11, background:'#5120c8', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700 }}>
                  {tl('viewCourse')}
                </button>
             </div>
           )}

          {/* Video controls overlay */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 20px 16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setMuted(m => !m)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <button onClick={handleRaiseHand} style={{ height: 36, paddingInline: 14, borderRadius: 18, background: hasQuestion ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', border: `1px solid ${hasQuestion ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: hasQuestion ? '#d97706' : '#fff', fontSize: 12, fontWeight: 700 }}>
              <Hand size={14} />
              {hasQuestion ? tl('cancelQuestion') : tl('raiseHand')}
            </button>

            <div style={{ flex: 1 }} />

            <button onClick={toggleFullscreen} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>

          {/* Question input overlay */}
          {showQuestionInput && (
            <div style={{ position: 'absolute', bottom: 70, left: 20, right: 20, animation: 'slideUp 0.2s ease' }}>
              <div style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', borderRadius: 14, border: '1px solid rgba(245,158,11,0.3)', padding: '14px' }}>
                <div style={{ color: '#d97706', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                  {tl('typeYourQuestion')}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" placeholder={tl('yourQuestionHere')} value={questionText} onChange={e => setQuestionText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmitQuestion()}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 9, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', fontSize: 12, outline: 'none' }} />
                  <button onClick={handleSubmitQuestion} disabled={!questionText.trim()} style={{ padding: '8px 14px', borderRadius: 9, background: '#d97706', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Send size={12} />{tl('send')}
                  </button>
                  <button onClick={() => setShowQuestionInput(false)} style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    <X size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Comments panel */}
        {showPanel && (
          <div style={{ background: '#0d0d0d', borderLeft: isAr?'none':'1px solid rgba(255,255,255,0.06)', borderRight: isAr?'1px solid rgba(255,255,255,0.06)':'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '11px', background: 'none', border: 'none', cursor: 'pointer', color: '#f1f5f9', borderBottom: '2px solid #dc2626', fontSize: 12, fontWeight: 700 }}>
                <MessageSquare size={13} />
                {tl('comments')}
                {socketComments.length > 0 && <span style={{ padding: '1px 6px', borderRadius: 10, background: '#5120c8', color: '#fff', fontSize: 9, fontWeight: 800 }}>{socketComments.length}</span>}
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {socketComments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                  <MessageSquare size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: 8 }} />
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{tl('noComments')}</p>
                </div>
              ) : socketComments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 8, animation: 'slideUp 0.2s ease' }}>
                  {c.avatar ? (
                    <img src={c.avatar} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: c.isOwn ? '#dc2626' : '#5120c8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                      {(c.userName?.[0]?.toUpperCase() || '?')}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#7c6bc9', fontSize: 11, fontWeight: 700 }}>{c.userName} </span>
                    <span style={{ color: '#e2e8f0', fontSize: 12 }}>{c.text}</span>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                <input type="text"
                  placeholder={tl('addComment')}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendComment()}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#f1f5f9', fontSize: 12, outline: 'none' }}
                />
                <button onClick={handleSendComment} disabled={!newComment.trim()} style={{ width: 34, height: 34, borderRadius: '50%', background: newComment.trim() ? '#dc2626' : 'rgba(255,255,255,0.06)', border: 'none', cursor: newComment.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
