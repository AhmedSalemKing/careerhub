'use client'
import { useState, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import {
  Radio, Users, Volume2, VolumeX, Maximize2, Minimize2,
  LogOut, Hand, MessageSquare, Send, X, Wifi, WifiOff, Square
} from 'lucide-react'
import { useLiveSocket } from '../../../../hooks/useLiveSocket'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'

export default function LiveViewerPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
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
  const [userName, setUserName] = useState(isAr ? 'مشاهد' : 'Viewer')
  const [userAvatar, setUserAvatar] = useState('')
  const [streamEnded, setStreamEnded] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [lessonId, setLessonId] = useState<string | null>(null)
  const [streamReady, setStreamReady] = useState(false)
  const [tokenData, setTokenData] = useState<any>(null)
  const [userToken, setUserToken] = useState('')

  const videoContainerRef = useRef<HTMLDivElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<any>(null)
  const socketRef = useRef<any>(null)
  const loadingTimeoutRef = useRef<any>(null)

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
      fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` }
      }).then(r => r.json()).then(data => {
        const profile = data?.data?.profile || data?.profile
        if (profile) {
          const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || (isAr ? 'مشاهد' : 'Viewer')
          setUserName(name)
          setUserAvatar(profile.avatar || '')
          localStorage.setItem('userName', name)
          localStorage.setItem('user_avatar', profile.avatar || '')
        }
      }).catch(() => {})
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

  // Check stream status: enrollment + token fetch (no Agora init)
  const checkStreamStatus = async (userToken: string) => {
    setLoading(true)
    setError('')

    clearTimeout(loadingTimeoutRef.current)
    loadingTimeoutRef.current = setTimeout(() => {
      setLoading(false)
      setJoined(true)
    }, 15000)

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
          setError(isAr ? 'يجب الاشتراك في الكورس أولاً' : 'Please enroll first')
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

      const tokenEndpoint = lessonId
        ? `${API}/live/lesson-token/${lessonId}`
        : `${API}/live/token/${courseId}`
      const tokenRes = await fetch(tokenEndpoint, {
        headers: { Authorization: `Bearer ${userToken}` },
        signal: AbortSignal.timeout(8000)
      })

      if (tokenRes.status === 403) {
        clearTimeout(loadingTimeoutRef.current)
        setError('ended')
        setLoading(false)
        return
      }

      if (!tokenRes.ok) {
        clearTimeout(loadingTimeoutRef.current)
        setLoading(false)
        setJoined(true)
        return
      }

      const data = await tokenRes.json()
      const td = data?.data || data

      if (!td?.token || !td?.appId || !td?.channelName) {
        clearTimeout(loadingTimeoutRef.current)
        setLoading(false)
        setJoined(true)
        return
      }

      clearTimeout(loadingTimeoutRef.current)
      setTokenData(td)
      setStreamReady(true)
      setLoading(false)
      setJoined(true)
    } catch (e: any) {
      clearTimeout(loadingTimeoutRef.current)
      console.error('[Live] Check error:', e.message)
      if (e.name === 'AbortError' || e.name === 'TimeoutError') {
        setError(isAr ? 'انتهت مهلة الاتصال. تحقق من اتصالك بالإنترنت.' : 'Connection timeout. Check your internet.')
      } else {
        setError(e.message || (isAr ? 'فشل الاتصال بالبث' : 'Failed to connect'))
      }
      setLoading(false)
    }
  }

  // Handle user click to join: init Agora + start stream playback
  const handleJoinStream = async () => {
    if (!tokenData || clientRef.current) return

    try {
      const td = tokenData
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
        console.warn('[Live] AudioContext resume:', ae)
      }

      client.on('user-published', async (user: any, mediaType: 'audio' | 'video') => {
        await client.subscribe(user, mediaType)
        if (mediaType === 'video' && videoContainerRef.current) {
          user.videoTrack?.play(videoContainerRef.current)
          setHasVideo(true)
          const overlay = document.getElementById('waiting-overlay')
          if (overlay) overlay.style.display = 'none'
        }
        if (mediaType === 'audio') {
          try { await user.audioTrack?.play() } catch (ae) { console.warn('[Live] Audio play:', ae) }
        }
      })

      client.on('user-unpublished', (user: any, mediaType: 'audio' | 'video') => {
        if (mediaType === 'video') {
          user.videoTrack?.stop()
          setHasVideo(false)
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

      fetch(`${API}/live/viewers/${courseId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${userToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: 1 })
      }).catch(() => {})

    } catch (e: any) {
      console.error('[Live] Join failed:', e.message)
      if (e.name === 'AbortError' || e.name === 'TimeoutError') {
        setError(isAr ? 'انتهت مهلة الاتصال. تحقق من اتصالك بالإنترنت.' : 'Connection timeout. Check your internet.')
      } else if (e.message?.includes('CAN_NOT_GET_GATEWAY') || e.message?.includes('dynamic key')) {
        setError(isAr ? 'انتهت صلاحية الجلسة. أعد تحميل الصفحة.' : 'Session expired. Please reload.')
      } else {
        setError(e.message || (isAr ? 'فشل الاتصال بالبث' : 'Failed to connect'))
      }
    }
  }

  // When socket detects stream started, re-check status and mark ready
  useEffect(() => {
    if (hookStreamStarted && !streamReady) {
      console.log('[Live] Instructor started stream, checking status...')
      setStreamEnded(false)
      setTokenData(null)
      checkStreamStatus(userToken)
    }
  }, [hookStreamStarted])

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
      router.push(`/${locale}/auth/login?returnUrl=/${locale}/live/${courseId}`)
      return
    }

    setUserToken(t)
    checkStreamStatus(t)

    return () => {
      clearTimeout(loadingTimeoutRef.current)
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
      toast.success(isAr ? 'تم إلغاء طلب السؤال' : 'Question request cancelled')
    } else {
      setShowQuestionInput(true)
    }
  }

  const handleSubmitQuestion = () => {
    if (!questionText.trim()) return
    sendQuestion(questionText)
    setHasQuestion(true)
    setShowQuestionInput(false)
    toast.success(isAr ? 'تم إرسال سؤالك للمحاضر' : 'Question sent to instructor')
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
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{isAr ? 'جاري الاتصال بالبث...' : 'Connecting to stream...'}</div>
    </div>
  )

  if (error === 'ended') return (
    <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, padding:24, direction:isAr?'rtl':'ltr' }}>
      <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(107,114,128,0.1)', border:'1px solid rgba(107,114,128,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Square size={32} color="#6b7280" />
      </div>
      <h2 style={{ color:'#f1f5f9', fontSize:20, fontWeight:900, margin:0 }}>
        {isAr ? 'انتهى البث المباشر' : 'Live Stream Has Ended'}
      </h2>
      <p style={{ color:'#94a3b8', fontSize:14, textAlign:'center', maxWidth:320, lineHeight:1.7 }}>
        {isAr ? 'انتهى هذا البث المباشر. تحقق من الكورس لاحقا للتسجيل.' : 'This live stream has ended. Check the course later for the recording.'}
      </p>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={() => router.push(`/${locale}/courses/${courseId}`)} style={{ padding:'11px 22px', borderRadius:11, background:'#5120c8', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700 }}>
          {isAr ? 'عرض الكورس' : 'View Course'}
        </button>
        <button onClick={() => router.push(`/${locale}/courses`)} style={{ padding:'11px 22px', borderRadius:11, background:'rgba(255,255,255,0.06)', color:'#94a3b8', border:'1px solid rgba(255,255,255,0.08)', cursor:'pointer', fontSize:13, fontWeight:600 }}>
          {isAr ? 'تصفح الكورسات' : 'Browse Courses'}
        </button>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, direction: isAr?'rtl':'ltr' }}>
      <Radio size={56} color="rgba(220,38,38,0.3)" />
      <h3 style={{ color: '#f1f5f9', fontSize: 16, fontWeight: 800, margin: 0, textAlign: 'center' }}>{isAr?'تعذر الاتصال بالبث':'Could Not Join Stream'}</h3>
      <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', maxWidth: 360, lineHeight: 1.6 }}>{error}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => router.push(`/${locale}/courses`)} style={{ padding: '11px 22px', borderRadius: 11, background: 'rgba(255,255,255,0.08)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          {isAr ? 'العودة للكورسات' : 'Back to Courses'}
        </button>
        <button onClick={() => window.location.reload()} style={{ padding: '11px 22px', borderRadius: 11, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          {isAr ? 'إعادة المحاولة' : 'Try Again'}
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
              <span style={{ color: '#16a34a', fontSize: 11 }}>{isAr ? 'متصل' : 'Connected'}</span>
            </>
          ) : (
            <>
              <WifiOff size={12} color="#f59e0b" />
              <span style={{ color: '#f59e0b', fontSize: 11 }}>{isAr ? 'جاري الاتصال...' : 'Connecting...'}</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowPanel(p => !p)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
            <MessageSquare size={12} />
            {showPanel ? (isAr?'إخفاء':'Hide') : (isAr?'إظهار':'Show')}
          </button>
          <button onClick={handleLeave} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', cursor: 'pointer', color: '#dc2626', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <LogOut size={12} />
            {isAr ? 'مغادرة' : 'Leave'}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: showPanel ? '1fr 300px' : '1fr', overflow: 'hidden' }}>

        {/* Video */}
        <div style={{ position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div ref={videoContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />

          {!hasVideo && !streamEnded && (
             <div id="waiting-overlay" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
               <div style={{ width: 72, height: 72, borderRadius: '50%', border: '2px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Radio size={28} color="rgba(220,38,38,0.4)" />
               </div>
               {streamReady ? (
                 <>
                   <p style={{ color: '#f87171', fontSize: 14, fontWeight: 700 }}>
                     {isAr ? 'البث المباشر نشط الآن' : 'Live stream is active'}
                   </p>
                   <button onClick={handleJoinStream} style={{
                     padding: '12px 32px', borderRadius: 10, background: '#dc2626',
                     color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15,
                     fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8,
                     animation: 'pulse 1.5s infinite',
                   }}>
                     <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />
                     {isAr ? 'انضم للبث المباشر' : 'Join Live Stream'}
                   </button>
                 </>
               ) : (
                 <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                   {isAr ? 'في انتظار المحاضر...' : 'Waiting for instructor...'}
                 </p>
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
                 {isAr ? 'تم إنهاء البث المباشر' : 'Live Stream Ended'}
               </h2>
               <p style={{ color:'#94a3b8', fontSize:14, margin:0 }}>
                 {isAr ? 'شكرا لمشاركتك' : 'Thank you for watching'}
               </p>
               <button onClick={() => router.push(`/${locale}/courses/${courseId}`)} style={{ padding:'11px 24px', borderRadius:11, background:'#5120c8', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:700 }}>
                 {isAr ? 'عرض الكورس' : 'View Course'}
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
              {hasQuestion ? (isAr?'إلغاء السؤال':'Cancel') : (isAr?'لدي سؤال':'Raise Hand')}
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
                  {isAr ? 'اكتب سؤالك' : 'Type your question'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" placeholder={isAr?'سؤالك هنا...':'Your question...'} value={questionText} onChange={e => setQuestionText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmitQuestion()}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 9, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', fontSize: 12, outline: 'none' }} />
                  <button onClick={handleSubmitQuestion} disabled={!questionText.trim()} style={{ padding: '8px 14px', borderRadius: 9, background: '#d97706', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Send size={12} />{isAr?'إرسال':'Send'}
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
                {isAr ? 'التعليقات' : 'Comments'}
                {socketComments.length > 0 && <span style={{ padding: '1px 6px', borderRadius: 10, background: '#5120c8', color: '#fff', fontSize: 9, fontWeight: 800 }}>{socketComments.length}</span>}
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {socketComments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                  <MessageSquare size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: 8 }} />
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{isAr?'ستظهر التعليقات هنا':'Comments will appear here'}</p>
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
                  placeholder={isAr ? 'أضف تعليقاً...' : 'Add a comment...'}
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
