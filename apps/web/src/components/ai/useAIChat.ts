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
  if (status === 401) return 'انتهت جلستك. يرجى تسجيل الدخول مجدداً.'
  if (status === 429) return 'تم استنفاد حصة الذكاء الاصطناعي اليومية. حاول غداً.'
  if (status === 500) return 'خدمة الذكاء الاصطناعي غير متاحة حالياً. حاول بعد قليل.'
  if (status === 502) return 'خدمة الذكاء الاصطناعي مشغولة. حاول مجدداً.'
  if (status === 400) return 'حدث خطأ في البيانات المرسلة. حاول مجدداً.'
  return 'عذراً، حدث خطأ غير متوقع. يرجى المحاولة مجدداً.'
}

export type MicState = 'idle' | 'listening' | 'processing'

// Silence duration before auto-submitting accumulated speech (ms).
// 2.5 s covers natural thinking pauses in Egyptian Arabic while remaining
// responsive; if the user consistently gets cut off, increase toward 3500.
const SILENCE_TIMEOUT_MS = 2500

export function useAIChat() {
  const [messages,     setMessages]     = useState<Message[]>([])
  const [isLoading,    setIsLoading]    = useState(false)
  const [isListening,  setIsListening]  = useState(false)
  const [micState,     setMicState]     = useState<MicState>('idle')
  const [careerResult, setCareerResult] = useState<CareerResult | null>(null)
  const [voiceGender,  setVoiceGender]  = useState<'female' | 'male'>('female')

  const recognitionRef  = useRef<SpeechRec | null>(null)
  const messagesRef     = useRef<Message[]>([])
  const isLoadingRef    = useRef(false)
  // Per-session counter: incremented on every startListening call.
  // Each session closure captures its own snapshot; stale onend / onresult handlers
  // bail out via isMySession() — prevents stale sessions from submitting after a
  // new session starts (the old submittedRef race condition).
  const sttSessionRef   = useRef(0)
  // Hook-level silence timer ref — accessible from unmount cleanup and from
  // startListening across re-renders (the local closure variable was unreachable
  // from the unmount effect, causing a timer leak on fast unmounts).
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // TTS dedup: track the last message ID spoken per gender to avoid re-speaking
  const lastSpokenRef   = useRef<{ msgId: string; gender: string } | null>(null)

  // Streaming TTS — Web Audio API, Gemini SSE, no browser speech synthesis fallback
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
    // Capture refs at effect registration time to satisfy react-hooks/exhaustive-deps.
    // These are stable mutable objects — copying the ref object, not .current.
    const sessionRef  = sttSessionRef
    const silenceRef  = silenceTimerRef
    const recRef      = recognitionRef
    return () => {
      // Invalidate any running STT session so stale onend/onresult handlers no-op.
      ++sessionRef.current
      // Clear the hook-level silence timer (the closure variable inside
      // startListening was unreachable from here — that was the leak).
      if (silenceRef.current) {
        clearTimeout(silenceRef.current)
        silenceRef.current = null
      }
      // Stop recognition; this triggers rec.onend but isMySession() returns false
      // so the handler exits immediately without touching state.
      try { recRef.current?.stop() } catch { /* ignore */ }
      if (typeof window !== 'undefined') {
        try { window.speechSynthesis.cancel() } catch { /* ignore */ }
      }
    }
  }, [])

  /* ── speak ───────────────────────────────────────────────── */
  const speak = useCallback((text: string, msgId?: string) => {
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
    // Dedup: skip if this exact message+voice was already started this session
    if (msgId) {
      if (lastSpokenRef.current?.msgId === msgId && lastSpokenRef.current?.gender === voiceGender) {
        console.log(`[TTS] dedup skip msgId=${msgId}`)
        return
      }
      lastSpokenRef.current = { msgId, gender: voiceGender }
    }
    console.log(`[TTS] speak voice=${voiceGender} len=${cleanText.length}${msgId ? ` msgId=${msgId}` : ''}`)
    ttsSpeak(cleanText, voiceGender)
  }, [ttsSpeak, voiceGender])

  /* ── Stop speaking ───────────────────────────────────────── */
  const stopSpeaking = useCallback(() => {
    ttsStop()
  }, [ttsStop])

  /* ── STT — continuous mode with silence-based end-of-speech ─ */
  //
  // Design:
  //   - continuous=true / interimResults=true keeps the session alive across
  //     natural thinking pauses (prevents premature 5-second cutoff).
  //   - Final results accumulate in a closure variable (accText).
  //   - silenceTimerRef (hook-level) resets on every new final result.
  //     When the timer fires (silence detected) the accumulated text is submitted.
  //   - rec.onend is a safety net: flushes any pending text if the browser stops
  //     recognition for any reason (network timeout, max-duration, manual stop).
  //   - Per-session token (sttSessionRef): each call increments the counter and
  //     captures its snapshot. All async callbacks bail out via isMySession() if a
  //     newer session has started — prevents the stale-session race condition where
  //     an old rec.onend steals the submission slot after the counter was reset.
  const startListening = useCallback((onResult: (text: string) => void, onError?: (errCode: string) => void) => {
    if (typeof window === 'undefined') return
    const w  = window as unknown as WinSpeech
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) { alert('متصفحك لا يدعم التعرف على الصوت. جرب Chrome.'); return }

    // Advance the session counter and capture this session's token.
    // This happens BEFORE stopping the old rec — so old rec's onend sees isMySession()=false
    // and exits immediately without submitting or touching state.
    ++sttSessionRef.current
    const mySessionId  = sttSessionRef.current
    const isMySession  = () => sttSessionRef.current === mySessionId

    // Stop any currently running recognition instance. The old rec's onend will fire
    // but isMySession() returns false at that point so it is a no-op.
    try { recognitionRef.current?.stop() } catch { /* already stopped */ }

    // Clear any silence timer still running from a prior session.
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }

    let accText = ''

    const submit = () => {
      if (!isMySession()) return
      const text = accText.trim()
      if (!text) return
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      accText = ''
      setMicState('processing')
      onResult(text)
      try { rec.stop() } catch { /* already stopped */ }
    }

    const rec          = new SR()
    rec.lang           = 'ar-EG'
    rec.continuous     = true    // keep session alive across thinking pauses
    rec.interimResults = true    // receive partial results (we only act on finals)
    rec.onstart        = () => { setIsListening(true); setMicState('listening') }

    rec.onresult = e => {
      if (!isMySession()) return
      let newFinal = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) newFinal += (e.results[i][0]?.transcript ?? '') + ' '
      }
      if (!newFinal.trim()) return
      accText = (accText + ' ' + newFinal).trim()
      // Reset silence timer on every new confirmed word
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(submit, SILENCE_TIMEOUT_MS)
    }

    // Safety net: flush any pending text if the browser stops recognition for any reason.
    // isMySession() guards against a stale session's onend firing after a new session started.
    rec.onend = () => {
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null }
      if (!isMySession()) return
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
    // Stopping the recognition triggers rec.onend, which flushes accumulated text.
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
  // userName is no longer a parameter — it is derived server-side from the verified JWT.
  // memoryContext is still accepted from the client (authenticated user passing their own
  // career context only affects their own session; the server validates the JWT first).
  const sendMessage = useCallback(async (content: string, autoSpeak = true, memoryContext?: string): Promise<boolean> => {
    if (!content.trim() || isLoadingRef.current) return false

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() }
    const newMessages = [...messagesRef.current, userMsg]
    messagesRef.current = newMessages
    setMessages(newMessages)
    isLoadingRef.current = true
    setIsLoading(true)

    try {
      const body: Record<string, unknown> = { messages: newMessages.map(m => ({ role: m.role, content: m.content })) }
      if (memoryContext) body.memoryContext = memoryContext
      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
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
      if (autoSpeak) void speak(aiContent, aiMsg.id)
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
