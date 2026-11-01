'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { getToken } from '@/lib/auth'
import { useSentencePipeline as useStreamingTTS } from './tts-v2/useSentencePipeline'
import { createSttController } from './stt-controller'
import type { SttController, SttCommitReason } from './stt-controller'

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

/** Options for a single listening session. */
export interface ListenOptions {
  /**
   * true  → silence may commit the utterance (hands-free needs this).
   * false → only an explicit stopListening() submits (push-to-talk mode).
   * Defaults to true so callers that pass no options keep working.
   */
  autoSubmit?: boolean
  /** Override the silence window used before an automatic commit. */
  silenceMs?: number
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

export function useAIChat() {
  const [messages,     setMessages]     = useState<Message[]>([])
  const [isLoading,    setIsLoading]    = useState(false)
  const [isListening,  setIsListening]  = useState(false)
  const [micState,     setMicState]     = useState<MicState>('idle')
  const [careerResult, setCareerResult] = useState<CareerResult | null>(null)
  const [voiceGender,  setVoiceGender]  = useState<'female' | 'male'>('male')

  const messagesRef     = useRef<Message[]>([])
  const isLoadingRef    = useRef(false)
  // Owns the whole SpeechRecognition lifecycle (session restarts, silence
  // decision, stale-session isolation). Framework-free and unit-tested.
  const sttControllerRef = useRef<SttController | null>(null)
  // Text kept after a recognizer died without the user finishing — it is
  // re-seeded into the next session instead of being submitted or dropped.
  const carryOverRef     = useRef('')
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
    const controllerRef = sttControllerRef
    return () => {
      // Silent teardown: clears session timers and stops the recognizer
      // without submitting anything into a chat that is being unmounted.
      controllerRef.current?.cancel()
      controllerRef.current = null
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

  /* ── STT — utterance lifecycle owned by stt-controller ───── */
  //
  // Split of responsibilities:
  //   • stt-controller.ts decides when speech starts/ends, restarts the
  //     recognizer after an unexpected `onend`, merges finals across sessions,
  //     keeps interim text, and decides whether a silence may commit.
  //   • this hook only mirrors its state into React and forwards the result.
  //
  // `onend` never submits. Silence commits only when autoSubmit is enabled AND
  // the recognizer finalised the last phrase AND the text is not a fragment.
  // Manual push-to-talk callers pass `{ autoSubmit: false }` so the answer is
  // sent only when the user presses stop.
  const startListening = useCallback((
    onResult: (text: string) => void,
    onError?: (errCode: string) => void,
    options?: ListenOptions,
  ) => {
    if (typeof window === 'undefined') return
    const w  = window as unknown as WinSpeech
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) { alert('متصفحك لا يدعم التعرف على الصوت. جرب Chrome.'); return }

    // Retire the previous utterance (timers + recognizer) before starting a new
    // one. Its late callbacks are already detached by the controller.
    sttControllerRef.current?.cancel()
    sttControllerRef.current = null

    // Text kept from a session that died without the user finishing.
    const seed = carryOverRef.current
    carryOverRef.current = ''

    const controller = createSttController({
      recognizer: () => new SR(),
      lang: 'ar-EG',
      autoSubmit: options?.autoSubmit ?? true,
      silenceMs: options?.silenceMs,
      onStateChange: next => {
        setIsListening(next === 'listening')
        setMicState(next)
      },
      onCommit: (text: string, reason: SttCommitReason) => {
        console.log(`[STT] commit reason=${reason} chars=${text.length}`)
        setMicState('processing')
        onResult(text)
        // Safety net: if the consumer refuses the text (e.g. a request is still
        // loading) the mic must not stay stuck in 'processing' forever.
        setTimeout(() => {
          if (sttControllerRef.current !== controller) return
          setMicState(s => (s === 'processing' ? 'idle' : s))
        }, 1_200)
      },
      onError: code => { if (onError) onError(code) },
      onRestartExhausted: kept => {
        // Never submit here — the user did not finish. Keep the text so the
        // next session continues it instead of losing it.
        console.warn(`[STT] restart budget exhausted — kept ${kept.length} chars`)
        carryOverRef.current = kept
      },
    })

    sttControllerRef.current = controller
    controller.begin(seed)
  }, [])

  const stopListening = useCallback(() => {
    const controller = sttControllerRef.current
    if (!controller) {
      setIsListening(false)
      setMicState(s => (s === 'listening' ? 'idle' : s))
      return
    }
    // Explicit stop is the only thing that submits in manual mode.
    controller.stop()
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
      const chatToken = getToken()
      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(chatToken ? { Authorization: `Bearer ${chatToken}` } : {}),
        },
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
    // Silent teardown: nothing captured mid-utterance may be submitted into the
    // freshly cleared interview.
    sttControllerRef.current?.cancel()
    sttControllerRef.current = null
    carryOverRef.current = ''
    lastSpokenRef.current = null
    setMessages([])
    messagesRef.current = []
    setCareerResult(null)
    setIsListening(false)
    setMicState('idle')
    stopSpeaking()
  }, [stopSpeaking])

  return {
    messages, isLoading, isListening, micState, isSpeaking,
    careerResult, voiceGender, setVoiceGender,
    ttsError, audioUnlocked, unlockAudio,
    sendMessage, speak, stopSpeaking,
    startListening, stopListening, clearChat,
    addAssistantMessage,
  }
}
