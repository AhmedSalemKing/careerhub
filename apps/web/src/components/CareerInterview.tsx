'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { Send, Mic, MicOff, Volume2, VolumeX, FileText, RefreshCw, StopCircle, UserRound, User2 } from 'lucide-react'

interface Message {
  id?: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

export interface CareerInterviewProps {
  isDark: boolean
  onReportReady?: (report: any) => void
  /** context passed to backend: 'career-interview' (default) or 'general-assistant' */
  mode?: 'interview' | 'assistant'
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deveways.com/api'

function getCookieValue(name: string): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : ''
}

function getToken(): string {
  if (typeof window === 'undefined') return ''
  return (
    getCookieValue('access_token') ||
    localStorage.getItem('deveway_token') ||
    localStorage.getItem('careerhub_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    ''
  )
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Rasheed uses a single male Arabic voice — female option is not offered.
const VOICE_OPTIONS = {
  male: { label: { ar: 'صوت ذكر', en: 'Male Voice' }, geminiId: 'Charon' },
} as const
type VoiceGender = keyof typeof VOICE_OPTIONS

// Female voice name fragments used to skip browser synthesis voices that are female.
const ARABIC_FEMALE_NAME_FRAGMENTS = ['layla', 'female', 'mona', 'zainab', 'hala', 'salma', 'rana', 'noura', 'nora', 'fatima', 'taraneh', 'mariam', 'sara', 'lyla']

function findMaleArabicVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  const arabicVoices = voices.filter(v => v.lang.startsWith('ar'))
  if (arabicVoices.length === 0) return null
  return arabicVoices.find(v => {
    const lc = v.name.toLowerCase()
    return !ARABIC_FEMALE_NAME_FRAGMENTS.some(f => lc.includes(f))
  }) ?? null
}

export default function CareerInterview({ isDark, onReportReady, mode = 'interview' }: CareerInterviewProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [report, setReport] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)

  // Voice: 'off' | 'on' — primary path uses Gemini TTS via backend proxy
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('male')
  const [isSpeaking, setIsSpeaking] = useState(false)
  // Whether Gemini TTS is confirmed available (falls back to browser TTS if false)
  const [ttsAvailable, setTtsAvailable] = useState<boolean | null>(null)

  const [stage, setStage] = useState<string>('ORIENTATION')
  const [hasEnoughForReport, setHasEnoughForReport] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const submittingRef = useRef(false)

  const bg = isDark ? '#0d0d0d' : '#fafafa'
  const cardBg = isDark ? '#111111' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const text = isDark ? '#f1f5f9' : '#0d0d0d'
  const subtext = isDark ? '#94a3b8' : '#6b7280'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const userMessages = messages.filter((m) => m.role === 'user').length
    setHasEnoughForReport(mode === 'interview' && userMessages >= 4)
    if (mode === 'interview') {
      if (userMessages >= 10) setStage('RECOMMENDATION')
      else if (userMessages >= 7) setStage('PATH_DIFFERENTIATION')
      else if (userMessages >= 4) setStage('SKILL_EVIDENCE')
      else if (userMessages >= 2) setStage('INTEREST_EXPLORATION')
    }
  }, [messages, mode])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio()
      audioContextRef.current?.close().catch(() => {})
    }
  }, [])

  const startSession = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/career-ai/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ mode }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || 'فشل بدء الجلسة')
      }
      const data = await res.json()
      setSessionId(data.data.sessionId)
      setMessages(data.data.messages || [])
    } catch (err: any) {
      setError(err.message || 'خطأ في الاتصال. يرجى المحاولة مرة أخرى.')
    } finally {
      setIsLoading(false)
    }
  }, [mode])

  useEffect(() => {
    startSession()
  }, [startSession])

  // ─── Gemini TTS via backend proxy ───────────────────────────────────────────
  const speakViaGemini = useCallback(async (textToSpeak: string) => {
    if (!textToSpeak?.trim() || !sessionId) return
    const clean = textToSpeak.replace(/[*_`#>]/g, '').slice(0, 1000)
    setIsSpeaking(true)
    try {
      const res = await fetch(`${API_URL}/career-ai/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ text: clean, lang: isAr ? 'ar' : 'en', gender: voiceGender }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (body?.message === 'TTS_UNSUPPORTED') {
          // Gemini audio modality not available for this model/region — use browser TTS
          setTtsAvailable(false)
          speakViaBrowser(textToSpeak)
          return
        }
        throw new Error(body.message || 'TTS failed')
      }
      const data = await res.json()
      const { audioData, mimeType } = data.data

      // Decode base64 → ArrayBuffer → play via AudioContext
      const binary = atob(audioData)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext()
      }
      const ctx = audioContextRef.current
      const buffer = await ctx.decodeAudioData(bytes.buffer)
      stopAudio()
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.onended = () => setIsSpeaking(false)
      source.start(0)
      audioSourceRef.current = source
      setTtsAvailable(true)
    } catch (err: any) {
      setIsSpeaking(false)
      // If Gemini TTS fails, silently fall back to browser TTS
      if (ttsAvailable !== false) {
        speakViaBrowser(textToSpeak)
      }
    }
  }, [sessionId, isAr, voiceGender, ttsAvailable])

  // Browser TTS fallback — male Arabic voice only; skips if no male voice is available.
  const speakViaBrowser = useCallback((textToSpeak: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const maleVoice = findMaleArabicVoice()
    if (!maleVoice) {
      console.warn('[TTS] browser fallback: no male Arabic voice available, skipping')
      setIsSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(textToSpeak.replace(/[*_`#>]/g, ''))
    utter.lang = isAr ? 'ar-SA' : 'en-US'
    utter.voice = maleVoice
    utter.rate = 0.9
    utter.onstart = () => setIsSpeaking(true)
    utter.onend = () => setIsSpeaking(false)
    utter.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utter)
  }, [isAr])

  const speakText = useCallback((textToSpeak: string) => {
    // Always try Gemini TTS first (backend proxy, never exposes API key)
    // ttsAvailable === false means we already confirmed it's not available → go straight to browser
    if (ttsAvailable === false) {
      speakViaBrowser(textToSpeak)
    } else {
      speakViaGemini(textToSpeak)
    }
  }, [ttsAvailable, speakViaBrowser, speakViaGemini])

  const stopAudio = useCallback(() => {
    audioSourceRef.current?.stop()
    audioSourceRef.current = null
    window?.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])
  // ────────────────────────────────────────────────────────────────────────────

  const sendMessage = async () => {
    if (!input.trim() || isLoading || submittingRef.current || !sessionId) return
    submittingRef.current = true

    const userMsg: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setError(null)
    if (isSpeaking) stopAudio()

    const tempId = `temp-${Date.now()}`
    setMessages((prev) => [...prev, { id: tempId, role: 'assistant', content: '' }])

    try {
      const res = await fetch(`${API_URL}/career-ai/session/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ message: userMsg.content }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || 'خطأ في إرسال الرسالة')
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n').filter((l) => l.startsWith('data: '))) {
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') break
          try {
            const parsed = JSON.parse(raw)
            if (parsed.content) {
              fullContent += parsed.content
              setMessages((prev) => prev.map((m) => m.id === tempId ? { ...m, content: fullContent } : m))
            }
            if (parsed.error) throw new Error(parsed.error)
          } catch {}
        }
      }

      if (voiceEnabled && fullContent) speakText(fullContent)
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setError(err.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.')
    } finally {
      setIsLoading(false)
      submittingRef.current = false
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const generateReport = async () => {
    if (!sessionId || isGeneratingReport || mode !== 'interview') return
    setIsGeneratingReport(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/career-ai/session/${sessionId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || 'فشل إنشاء التقرير')
      }
      const data = await res.json()
      setReport(data.data.report)
      onReportReady?.(data.data.report)
    } catch (err: any) {
      setError(err.message || 'تعذر إنشاء التقرير الآن')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const startVoiceInput = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setError(isAr ? 'التعرف على الصوت غير مدعوم في متصفحك' : 'Speech recognition not supported')
      return
    }
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return }
    const recognition = new SR()
    recognition.lang = isAr ? 'ar-SA' : 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onstart = () => setIsRecording(true)
    recognition.onresult = (e: any) => setInput((prev) => prev + (prev ? ' ' : '') + e.results[0][0].transcript)
    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => setIsRecording(false)
    recognitionRef.current = recognition
    recognition.start()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const stageLabels: Record<string, { ar: string; en: string }> = {
    ORIENTATION: { ar: 'التعرف', en: 'Introduction' },
    INTEREST_EXPLORATION: { ar: 'الاهتمامات', en: 'Interests' },
    SKILL_EVIDENCE: { ar: 'المهارات', en: 'Skills' },
    PATH_DIFFERENTIATION: { ar: 'المسارات', en: 'Paths' },
    RECOMMENDATION: { ar: 'التوصية', en: 'Recommendation' },
  }
  const stages = Object.keys(stageLabels)
  const currentStageIdx = stages.indexOf(stage)

  if (report && mode === 'interview') {
    return (
      <div style={{ padding: '0 4px', direction: isAr ? 'rtl' : 'ltr' }}>
        <CareerReportView
          report={report} isDark={isDark} isAr={isAr}
          onRestart={() => { setReport(null); setMessages([]); setSessionId(null); startSession() }}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: mode === 'interview' ? '75vh' : '65vh', minHeight: 400, direction: isAr ? 'rtl' : 'ltr' }}>
      {/* Stage progress — interview mode only */}
      {mode === 'interview' && (
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${border}`, background: cardBg }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {stages.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: i <= currentStageIdx ? '#5120c8' : (isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'), transition: 'background 0.3s' }} />
                {i < stages.length - 1 && <div style={{ width: 4 }} />}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ color: subtext, fontSize: 11 }}>{isAr ? stageLabels[stage]?.ar : stageLabels[stage]?.en}</span>
            <span style={{ color: subtext, fontSize: 11 }}>{messages.filter((m) => m.role === 'user').length} {isAr ? 'رسائل' : 'messages'}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading && messages.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: subtext, fontSize: 14 }}>
            <div style={{ width: 20, height: 20, border: '2px solid #5120c8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }`}</style>
            {isAr ? 'جاري التحضير...' : 'Preparing...'}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={msg.id || i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? (isAr ? 'flex-start' : 'flex-end') : (isAr ? 'flex-end' : 'flex-start') }}>
            <div style={{
              maxWidth: '82%', padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? '#5120c8' : (isDark ? 'rgba(255,255,255,0.06)' : '#f4f4f8'),
              color: msg.role === 'user' ? '#fff' : text,
              fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {msg.content || (isLoading && i === messages.length - 1 && (
                <span style={{ display: 'inline-flex', gap: 4 }}>
                  {[0, 0.2, 0.4].map((delay) => (
                    <span key={delay} style={{ animation: `blink 1s infinite ${delay}s` }}>●</span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        ))}
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13 }}>
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Report button */}
      {hasEnoughForReport && !report && mode === 'interview' && (
        <div style={{ padding: '8px 16px', background: isDark ? 'rgba(81,32,200,0.08)' : 'rgba(81,32,200,0.04)', borderTop: '1px solid rgba(81,32,200,0.15)' }}>
          <button
            onClick={generateReport}
            disabled={isGeneratingReport}
            style={{ width: '100%', padding: '10px', borderRadius: 10, cursor: 'pointer', background: '#5120c8', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isGeneratingReport ? 0.7 : 1 }}>
            {isGeneratingReport ? (
              <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />{isAr ? 'جاري إنشاء التقرير...' : 'Generating report...'}</>
            ) : (
              <><FileText size={14} />{isAr ? 'احصل على تقريرك المهني' : 'Get Your Career Report'}</>
            )}
          </button>
        </div>
      )}

      {/* Input row */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${border}`, background: cardBg }}>
        {/* Voice controls row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setVoiceEnabled((v) => !v)}
            title={isAr ? 'تفعيل الصوت (Gemini TTS)' : 'Enable voice (Gemini TTS)'}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, border: `1px solid ${voiceEnabled ? '#5120c8' : border}`, background: voiceEnabled ? 'rgba(81,32,200,0.08)' : 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: voiceEnabled ? '#5120c8' : subtext }}>
            {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            {isAr ? (voiceEnabled ? 'الصوت مفعّل' : 'تفعيل الصوت') : (voiceEnabled ? 'Voice on' : 'Voice off')}
          </button>
          {voiceEnabled && (
            <>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 8, border: `1px solid #5120c8`, background: 'rgba(81,32,200,0.08)', fontSize: 11, fontWeight: 600, color: '#5120c8' }}>
                <UserRound size={11} />{isAr ? 'رشيد · ذكر' : 'Rasheed · Male'}
              </span>
              {ttsAvailable === false && (
                <span style={{ fontSize: 10, color: '#f59e0b' }}>
                  {isAr ? '(صوت المتصفح — Gemini TTS غير متاح)' : '(Browser TTS — Gemini TTS unavailable)'}
                </span>
              )}
              {isSpeaking && (
                <button onClick={stopAudio} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#ef4444' }}>
                  <StopCircle size={11} />{isAr ? 'إيقاف' : 'Stop'}
                </button>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAr ? 'اكتب ردك هنا...' : 'Type your response...'}
            disabled={isLoading || !sessionId}
            rows={1}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: text, fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', maxHeight: 100, overflowY: 'auto', direction: isAr ? 'rtl' : 'ltr' }}
          />
          <button
            onClick={startVoiceInput}
            title={isAr ? 'إدخال صوتي' : 'Voice input'}
            style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, border: `1.5px solid ${isRecording ? '#ef4444' : border}`, background: isRecording ? 'rgba(239,68,68,0.1)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isRecording ? '#ef4444' : subtext }}>
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !sessionId}
            style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: input.trim() && !isLoading ? '#5120c8' : (isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0'), border: 'none', cursor: input.trim() && !isLoading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: input.trim() && !isLoading ? '#fff' : subtext, transition: 'all 0.15s' }}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function CareerReportView({ report, isDark, isAr, onRestart }: { report: any; isDark: boolean; isAr: boolean; onRestart: () => void }) {
  const text = isDark ? '#f1f5f9' : '#0d0d0d'
  const subtext = isDark ? '#94a3b8' : '#6b7280'
  const cardBg = isDark ? '#111111' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'

  return (
    <div style={{ direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ padding: '16px 20px', borderRadius: 14, background: isDark ? 'rgba(81,32,200,0.08)' : 'rgba(81,32,200,0.04)', border: '1px solid rgba(81,32,200,0.2)', marginBottom: 20 }}>
        <p style={{ color: text, fontSize: 15, lineHeight: 1.7, margin: 0 }}>{report.summary}</p>
      </div>
      {report.primaryPath && (
        <div style={{ padding: '18px', borderRadius: 14, background: cardBg, border: '1.5px solid rgba(81,32,200,0.3)', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ color: subtext, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>{isAr ? 'المسار الأساسي المقترح' : 'PRIMARY RECOMMENDED PATH'}</div>
              <h3 style={{ color: text, fontSize: 18, fontWeight: 800, margin: 0 }}>{isAr ? report.primaryPath.titleAr : report.primaryPath.titleEn}</h3>
            </div>
            <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(81,32,200,0.1)', color: '#5120c8', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{report.primaryPath.matchLevel}</span>
          </div>
          {report.primaryPath.reasons?.length > 0 && (
            <ul style={{ margin: '8px 0 0', padding: isAr ? '0 18px 0 0' : '0 0 0 18px' }}>
              {report.primaryPath.reasons.map((r: string, i: number) => (
                <li key={i} style={{ color: subtext, fontSize: 13, lineHeight: 1.6 }}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {report.alternativePaths?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: text, fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{isAr ? 'مسارات بديلة' : 'Alternative Paths'}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {report.alternativePaths.map((p: any, i: number) => (
              <div key={i} style={{ padding: '12px 16px', borderRadius: 12, border: `1px solid ${border}`, background: cardBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: text, fontSize: 14, fontWeight: 600 }}>{isAr ? p.titleAr : p.titleEn}</span>
                <span style={{ color: '#5120c8', fontSize: 12 }}>{p.matchLevel}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {report.skillGaps?.length > 0 && (
        <div style={{ padding: '14px 16px', borderRadius: 12, border: `1px solid ${border}`, background: cardBg, marginBottom: 16 }}>
          <h4 style={{ color: text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{isAr ? 'مهارات يجب تطويرها' : 'Skills to Develop'}</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {report.skillGaps.map((s: string, i: number) => (
              <span key={i} style={{ padding: '3px 10px', borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.06)' : '#f4f4f8', border: `1px solid ${border}`, color: subtext, fontSize: 12 }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {report.immediateActions?.length > 0 && (
        <div style={{ padding: '14px 16px', borderRadius: 12, background: isDark ? 'rgba(22,163,74,0.06)' : 'rgba(22,163,74,0.03)', border: '1px solid rgba(22,163,74,0.2)', marginBottom: 16 }}>
          <h4 style={{ color: text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{isAr ? 'الخطوات التالية' : 'Immediate Next Steps'}</h4>
          <ol style={{ margin: 0, padding: isAr ? '0 18px 0 0' : '0 0 0 18px' }}>
            {report.immediateActions.map((a: string, i: number) => (
              <li key={i} style={{ color: subtext, fontSize: 13, lineHeight: 1.7 }}>{a}</li>
            ))}
          </ol>
        </div>
      )}
      {report.disclaimer && (
        <p style={{ color: isDark ? 'rgba(255,255,255,0.25)' : '#9ca3af', fontSize: 11, marginTop: 12, lineHeight: 1.6 }}>{report.disclaimer}</p>
      )}
      <button onClick={onRestart} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, cursor: 'pointer', background: 'transparent', border: `1px solid ${border}`, color: subtext, fontSize: 13, fontWeight: 600, marginTop: 16 }}>
        <RefreshCw size={13} />
        {isAr ? 'مقابلة جديدة' : 'New Interview'}
      </button>
    </div>
  )
}
