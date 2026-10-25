'use client'
import { useState, useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import {
  Radio, Users, LogOut, Hand, MessageSquare, Send, X, Wifi, WifiOff, Square,
} from 'lucide-react'
import { useLiveSocket } from '../../../../hooks/useLiveSocket'
import { syncAuthUser } from '../../../../lib/auth-sync'
import { webLoginUrl } from '../../../../lib/constants'
import { patch } from '../../../../lib/api'
import { DailyCall } from '../../../components/live/DailyCall'
import toast from 'react-hot-toast'

type LiveState = 'loading' | 'not_found' | 'ended_with_recording' | 'ended_no_recording' | 'waiting' | 'live'

export default function LiveViewerPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const tl = useTranslations('learn')
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string

  const API = (() => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL
    const base = (envUrl && envUrl.trim()) ? envUrl.trim() : 'https://api.deveways.com'
    const cleaned = base.replace(/\/+$/, '')
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`
  })()

  const [liveState, setLiveState] = useState<LiveState>('loading')
  const [roomUrl, setRoomUrl] = useState('')
  const [token, setToken] = useState('')
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState(tl('viewer'))
  const [userAvatar, setUserAvatar] = useState('')
  const [showPanel, setShowPanel] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [showQuestionInput, setShowQuestionInput] = useState(false)
  const [hasQuestion, setHasQuestion] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [userToken, setUserToken] = useState('')

  const pollRef = useRef<any>(null)
  const joinedRef = useRef(false)

  const {
    connected,
    viewerCount: socketViewerCount,
    comments: socketComments,
    streamEnded: hookStreamEnded,
    streamStarted: hookStreamStarted,
    sendComment,
    sendQuestion,
  } = useLiveSocket(courseId, userName, 'viewer', userAvatar)

  useEffect(() => {
    if (hookStreamEnded) {
      joinedRef.current = false
      clearInterval(pollRef.current)
      checkForRecordingAndSetState()
    }
  }, [hookStreamEnded])

  useEffect(() => {
    if (hookStreamStarted && liveState === 'waiting') {
      const t = userToken || getStoredToken()
      if (t) joinLive(t)
    }
  }, [hookStreamStarted])

  useEffect(() => {
    if (socketViewerCount > 0) setViewerCount(socketViewerCount)
  }, [socketViewerCount])

  const getStoredToken = (): string =>
    localStorage.getItem('token') || sessionStorage.getItem('token') ||
    localStorage.getItem('careerhub_token') || localStorage.getItem('deveway_token') || ''

  const getAuthHeader = (t: string): Record<string, string> =>
    t ? { Authorization: `Bearer ${t}` } : {}

  // Entry point: check status before attempting to join
  const checkStatusAndProceed = async (t: string) => {
    try {
      const res = await fetch(`${API}/live/status/${courseId}`, {
        headers: getAuthHeader(t),
        cache: 'no-store',
      })

      if (res.status === 404) {
        setLiveState('not_found')
        return
      }

      const raw = await res.json()
      const status = raw?.data ?? raw

      if (!status?.exists) {
        setLiveState('not_found')
        return
      }

      if (!status.isLive) {
        // Stream already ended — resolve recording state immediately
        const recUrl: string | null = status.recordingUrl ?? null
        if (recUrl) {
          setRecordingUrl(recUrl)
          setLiveState('ended_with_recording')
        } else {
          // Try the dedicated recording endpoint once
          const recRes = await fetch(`${API}/live/recording/public/${courseId}`, {
            cache: 'no-store',
          })
          if (recRes.ok) {
            const recRaw = await recRes.json()
            const url: string | null =
              recRaw?.data?.recordingUrl ?? recRaw?.recordingUrl ?? null
            if (url) {
              setRecordingUrl(url)
              setLiveState('ended_with_recording')
              return
            }
          }
          setLiveState('ended_no_recording')
        }
        return
      }

      // Live is active — join
      await joinLive(t)
    } catch {
      setLiveState('waiting')
      startPolling(t)
    }
  }

  const joinLive = async (t: string) => {
    if (!t || joinedRef.current) return
    try {
      const res = await fetch(`${API}/live/join/${courseId}`, {
        headers: getAuthHeader(t),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('join failed')
      const raw = await res.json()
      const data = raw?.data ?? raw

      if (data.isLive && data.roomUrl && data.token) {
        setRoomUrl(data.roomUrl)
        setToken(data.token)
        setLiveState('live')
        joinedRef.current = true
        clearInterval(pollRef.current)
        patch(`/live/viewers/${courseId}`, { delta: 1 }).catch(() => {})
      } else {
        setLiveState('waiting')
        startPolling(t)
      }
    } catch {
      setLiveState('waiting')
      startPolling(t)
    }
  }

  const startPolling = (t: string) => {
    clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      if (joinedRef.current) { clearInterval(pollRef.current); return }
      try {
        const res = await fetch(`${API}/live/status/${courseId}`, {
          headers: getAuthHeader(t),
          cache: 'no-store',
        })
        if (!res.ok) return
        const raw = await res.json()
        const status = raw?.data ?? raw

        if (!status?.exists) {
          setLiveState('not_found')
          clearInterval(pollRef.current)
          return
        }

        if (!status.isLive && status.exists) {
          clearInterval(pollRef.current)
          const recUrl: string | null = status.recordingUrl ?? null
          if (recUrl) {
            setRecordingUrl(recUrl)
            setLiveState('ended_with_recording')
          } else {
            setLiveState('ended_no_recording')
          }
          return
        }

        if (status.isLive) {
          clearInterval(pollRef.current)
          await joinLive(t)
        }
      } catch {}
    }, 10000)
  }

  const checkForRecordingAndSetState = async () => {
    const t = userToken || getStoredToken()
    try {
      const res = await fetch(`${API}/live/status/${courseId}`, {
        headers: t ? getAuthHeader(t) : {},
        cache: 'no-store',
      })
      if (!res.ok) {
        setLiveState('ended_no_recording')
        return
      }
      const raw = await res.json()
      const status = raw?.data ?? raw
      const recUrl: string | null = status?.recordingUrl ?? null
      if (recUrl) {
        setRecordingUrl(recUrl)
        setLiveState('ended_with_recording')
      } else {
        // Try dedicated recording endpoint
        const recRes = await fetch(`${API}/live/recording/public/${courseId}`, { cache: 'no-store' })
        if (recRes.ok) {
          const recRaw = await recRes.json()
          const url: string | null = recRaw?.data?.recordingUrl ?? recRaw?.recordingUrl ?? null
          if (url) {
            setRecordingUrl(url)
            setLiveState('ended_with_recording')
            return
          }
        }
        setLiveState('ended_no_recording')
      }
    } catch {
      setLiveState('ended_no_recording')
    }
  }

  const handleLeave = () => {
    clearInterval(pollRef.current)
    const t = userToken || getStoredToken()
    if (t && liveState === 'live') patch(`/live/viewers/${courseId}`, { delta: -1 }).catch(() => {})
    router.back()
  }

  const handleSendComment = () => {
    if (!newComment.trim()) return
    sendComment(newComment)
    setNewComment('')
  }

  const handleSubmitQuestion = () => {
    if (!questionText.trim()) return
    sendQuestion(questionText)
    setHasQuestion(true)
    setShowQuestionInput(false)
    toast.success(tl('questionSent'))
    setQuestionText('')
  }

  useEffect(() => {
    const stored = localStorage.getItem('userName') || ''
    if (stored) setUserName(stored)
    const storedAvatar = localStorage.getItem('user_avatar') || ''
    if (storedAvatar) setUserAvatar(storedAvatar)

    const t = getStoredToken()
    if (!t) {
      window.location.href = webLoginUrl(locale, `/${locale}/live/${courseId}`)
      return
    }

    setUserToken(t)
    syncAuthUser().then((user: any) => {
      const profile = user?.profile
      if (profile) {
        const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || tl('viewer')
        setUserName(name)
        setUserAvatar(profile.avatar || '')
        localStorage.setItem('userName', name)
        localStorage.setItem('user_avatar', profile.avatar || '')
      }
    }).catch(() => {})

    checkStatusAndProceed(t)

    return () => { clearInterval(pollRef.current) }
  }, [courseId])

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (liveState === 'loading') return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(220,38,38,0.2)', borderTopColor: '#dc2626', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{tl('connectingToStream')}</div>
    </div>
  )

  // ─── Not Found ────────────────────────────────────────────────────────────
  if (liveState === 'not_found') return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ fontSize: '3rem' }}>🔍</div>
      <h2 style={{ color: '#f1f5f9', margin: 0 }}>هذا البث غير موجود</h2>
      <p style={{ color: '#6b7280', margin: 0 }}>تأكد من صحة الرابط أو تواصل مع المحاضر.</p>
      <button
        onClick={() => router.push(`/${locale}/courses`)}
        style={{ marginTop: 8, padding: '10px 24px', background: '#5120c8', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
      >
        تصفح الكورسات
      </button>
    </div>
  )

  // ─── Ended with recording ─────────────────────────────────────────────────
  if (liveState === 'ended_with_recording') return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ fontSize: '2.5rem' }}>🎬</div>
      <h2 style={{ color: '#f1f5f9', margin: 0 }}>انتهى البث المباشر</h2>
      <p style={{ color: '#94a3b8', margin: 0 }}>يمكنك مشاهدة التسجيل الآن.</p>
      {recordingUrl && (
        <div style={{ width: '100%', maxWidth: 720, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          <video
            src={recordingUrl}
            controls
            playsInline
            style={{ width: '100%', display: 'block', aspectRatio: '16/9', background: '#000' }}
          />
        </div>
      )}
      <button
        onClick={() => router.push(`/${locale}/courses/${courseId}`)}
        style={{ padding: '11px 24px', borderRadius: 11, background: '#5120c8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
      >
        {isAr ? 'شاهد التسجيل في الكورس' : 'View in Course'}
      </button>
    </div>
  )

  // ─── Ended no recording ───────────────────────────────────────────────────
  if (liveState === 'ended_no_recording') return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
      <div style={{ fontSize: '2.5rem' }}>📹</div>
      <h2 style={{ color: '#f1f5f9', margin: 0 }}>انتهى البث المباشر</h2>
      <p style={{ color: '#94a3b8', margin: 0, textAlign: 'center' }}>
        {isAr ? 'سيتوفر التسجيل قريباً — يُرجى المراجعة لاحقاً.' : 'The recording will be available soon — please check back later.'}
      </p>
      <button
        onClick={() => router.push(`/${locale}/courses/${courseId}`)}
        style={{ marginTop: 8, padding: '11px 24px', borderRadius: 11, background: '#5120c8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
      >
        {isAr ? 'العودة إلى الكورس' : 'Back to Course'}
      </button>
    </div>
  )

  // ─── Live + waiting ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', direction: isAr ? 'rtl' : 'ltr' }}>
      <style>{`@keyframes livePulse{0%,100%{opacity:1}50%{opacity:.3}}@keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* TOP BAR */}
      <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: liveState === 'live' ? '#dc2626' : '#6b7280', animation: liveState === 'live' ? 'livePulse 1.5s infinite' : 'none' }} />
          <span style={{ color: liveState === 'live' ? '#dc2626' : '#6b7280', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em' }}>LIVE</span>
        </div>
        {viewerCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={12} color="rgba(255,255,255,0.5)" />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{viewerCount}</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: isAr ? 0 : 'auto', marginLeft: isAr ? 'auto' : 0 }}>
          {connected
            ? <><Wifi size={12} color="#16a34a" /><span style={{ color: '#16a34a', fontSize: 11 }}>{tl('connected')}</span></>
            : <><WifiOff size={12} color="#f59e0b" /><span style={{ color: '#f59e0b', fontSize: 11 }}>{tl('connecting')}</span></>}
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

        {/* Video area */}
        <div style={{ position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          {liveState === 'live' && roomUrl && token ? (
            <div style={{ width: '100%', height: '100%' }}>
              <DailyCall roomUrl={roomUrl} token={token} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 24, textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(220,38,38,0.25)', animation: 'livePulse 2s ease-in-out infinite' }} />
                <span style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px solid rgba(220,38,38,0.4)', animation: 'livePulse 2s ease-in-out infinite 0.4s' }} />
                <Radio size={28} color="rgba(220,38,38,0.55)" />
              </div>
              <p style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 800, margin: 0 }}>{tl('streamNotStartedTitle')}</p>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, maxWidth: 340, lineHeight: 1.7, margin: 0 }}>{tl('streamNotStartedDesc')}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', animation: 'livePulse 1.2s infinite' }} />
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{tl('waitingForInstructor')}</span>
              </div>
            </div>
          )}

          {/* Question input overlay */}
          {showQuestionInput && (
            <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 10, animation: 'slideUp 0.2s ease' }}>
              <div style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', borderRadius: 14, border: '1px solid rgba(245,158,11,0.3)', padding: '14px' }}>
                <div style={{ color: '#d97706', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{tl('typeYourQuestion')}</div>
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

          {/* Controls overlay */}
          {liveState === 'live' && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 20px 16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => { if (hasQuestion) { setHasQuestion(false); setShowQuestionInput(false) } else { setShowQuestionInput(true) } }}
                style={{ height: 36, paddingInline: 14, borderRadius: 18, background: hasQuestion ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', border: `1px solid ${hasQuestion ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: hasQuestion ? '#d97706' : '#fff', fontSize: 12, fontWeight: 700 }}>
                <Hand size={14} />
                {hasQuestion ? tl('cancelQuestion') : tl('raiseHand')}
              </button>
            </div>
          )}
        </div>

        {/* Comments panel */}
        {showPanel && (
          <div style={{ background: '#0d0d0d', borderLeft: isAr ? 'none' : '1px solid rgba(255,255,255,0.06)', borderRight: isAr ? '1px solid rgba(255,255,255,0.06)' : 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
                  {c.avatar
                    ? <img src={c.avatar} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 26, height: 26, borderRadius: '50%', background: c.isOwn ? '#dc2626' : '#5120c8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{(c.userName?.[0]?.toUpperCase() || '?')}</div>}
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#7c6bc9', fontSize: 11, fontWeight: 700 }}>{c.userName} </span>
                    <span style={{ color: '#e2e8f0', fontSize: 12 }}>{c.text}</span>
                  </div>
                </div>
              ))}
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
