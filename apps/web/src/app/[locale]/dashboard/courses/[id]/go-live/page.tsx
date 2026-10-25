'use client'
import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { get, post } from '../../../../../../lib/api'
import { AuthGate } from '@/app/components/AuthGate'
import { learnUrlWithToken } from '../../../../../../lib/learn-link'
import {
  Radio, Users, Copy, Check, Play, Square, Hand, MessageSquare,
  TrendingUp, UserCheck, UserX, Send, Wifi, WifiOff, X, CheckCircle2,
} from 'lucide-react'
import { useLiveSocket } from '../../../../../../hooks/useLiveSocket'
import { formatLiveTime } from '../../../../../../lib/live'
import { DailyCall } from '@/app/components/live/DailyCall'
import toast from 'react-hot-toast'

export default function GoLivePage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const border = 'rgba(255,255,255,0.08)'
  const cardBg = '#111111'
  const text = '#f1f5f9'
  const subtext = '#94a3b8'

  const [liveStarted, setLiveStarted] = useState(false)
  const [starting, setStarting] = useState(false)
  const [ending, setEnding] = useState(false)
  const [streamEnded, setStreamEnded] = useState(false)
  const [roomUrl, setRoomUrl] = useState('')
  const [token, setToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [peakViewers, setPeakViewers] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [activeTab, setActiveTab] = useState<'questions' | 'comments'>('questions')
  const [newComment, setNewComment] = useState('')
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => { const r = await get('/auth/me'); return r.data?.data ?? r.data },
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

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => { const res = await get(`/courses/${courseId}`); return res.data?.data ?? res.data },
  })

  const courseTitle = course?.titleAr || course?.titleEn || ''
  const liveLink = learnUrlWithToken(`/${locale}/live/${courseId}`)

  useEffect(() => {
    let timer: any
    if (liveStarted) {
      timer = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      setElapsed(0)
    }
    return () => clearInterval(timer)
  }, [liveStarted])

  useEffect(() => {
    if (viewerCount > peakViewers) setPeakViewers(viewerCount)
  }, [viewerCount])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const handleStartLive = async () => {
    setStarting(true)
    try {
      const res = await post(`/live/start/${courseId}`, {})
      const data = res.data?.data ?? res.data
      if (!data?.roomUrl || !data?.token) throw new Error('Missing roomUrl or token')
      setRoomUrl(data.roomUrl)
      setToken(data.token)
      setLiveStarted(true)
      broadcastLiveStarted('', '')
      toast.success(isAr ? 'البث المباشر بدأ!' : 'Live stream started!')
    } catch (e: any) {
      toast.error(e.message || (isAr ? 'فشل بدء البث' : 'Failed to start'))
    } finally {
      setStarting(false)
    }
  }

  const handleEndLive = async () => {
    setEnding(true)
    setStreamEnded(true)
    try {
      broadcastLiveEnded()
      await new Promise(r => setTimeout(r, 500))
      await post(`/live/end/${courseId}`, {})
      setRoomUrl('')
      setToken('')
      toast.success(isAr ? 'تم إنهاء البث' : 'Stream ended')
      setTimeout(() => router.push(`/${locale}/dashboard/my-courses`), 3000)
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setEnding(false)
    }
  }

  const pendingQuestions = questions.filter(q => !q.approved && !q.answered)
  const approvedQuestions = questions.filter(q => q.approved && !q.answered)

  return (
    <AuthGate>
      {showEndConfirm && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#111', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', padding: '28px', width: 'min(380px,calc(100vw-32px))', zIndex: 201, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Square size={24} color="#dc2626" />
            </div>
            <h3 style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 900, margin: '0 0 8px' }}>
              {isAr ? 'إنهاء البث المباشر؟' : 'End Live Stream?'}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
              {isAr ? 'سيتم إنهاء البث وإشعار جميع المشاهدين تلقائياً' : 'Stream will end and all viewers will be notified automatically'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowEndConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: 11, background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={async () => { setShowEndConfirm(false); await handleEndLive() }} style={{ flex: 1, padding: '12px', borderRadius: 11, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                {isAr ? 'نعم، إنهاء البث' : 'Yes, End Stream'}
              </button>
            </div>
          </div>
        </>
      )}

      <div style={{ minHeight: '100vh', background: '#0a0a0a', direction: isAr ? 'rtl' : 'ltr', display: 'flex', flexDirection: 'column' }}>
        <style>{`@keyframes livePulse{0%,100%{opacity:1}50%{opacity:.3}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {/* TOP BAR */}
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 14, background: '#0d0d0d', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {liveStarted && !streamEnded && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', animation: 'livePulse 1.5s infinite' }} />}
            <span style={{ color: liveStarted && !streamEnded ? '#dc2626' : subtext, fontSize: 12, fontWeight: 800, letterSpacing: '0.05em' }}>
              {streamEnded ? (isAr ? 'انتهى البث' : 'STREAM ENDED') : liveStarted ? (isAr ? 'على الهواء' : 'ON AIR') : (isAr ? 'استوديو البث' : 'LIVE STUDIO')}
            </span>
            {liveStarted && !streamEnded && <span style={{ color: '#dc2626', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>{formatTime(elapsed)}</span>}
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
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: isAr ? 'auto' : 0, marginLeft: isAr ? 0 : 'auto' }}>
            {connected
              ? <span style={{ color: '#16a34a', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}><Wifi size={11} />{isAr ? 'متصل' : 'Connected'}</span>
              : liveStarted
                ? <span style={{ color: '#f59e0b', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}><WifiOff size={11} />{isAr ? 'غير متصل' : 'Disconnected'}</span>
                : null}
            <button onClick={() => router.push(`/${locale}/dashboard/my-courses`)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: subtext }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 0, overflow: 'hidden' }}>

          {/* LEFT: Video + Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '20px', gap: 16, overflow: 'auto' }}>

            {/* Daily.co iframe or pre-live placeholder */}
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', border: `1px solid ${border}` }}>
              {liveStarted && roomUrl && token ? (
                <DailyCall roomUrl={roomUrl} token={token} />
              ) : streamEnded ? (
                <div style={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <CheckCircle2 size={34} color="#16a34a" />
                  <p style={{ color: text, fontSize: 15, fontWeight: 800, margin: 0 }}>
                    {isAr ? 'انتهى البث المباشر' : 'The live stream has ended'}
                  </p>
                  <p style={{ color: subtext, fontSize: 12, margin: 0 }}>
                    {isAr ? 'سيظهر التسجيل في مكتبة الكورس خلال بضع دقائق' : 'Recording will appear in the course library in a few minutes'}
                  </p>
                </div>
              ) : (
                <div style={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Radio size={28} color="#dc2626" />
                  </div>
                  <p style={{ color: subtext, fontSize: 13, margin: 0 }}>{isAr ? 'اضغط "ابدأ البث" للانطلاق' : 'Press "Go Live" to start'}</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px', background: cardBg, borderRadius: 14, border: `1px solid ${border}` }}>
              {liveStarted ? (
                <button onClick={() => setShowEndConfirm(true)} disabled={ending || streamEnded} style={{ height: 44, paddingInline: 20, borderRadius: 22, background: '#dc2626', border: 'none', cursor: ending || streamEnded ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, fontWeight: 800, opacity: ending || streamEnded ? 0.7 : 1 }}>
                  <Square size={15} />
                  {streamEnded ? (isAr ? 'انتهى البث' : 'Stream Ended') : (isAr ? 'إنهاء البث' : 'End Stream')}
                </button>
              ) : (
                <button onClick={handleStartLive} disabled={starting} style={{ height: 48, paddingInline: 28, borderRadius: 14, background: '#dc2626', border: 'none', cursor: starting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, fontWeight: 800, opacity: starting ? 0.7 : 1 }}>
                  {starting ? (
                    <><div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />{isAr ? 'جارٍ الاتصال...' : 'Connecting...'}</>
                  ) : (
                    <><Play size={18} />{isAr ? 'ابدأ البث' : 'Go Live'}</>
                  )}
                </button>
              )}
            </div>

            {/* Share link */}
            <div style={{ padding: '14px 16px', background: cardBg, borderRadius: 12, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: subtext, fontSize: 10, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isAr ? 'رابط الجلسة' : 'Share Link'}</div>
                <div dir="ltr" title={liveLink} style={{ color: text, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{liveLink}</div>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(liveLink); setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success(isAr ? 'تم نسخ الرابط' : 'Link copied!') }} style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copied ? '#16a34a' : subtext, flexShrink: 0 }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            {/* Info note */}
            {!liveStarted && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)', color: subtext, fontSize: 12, lineHeight: 1.6 }}>
                {isAr
                  ? 'سيتم تسجيل الجلسة تلقائياً على Daily.co وستظهر في مكتبة الكورس بعد انتهاء البث.'
                  : 'The session will be automatically recorded by Daily.co and appear in the course library after the stream ends.'}
              </div>
            )}
          </div>

          {/* RIGHT: Questions & Comments Panel */}
          <div style={{ borderLeft: isAr ? 'none' : '1px solid #1a1a1a', borderRight: isAr ? '1px solid #1a1a1a' : 'none', display: 'flex', flexDirection: 'column', background: '#0d0d0d', overflow: 'hidden' }}>

            <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
              {[
                { key: 'questions', ar: 'الأسئلة', en: 'Questions', icon: Hand, badge: pendingQuestions.length },
                { key: 'comments', ar: 'التعليقات', en: 'Comments', icon: MessageSquare, badge: comments.length },
              ].map(tab => {
                const active = activeTab === tab.key
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', background: 'none', border: 'none', cursor: 'pointer', color: active ? '#f1f5f9' : subtext, borderBottom: `2px solid ${active ? '#dc2626' : 'transparent'}`, fontSize: 12, fontWeight: 700 }}>
                    <tab.icon size={13} />
                    {isAr ? tab.ar : tab.en}
                    {tab.badge > 0 && <span style={{ padding: '1px 6px', borderRadius: 10, background: tab.key === 'questions' ? '#d97706' : '#5120c8', color: '#fff', fontSize: 9, fontWeight: 800 }}>{tab.badge}</span>}
                  </button>
                )
              })}
            </div>

            {/* Questions */}
            {activeTab === 'questions' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                {!liveStarted ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                    <Hand size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: 8 }} />
                    <p style={{ color: subtext, fontSize: 12 }}>{isAr ? 'ستظهر الأسئلة هنا أثناء البث' : 'Questions will appear here during stream'}</p>
                  </div>
                ) : pendingQuestions.length === 0 && approvedQuestions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                    <p style={{ color: subtext, fontSize: 12 }}>{isAr ? 'لا توجد أسئلة بعد' : 'No questions yet'}</p>
                  </div>
                ) : (
                  <>
                    {pendingQuestions.map(q => (
                      <div key={q.id} style={{ padding: '12px', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#5120c8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 800 }}>{q.userName[0]}</div>
                          <span style={{ color: text, fontSize: 11, fontWeight: 700 }}>{q.userName}</span>
                          <span style={{ color: subtext, fontSize: 10, marginRight: isAr ? 0 : 'auto', marginLeft: isAr ? 'auto' : 0 }}>{formatLiveTime(q.timestamp, locale)}</span>
                        </div>
                        <p style={{ color: text, fontSize: 12, margin: '0 0 10px', lineHeight: 1.5 }}>{q.text}</p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => approveQuestion(q.id)} style={{ flex: 1, padding: '6px', borderRadius: 7, background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.3)', color: '#16a34a', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                            <UserCheck size={11} />{isAr ? 'موافقة' : 'Approve'}
                          </button>
                          <button onClick={() => dismissQuestion(q.id)} style={{ width: 32, height: 32, borderRadius: 7, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserX size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {approvedQuestions.map(q => (
                      <div key={q.id} style={{ padding: '12px', borderRadius: 10, border: '1px solid rgba(22,163,74,0.25)', background: 'rgba(22,163,74,0.06)', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <CheckCircle2 size={12} color="#16a34a" />
                          <span style={{ color: text, fontSize: 11, fontWeight: 700 }}>{q.userName}</span>
                        </div>
                        <p style={{ color: text, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{q.text}</p>
                        <button onClick={() => answerQuestion(q.id)} style={{ marginTop: 8, width: '100%', padding: '5px', borderRadius: 7, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)', color: '#16a34a', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                          {isAr ? 'تم الإجابة' : 'Mark Answered'}
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Comments */}
            {activeTab === 'comments' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {comments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                      <MessageSquare size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: 8 }} />
                      <p style={{ color: subtext, fontSize: 12 }}>{isAr ? 'ستظهر التعليقات هنا' : 'Comments will appear here'}</p>
                    </div>
                  ) : comments.map((c, i) => (
                    <div key={c.id || i} style={{ display: 'flex', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#5120c8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{c.userName[0]}</div>
                      <div style={{ flex: 1 }}>
                        <span style={{ color: '#7c6bc9', fontSize: 11, fontWeight: 700 }}>{c.userName} </span>
                        <span style={{ color: '#e2e8f0', fontSize: 12 }}>{c.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '10px', borderTop: `1px solid ${border}`, flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input value={newComment} onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && newComment.trim() && (sendComment(newComment), setNewComment(''))}
                      placeholder={isAr ? 'أضف تعليقاً...' : 'Add comment...'}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, color: text, fontSize: 12, outline: 'none' }} />
                    <button onClick={() => { if (newComment.trim()) { sendComment(newComment); setNewComment('') } }}
                      style={{ width: 32, height: 32, borderRadius: '50%', background: newComment.trim() ? '#5120c8' : 'rgba(255,255,255,0.06)', border: 'none', cursor: newComment.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                      <Send size={13} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div style={{ padding: '12px 14px', borderTop: `1px solid ${border}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, flexShrink: 0 }}>
              {[
                { label: isAr ? 'مشاهدون' : 'Live', val: viewerCount, color: '#dc2626' },
                { label: isAr ? 'الذروة' : 'Peak', val: peakViewers, color: '#d97706' },
                { label: isAr ? 'أسئلة' : 'Questions', val: questions.length, color: '#5120c8' },
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
