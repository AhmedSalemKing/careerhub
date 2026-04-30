'use client'
import { useState, useEffect, useRef } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { get, post } from '../../../../../../lib/api'
import { AuthGate } from '@/app/components/AuthGate'
import {
  Radio, Users, Copy, Check, Mic, MicOff,
  Video, VideoOff, X, CheckCircle2, Play, Square,
  MonitorUp, Hand, MessageSquare, TrendingUp,
  UserCheck, UserX, Send, Wifi, WifiOff
} from 'lucide-react'
import { useLiveSocket } from '../../../../../../hooks/useLiveSocket'
import { confirmToast } from '../../../../../../lib/confirm-toast'
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
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [screenSharing, setScreenSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [peakViewers, setPeakViewers] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [activeTab, setActiveTab] = useState<'questions'|'comments'>('questions')
  const [newComment, setNewComment] = useState('')
  const [pipPos, setPipPos] = useState({ x: 16, y: 16 })

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => { const r = await get('/users/me'); return r.data?.data ?? r.data }
  })
  const instructorName = me?.profile?.firstName || (isAr ? 'المحاضر' : 'Instructor')

  const {
    connected,
    viewerCount,
    comments,
    questions,
    sendComment,
    approveQuestion,
    answerQuestion,
    dismissQuestion,
  } = useLiveSocket(liveStarted ? courseId : '', instructorName, 'instructor')

  const localVideoRef = useRef<HTMLDivElement>(null)
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
  const liveLink = `https://devewayhub.vercel.app/${locale}/live/${courseId}`

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

  const handleStartLive = async () => {
    setStarting(true)
    try {
      const res = await post(`/live/start/${courseId}`, {})
      const data = res.data?.data ?? res.data
      if (!data?.token) throw new Error('No stream token')

      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default
      AgoraRTC.setLogLevel(4)

      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
      await client.setClientRole('host')
      clientRef.current = client

      await client.join(data.appId, data.channelName, data.token, 1)

      const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
      localTracksRef.current = [micTrack, camTrack]

      if (localVideoRef.current) camTrack.play(localVideoRef.current)

      await client.publish([micTrack, camTrack])

      setLiveStarted(true)
      toast.success(isAr ? 'البث المباشر بدأ!' : 'Live stream started!')
    } catch(e: any) {
      toast.error(e.message || (isAr ? 'فشل بدء البث' : 'Failed to start'))
    } finally {
      setStarting(false)
    }
  }

  const toggleMic = async () => {
    const micTrack = localTracksRef.current[0]
    if (micTrack) { await micTrack.setEnabled(!micOn); setMicOn(m => !m) }
  }

  const toggleCam = async () => {
    const camTrack = localTracksRef.current[1]
    if (camTrack) { await camTrack.setEnabled(!camOn); setCamOn(c => !c) }
  }

  const toggleScreenShare = async () => {
    if (!clientRef.current) return
    try {
      const AgoraRTC = (await import('agora-rtc-sdk-ng')).default

      if (screenSharing) {
        if (screenTrackRef.current) {
          screenTrackRef.current.stop()
          screenTrackRef.current.close()
          screenTrackRef.current = null
        }
        const camTrack = localTracksRef.current[1]
        if (localVideoRef.current && camTrack) {
          camTrack.play(localVideoRef.current)
        }
        await clientRef.current.unpublish([])
        if (camTrack) await clientRef.current.publish(camTrack)
        setScreenSharing(false)
        toast.success(isAr ? 'توقف مشاركة الشاشة' : 'Screen sharing stopped')
      } else {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({
          encoderConfig: '1080p_1',
          optimizationMode: 'detail',
        }, 'disable')

        const track = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack
        screenTrackRef.current = track

        const camTrack = localTracksRef.current[1]
        camTrack.stop()

        if (localVideoRef.current) track.play(localVideoRef.current)

        if (pipVideoRef.current && camTrack) {
          camTrack.play(pipVideoRef.current)
        }

        await clientRef.current.unpublish(camTrack)
        await clientRef.current.publish(track)
        setScreenSharing(true)
        toast.success(isAr ? 'جاري مشاركة الشاشة' : 'Screen sharing started')
      }
    } catch(e: any) {
      toast.error(isAr ? 'فشل مشاركة الشاشة' : 'Screen share failed')
    }
  }

  const handleEndLive = async () => {
    confirmToast({
      title: isAr ? 'إنهاء البث' : 'End Stream',
      message: isAr ? 'هل تريد إنهاء البث المباشر؟' : 'Are you sure you want to end the live stream?',
      confirmLabel: isAr ? 'نعم، إنهاء' : 'Yes, End',
      cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      confirmColor: '#dc2626',
      onConfirm: async () => {
        setEnding(true)
        try {
          localTracksRef.current.forEach(t => { t.stop(); t.close() })
          if (screenTrackRef.current) { screenTrackRef.current.stop(); screenTrackRef.current.close() }
          if (clientRef.current) await clientRef.current.leave()
          await post(`/live/end/${courseId}`, {})
          toast.success(isAr ? 'تم إنهاء البث' : 'Stream ended')
          router.push(`/${locale}/dashboard/my-courses`)
        } catch(e: any) {
          toast.error(e.message || 'Error')
        } finally {
          setEnding(false)
        }
      },
    })
  }

  const pendingQuestions = questions.filter(q => !q.approved && !q.answered)
  const approvedQuestions = questions.filter(q => q.approved && !q.answered)

  return (
    <AuthGate>
      <div style={{ minHeight: '100vh', background: '#0a0a0a', direction: isAr ? 'rtl' : 'ltr', display: 'flex', flexDirection: 'column' }}>
        <style>{`
          @keyframes livePulse{0%,100%{opacity:1}50%{opacity:.3}}
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        `}</style>

        {/* TOP BAR */}
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 14, background: '#0d0d0d', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {liveStarted && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', animation: 'livePulse 1.5s infinite' }} />}
            <span style={{ color: liveStarted ? '#dc2626' : subtext, fontSize: 12, fontWeight: 800, letterSpacing: '0.05em' }}>
              {liveStarted ? (isAr ? 'على الهواء' : 'ON AIR') : (isAr ? 'استوديو البث' : 'LIVE STUDIO')}
            </span>
            {liveStarted && <span style={{ color: '#dc2626', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>{formatTime(elapsed)}</span>}
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
          <div style={{ display: 'flex', flexDirection: 'column', padding: '20px', gap: 16, overflow: 'auto' }}>

            {/* Video */}
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#000', border: `1px solid ${border}`, aspectRatio: '16/9' }}>
              <div ref={localVideoRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />

              {!liveStarted && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Radio size={28} color="#dc2626" />
                  </div>
                  <p style={{ color: subtext, fontSize: 13, margin: 0 }}>{isAr ? 'الكاميرا غير مفعلة' : 'Camera not active'}</p>
                </div>
              )}

              {liveStarted && (
                <div style={{ position: 'absolute', top: 12, [isAr?'right':'left']: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(220,38,38,0.9)', backdropFilter: 'blur(4px)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'livePulse 1.5s infinite' }} />
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>LIVE</span>
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
                  <button onClick={handleEndLive} disabled={ending} style={{ height: 44, paddingInline: 20, borderRadius: 22, background: '#dc2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 13, fontWeight: 800, opacity: ending ? 0.7 : 1 }}>
                    <Square size={15} />
                    {isAr ? 'إنهاء البث' : 'End Stream'}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                    {[
                      { icon: micOn ? Mic : MicOff, label: isAr?'ميكروفون':'Mic', on: micOn, onClick: () => setMicOn(m => !m) },
                      { icon: camOn ? Video : VideoOff, label: isAr?'كاميرا':'Camera', on: camOn, onClick: () => setCamOn(c => !c) },
                    ].map((btn, i) => (
                      <button key={i} onClick={btn.onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: btn.on ? 'rgba(255,255,255,0.06)' : 'rgba(220,38,38,0.15)', border: `1px solid ${btn.on ? border : 'rgba(220,38,38,0.3)'}`, cursor: 'pointer', color: btn.on ? text : '#dc2626', fontSize: 12, fontWeight: 600 }}>
                        <btn.icon size={14} />
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleStartLive} disabled={starting} style={{ height: 48, paddingInline: 28, borderRadius: 14, background: '#dc2626', border: 'none', cursor: starting?'wait':'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#fff', fontSize: 14, fontWeight: 800, opacity: starting?0.7:1 }}>
                    {starting
                      ? <><div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />{isAr?'جاري التحضير...':'Preparing...'}</>
                      : <><Play size={18} />{isAr?'ابدأ البث المباشر':'Go Live'}</>}
                  </button>
                </>
              )}
            </div>

            {/* Share link */}
            <div style={{ padding: '14px 16px', background: cardBg, borderRadius: 12, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: subtext, fontSize: 10, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isAr?'رابط الجلسة للمشاركة':'Share Link'}</div>
                <div style={{ color: text, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{liveLink}</div>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(liveLink); setCopied(true); setTimeout(()=>setCopied(false),2000); toast.success(isAr?'تم نسخ الرابط':'Link copied!') }} style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copied?'#16a34a':subtext, flexShrink: 0 }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
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
                              <span style={{ color: subtext, fontSize: 10, marginRight: isAr?0:'auto', marginLeft: isAr?'auto':0 }}>{new Date(q.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
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
