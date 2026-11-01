'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useStreamingTTS } from './tts-v2/useStreamingTTS'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface CareerResult {
  primaryPath: string
  matchScore: number
  secondaryPaths: string[]
  strengths: string[]
  nextSteps: string[]
  recommendedCourses: string[]
  timeline: string
  summary?: string
}

interface SpeechResult {
  readonly isFinal: boolean
  readonly [i: number]: { transcript: string }
}

interface SpeechRec {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((e: { resultIndex: number; results: { length: number; [i: number]: SpeechResult } }) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error?: string }) => void) | null
  start(): void
  stop(): void
}
type SpeechRecCtor = new () => SpeechRec

interface WinSpeech {
  SpeechRecognition?: SpeechRecCtor
  webkitSpeechRecognition?: SpeechRecCtor
}

function clientErrorMsg(status: number): string {
  if (status === 429) return 'تم استنفاد حصة الذكاء الاصطناعي اليومية. حاول غداً.'
  if (status === 500) return 'خدمة الذكاء الاصطناعي غير متاحة حالياً. حاول بعد قليل.'
  if (status === 502) return 'خدمة الذكاء الاصطناعي مشغولة. حاول مجدداً.'
  if (status === 400) return 'حدث خطأ في البيانات المرسلة. حاول مجدداً.'
  return 'عذراً، حدث خطأ غير متوقع. يرجى المحاولة مجدداً.'
}

export type MicState = 'idle' | 'listening' | 'processing'

// Silence duration before auto-submitting accumulated speech (ms).
// 2.5 s covers natural thinking pauses in Egyptian Arabic while remaining responsive.
const SILENCE_TIMEOUT_MS = 2500

export function useAIChat() {
  const [messages,     setMessages]     = useState<Message[]>([])
  const [isLoading,    setIsLoading]    = useState(false)
  const [isListening,  setIsListening]  = useState(false)
  const [micState,     setMicState]     = useState<MicState>('idle')
  const [careerResult, setCareerResult] = useState<CareerResult | null>(null)
  const [voiceGender,  setVoiceGender]  = useState<'female' | 'male'>('female')

  const recognitionRef = useRef<SpeechRec | null>(null)
  const messagesRef    = useRef<Message[]>([])
  const isLoadingRef   = useRef(false)

  // Per-session counter: incremented on every startListening call.
  // Each session closure captures its own snapshot; stale onend/onresult bail via isMySession().
  const sttSessionRef   = useRef(0)
  // Hook-level silence timer — accessible from unmount cleanup.
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Explicit-stop flag: set by submit() and stopListening() so onend won't restart.
  // Reset to false at the start of every new startListening call.
  const stopRequestedRef = useRef(false)

  // Streaming TTS — Web Audio API, Gemini SSE, with browser speechSynthesis fallback
  const {
    isSpeaking,
    lastError:    ttsError,
    speak:        ttsSpeak,
    stopSpeaking: ttsStop,
    unlockAudio,
    audioUnlocked,
  } = useStreamingTTS()

  /* ── Unmount cleanup ─────────────────────────────────────── */
  useEffect(() => {
    const sessionRef = sttSessionRef
    const silenceRef = silenceTimerRef
    const recRef     = recognitionRef
    return () => {
      // Invalidate any running STT session so stale callbacks are no-ops.
      ++sessionRef.current
      if (silenceRef.current) { clearTimeout(silenceRef.current); silenceRef.current = null }
      try { recRef.current?.stop() } catch { /* ignore */ }
      if (typeof window !== 'undefined') {
        try { window.speechSynthesis.cancel() } catch { /* ignore */ }
      }
    }
  }, [])

  /* ── speak ───────────────────────────────────────────────── */
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return
    const cleanText = text
      .replace(/\[CAREER_RESULT\][\s\S]*?\[\/CAREER_RESULT\]/g, '')
      .replace(/\[QUIZ_Q\][\s\S]*?\[\/QUIZ_Q\]/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s+/g, '')
      .replace(/DeveWay/gi, 'ديفي واي')
      .replace(/\s+/g, ' ')
      .trim()
    if (!cleanText) return
    console.log(`[TTS] speak voice=${voiceGender} len=${cleanText.length}`)
    ttsSpeak(cleanText, voiceGender)
  }, [ttsSpeak, voiceGender])

  /* ── Stop speaking ───────────────────────────────────────── */
  const stopSpeaking = useCallback(() => {
    ttsStop()
  }, [ttsStop])

  /* ── STT — continuous mode with silence-based end-of-speech ─
   *
   * Chrome fires onend after ~5–7 s on Arabic even with continuous=true.
   * Fix: restart recognition on unexpected onend (when user hasn't explicitly stopped)
   * and accumulate all final results across restarts in accText.
   * Submit only when silence timer fires (2.5 s after last speech activity).
   */
  const startListening = useCallback((onResult: (text: string) => void, onError?: (errCode: string) => void) => {
    if (typeof window === 'undefined') return
    const w  = window as unknown as WinSpeech
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) { alert('متصفحك لا يدعم التعرف على الصوت. جرب Chrome.'); return }

    // Reset explicit-stop flag before advancing the session counter.
    stopRequestedRef.current = false
    // Advance session counter — old session's callbacks see isMySession()=false and exit.
    ++sttSessionRef.current
    const mySessionId = sttSessionRef.current
    const isMySession = () => sttSessionRef.current === mySessionId

    // Stop previous recognizer. Its onend fires but isMySession() is false — no-op.
    try { recognitionRef.current?.stop() } catch { /* already stopped */ }

    // Clear any silence timer from a prior session.
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }

    let accText      = ''
    let restartCount = 0
    const MAX_RESTARTS = 20   // ~2–3 min at one Chrome reset per 7 s

    const submit = () => {
      if (!isMySession()) return
      const text = accText.trim()
      if (!text) return
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      accText = ''
      stopRequestedRef.current = true   // prevent restart when rec.stop() fires onend
      setMicState('processing')
      onResult(text)
      try { rec.stop() } catch { /* already stopped */ }
    }

    const rec          = new SR()
    rec.lang           = 'ar-EG'
    rec.continuous     = true    // keep session alive across natural pauses
    rec.interimResults = true    // receive partial results so we can reset the silence timer

    rec.onstart = () => { setIsListening(true); setMicState('listening') }

    rec.onresult = e => {
      if (!isMySession()) return
      let newFinal    = ''
      let hasActivity = false
      for (let i = e.resultIndex; i < e.results.length; i++) {
        hasActivity = true
        if (e.results[i].isFinal) newFinal += (e.results[i][0]?.transcript ?? '') + ' '
      }
      // Reset silence timer on ANY speech activity — interim OR final —
      // so we don't submit while the user is still actively speaking.
      if (hasActivity) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = setTimeout(submit, SILENCE_TIMEOUT_MS)
      }
      if (!newFinal.trim()) return
      accText = (accText + ' ' + newFinal).trim()
    }

    // Chrome fires onend after ~5–7 s on Arabic even with continuous=true.
    // Restart so the user can speak continuously for several minutes.
    rec.onend = () => {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      if (!isMySession()) return
      if (!stopRequestedRef.current && restartCount < MAX_RESTARTS) {
        restartCount++
        try { rec.start(); return } catch { /* restart failed — fall through */ }
      }
      setIsListening(false)
      setMicState(s => s === 'listening' ? 'idle' : s)
      if (accText.trim()) {
        const text = accText.trim()
        accText = ''
        setMicState('processing')
        onResult(text)
      }
    }

    rec.onerror = e => {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      if (!isMySession()) return
      // Permanent errors: do not restart after these.
      const isPermanent = ['not-allowed', 'audio-capture', 'service-not-allowed'].includes(e.error ?? '')
      if (isPermanent) stopRequestedRef.current = true
      setIsListening(false)
      setMicState('idle')
      if (onError) onError(e.error ?? 'unknown')
    }

    recognitionRef.current = rec
    try {
      rec.start()
    } catch (e) {
      setIsListening(false)
      setMicState('idle')
      if (onError) onError((e as Error)?.message?.includes('already started') ? 'already-started' : 'start-failed')
    }
  }, [])

  const stopListening = useCallback(() => {
    // Mark explicit stop so onend flushes accumulated text without restarting.
    stopRequestedRef.current = true
    recognitionRef.current?.stop()
    setIsListening(false)
    setMicState(s => s === 'listening' ? 'idle' : s)
  }, [])

  /* ── Parse career result ─────────────────────────────────── */
  const extractCareerResult = useCallback((text: string): CareerResult | null => {
    const m = text.match(/\[CAREER_RESULT\]([\s\S]*?)\[\/CAREER_RESULT\]/)
    if (!m) return null
    try { return JSON.parse(m[1].trim()) as CareerResult } catch { return null }
  }, [])

  /* ── Send message ────────────────────────────────────────── */
  const sendMessage = useCallback(async (content: string, autoSpeak = true): Promise<boolean> => {
    if (!content.trim() || isLoadingRef.current) return false

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() }
    const newMessages = [...messagesRef.current, userMsg]
    messagesRef.current = newMessages
    setMessages(newMessages)
    isLoadingRef.current = true
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      })

      // Read body before checking ok — server sends Arabic content in error responses too
      let data: { content?: string; isError?: boolean } = {}
      try { data = await res.json() as { content?: string; isError?: boolean } } catch { /* non-JSON */ }

      if (!res.ok) {
        const errContent = data.content ?? clientErrorMsg(res.status)
        const errMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: errContent, timestamp: new Date() }
        const withErr = [...messagesRef.current, errMsg]
        messagesRef.current = withErr
        setMessages(withErr)
        return false
      }

      const aiContent = data.content ?? 'عذراً، لم أتمكن من الرد.'
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiContent, timestamp: new Date() }
      const withAi = [...messagesRef.current, aiMsg]
      messagesRef.current = withAi
      setMessages(withAi)

      // isError: true means the server returned an apology — show it but don't speak it
      if (data.isError) return false

      const result = extractCareerResult(aiContent)
      if (result) setCareerResult(result)
      if (autoSpeak) void speak(aiContent)
      return true
    } catch (err) {
      console.error('sendMessage error:', err)
      const e = err as { message?: string }
      const isNetwork = typeof e?.message === 'string' && (
        e.message.toLowerCase().includes('fetch')   ||
        e.message.toLowerCase().includes('network') ||
        e.message.toLowerCase().includes('failed')
      )
      const errContent = isNetwork
        ? 'تحقق من اتصالك بالإنترنت وحاول مجدداً.'
        : 'عذراً، حدث خطأ غير متوقع. يرجى المحاولة مجدداً.'
      const errMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: errContent, timestamp: new Date() }
      const withErr = [...messagesRef.current, errMsg]
      messagesRef.current = withErr
      setMessages(withErr)
      return false
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
      setMicState('idle')
    }
  }, [extractCareerResult, speak])

  const addAssistantMessage = useCallback((content: string) => {
    const msg: Message = { id: Date.now().toString(), role: 'assistant', content, timestamp: new Date() }
    const next = [...messagesRef.current, msg]
    messagesRef.current = next
    setMessages(next)
  }, [])

  const clearChat = useCallback(() => {
    setMessages([])
    messagesRef.current = []
    setCareerResult(null)
    stopSpeaking()
    stopListening()
  }, [stopSpeaking, stopListening])

  return {
    messages, isLoading, isListening, micState, isSpeaking,
    careerResult, voiceGender, setVoiceGender,
    ttsError, audioUnlocked, unlockAudio,
    sendMessage, speak, stopSpeaking,
    startListening, stopListening, clearChat,
    addAssistantMessage,
  }
}
