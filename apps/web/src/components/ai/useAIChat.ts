'use client'
import { useState, useCallback, useRef, useEffect } from 'react'

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

interface SpeechRec {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((e: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
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

// How long to wait for Gemini before committing to browser fallback.
// Gemini quota-429 returns in <1s; a healthy response in ~2-5s; 8s is a safe ceiling.
const GEMINI_TIMEOUT_MS = 8000

export function useAIChat() {
  const [messages,     setMessages]     = useState<Message[]>([])
  const [isLoading,    setIsLoading]    = useState(false)
  const [isListening,  setIsListening]  = useState(false)
  const [isSpeaking,   setIsSpeaking]   = useState(false)
  const [careerResult, setCareerResult] = useState<CareerResult | null>(null)
  const [voiceGender,  setVoiceGender]  = useState<'female' | 'male'>('female')

  const recognitionRef = useRef<SpeechRec | null>(null)
  const messagesRef    = useRef<Message[]>([])
  const audioRef       = useRef<HTMLAudioElement | null>(null)
  // Monotonic request counter — every async continuation checks this before acting.
  const ttsIdRef       = useRef(0)
  // AbortController for the in-flight Gemini fetch, if any.
  const ttsAbortRef    = useRef<AbortController | null>(null)

  /* ── Unmount cleanup ─────────────────────────────────────── */
  useEffect(() => {
    return () => {
      ++ttsIdRef.current                          // invalidate any active request
      if (typeof window !== 'undefined') {
        try { window.speechSynthesis.cancel() } catch { /* ignore */ }
      }
      if (audioRef.current) {
        try { audioRef.current.pause() } catch { /* ignore */ }
        audioRef.current = null
      }
      if (ttsAbortRef.current) {
        try { ttsAbortRef.current.abort() } catch { /* ignore */ }
        ttsAbortRef.current = null
      }
    }
  }, [])

  /* ── Browser TTS — fallback only ────────────────────────── */
  // isActive() must return true for the iterator to continue speaking.
  // When a new speak() fires, isActive() becomes false and the old iterator stops silently.
  const browserTTS = useCallback((text: string, isActive: () => boolean) => {
    if (typeof window === 'undefined') return
    const synth = window.speechSynthesis
    try { synth.cancel() } catch { /* ignore */ }

    const sentences = text
      .split(/(?<=[.!?،؛\n])\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 1)

    if (!sentences.length) {
      if (isActive()) setIsSpeaking(false)
      return
    }

    const doSpeak = (voices: SpeechSynthesisVoice[]) => {
      const arabicVoices = voices.filter(v =>
        v.lang.startsWith('ar') || v.lang.toLowerCase().includes('ar')
      )
      const bestVoice = arabicVoices[0] ?? null
      let index = 0

      const next = () => {
        // Guard: stop iterating if this request was superseded or stopped
        if (!isActive()) return
        if (index >= sentences.length) { setIsSpeaking(false); return }
        const u    = new SpeechSynthesisUtterance(sentences[index])
        u.lang     = 'ar-EG'
        u.rate     = 0.80
        u.volume   = 1.0
        if (bestVoice) {
          u.voice = bestVoice
          u.pitch = voiceGender === 'female' ? 1.0 : 0.6
        } else {
          u.pitch = voiceGender === 'female' ? 1.1 : 0.7
        }
        u.onend  = () => { index++; next() }
        u.onerror = () => { index++; next() }
        synth.speak(u)
      }
      next()
    }

    const voices = synth.getVoices()
    if (voices.length > 0) {
      doSpeak(voices)
    } else {
      let done = false
      const handler = () => { if (!done) { done = true; doSpeak(synth.getVoices()) } }
      synth.addEventListener('voiceschanged', handler, { once: true })
      setTimeout(() => {
        if (!done) { done = true; synth.removeEventListener('voiceschanged', handler); doSpeak([]) }
      }, 3000)
    }
  }, [voiceGender])

  /* ── speak — sequential: Gemini first, browser fallback on failure/timeout ── */
  //
  // Invariant: for any single speak() call, at most one engine produces audio.
  //
  // State machine (per request):
  //   requesting_gemini  →  playing_gemini     (Gemini success within timeout)
  //   requesting_gemini  →  playing_browser    (Gemini error OR timeout)
  //   playing_*          →  stopped            (stopSpeaking / new speak / unmount)
  //
  // The `committed` flag locks in whichever engine starts first.
  // A late Gemini response arriving after `committed=true` is discarded.
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return

    // ── Cancel all current playback ──
    try { window.speechSynthesis.cancel() } catch { /* ignore */ }
    if (audioRef.current) {
      try { audioRef.current.pause() } catch { /* ignore */ }
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (ttsAbortRef.current) {
      try { ttsAbortRef.current.abort() } catch { /* ignore */ }
      ttsAbortRef.current = null
    }

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
    setIsSpeaking(true)

    const reqId    = ++ttsIdRef.current
    const isActive = () => ttsIdRef.current === reqId

    const controller = new AbortController()
    ttsAbortRef.current = controller

    // Once true, the winning engine is locked; the other must not start.
    let committed = false

    const startFallback = () => {
      if (committed || !isActive()) return
      committed = true
      ttsAbortRef.current = null
      browserTTS(cleanText, isActive)
    }

    // Timeout: if Gemini hasn't responded, commit to browser fallback
    const timeoutId = setTimeout(() => {
      if (!isActive()) return
      try { controller.abort() } catch { /* ignore */ }
      startFallback()
    }, GEMINI_TIMEOUT_MS)

    // ── Gemini TTS request ──
    fetch('/api/ai/tts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text: cleanText, gender: voiceGender }),
      signal:  controller.signal,
    })
      .then(async (res) => {
        clearTimeout(timeoutId)

        // Stale request (new speak() was called)
        if (!isActive()) return

        // Timeout already committed to browser fallback — discard this late response
        if (committed) return

        if (!res.ok) { startFallback(); return }

        const ct = res.headers.get('Content-Type') ?? ''
        if (!ct.startsWith('audio/')) { startFallback(); return }

        const blob = await res.blob()

        // Re-check after async blob decode
        if (!isActive() || committed) return

        if (blob.size < 500) { startFallback(); return }

        // ── Gemini audio is valid — lock it in ──
        committed = true
        ttsAbortRef.current = null

        const url   = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio

        audio.onended = () => {
          if (isActive()) setIsSpeaking(false)
          audioRef.current = null
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        }
        audio.onerror = () => {
          if (isActive()) setIsSpeaking(false)
          audioRef.current = null
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        }
        audio.play().catch(() => {
          // Autoplay blocked — unlock and fall back to browser TTS
          audioRef.current = null
          URL.revokeObjectURL(url)
          committed = false
          startFallback()
        })
      })
      .catch(() => {
        clearTimeout(timeoutId)
        if (!isActive()) return
        // AbortError from timeout or network error — start fallback if not already committed
        startFallback()
      })
  }, [voiceGender, browserTTS])

  /* ── Stop speaking ───────────────────────────────────────── */
  const stopSpeaking = useCallback(() => {
    // Invalidate the active request so browser TTS iterators stop on next tick
    ++ttsIdRef.current
    if (typeof window !== 'undefined') {
      try { window.speechSynthesis.cancel() } catch { /* ignore */ }
    }
    if (audioRef.current) {
      try { audioRef.current.pause(); audioRef.current.src = '' } catch { /* ignore */ }
      audioRef.current = null
    }
    if (ttsAbortRef.current) {
      try { ttsAbortRef.current.abort() } catch { /* ignore */ }
      ttsAbortRef.current = null
    }
    setIsSpeaking(false)
  }, [])

  /* ── STT ─────────────────────────────────────────────────── */
  const startListening = useCallback((onResult: (text: string) => void) => {
    if (typeof window === 'undefined') return
    const w  = window as unknown as WinSpeech
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!SR) { alert('متصفحك لا يدعم التعرف على الصوت. جرب Chrome.'); return }

    const rec          = new SR()
    rec.lang           = 'ar-SA'
    rec.continuous     = false
    rec.interimResults = false
    rec.onstart        = () => setIsListening(true)
    rec.onresult       = e => { onResult(e.results[0][0].transcript); rec.stop() }
    rec.onend          = () => setIsListening(false)
    rec.onerror        = () => setIsListening(false)
    recognitionRef.current = rec
    rec.start()
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  /* ── Parse career result ─────────────────────────────────── */
  const extractCareerResult = useCallback((text: string): CareerResult | null => {
    const m = text.match(/\[CAREER_RESULT\]([\s\S]*?)\[\/CAREER_RESULT\]/)
    if (!m) return null
    try { return JSON.parse(m[1].trim()) as CareerResult } catch { return null }
  }, [])

  /* ── Send message ────────────────────────────────────────── */
  const sendMessage = useCallback(async (content: string, autoSpeak = true) => {
    if (!content.trim() || isLoading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() }
    const newMessages = [...messagesRef.current, userMsg]
    messagesRef.current = newMessages
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      })

      // Read body before checking ok — server sends Arabic content in error responses too
      let data: { content?: string } = {}
      try { data = await res.json() as { content?: string } } catch { /* non-JSON */ }

      if (!res.ok) {
        const errContent = data.content ?? clientErrorMsg(res.status)
        const errMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: errContent, timestamp: new Date() }
        const withErr = [...messagesRef.current, errMsg]
        messagesRef.current = withErr
        setMessages(withErr)
        return
      }

      const aiContent = data.content ?? 'عذراً، لم أتمكن من الرد.'
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiContent, timestamp: new Date() }
      const withAi = [...messagesRef.current, aiMsg]
      messagesRef.current = withAi
      setMessages(withAi)

      const result = extractCareerResult(aiContent)
      if (result) setCareerResult(result)
      if (autoSpeak) void speak(aiContent)
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
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, extractCareerResult, speak])

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
    messages, isLoading, isListening, isSpeaking,
    careerResult, voiceGender, setVoiceGender,
    sendMessage, speak, stopSpeaking,
    startListening, stopListening, clearChat,
    addAssistantMessage,
  }
}
