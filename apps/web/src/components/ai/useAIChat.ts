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

export function useAIChat() {
  const [messages,     setMessages]     = useState<Message[]>([])
  const [isLoading,    setIsLoading]    = useState(false)
  const [isListening,  setIsListening]  = useState(false)
  const [isSpeaking,   setIsSpeaking]   = useState(false)
  const [careerResult, setCareerResult] = useState<CareerResult | null>(null)
  const [voiceGender,  setVoiceGender]  = useState<'female' | 'male'>('female')

  const recognitionRef      = useRef<SpeechRec | null>(null)
  const messagesRef         = useRef<Message[]>([])
  const audioRef            = useRef<HTMLAudioElement | null>(null)
  const browserTTSCancelRef = useRef<(() => void) | null>(null)

  /* ── Unmount cleanup ─────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') window.speechSynthesis.cancel()
      const audio = audioRef.current
      if (audio) { audio.onended = null; audio.onerror = null; audio.pause(); audio.src = ''; audioRef.current = null }
    }
  }, [])

  /* ── Browser TTS — fallback only ────────────────────────── */
  const browserTTS = useCallback((text: string): (() => void) => {
    if (typeof window === 'undefined') return () => { /* noop */ }
    const synth = window.speechSynthesis

    const sentences = text
      .split(/[.!?،؛\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 1)

    if (!sentences.length) {
      setIsSpeaking(false)
      return () => { /* noop */ }
    }

    let index     = 0
    let cancelled = false

    const speakNext = () => {
      if (cancelled || index >= sentences.length) {
        if (!cancelled) setIsSpeaking(false)
        return
      }

      const u  = new SpeechSynthesisUtterance(sentences[index])
      u.lang   = 'ar-SA'
      u.rate   = 0.85
      u.pitch  = voiceGender === 'female' ? 1.05 : 0.9
      u.volume = 1.0

      const arabicVoices = synth.getVoices().filter(v => v.lang.startsWith('ar'))
      console.log('[TTS] Available Arabic voices:', arabicVoices.map(v => `${v.name}/${v.lang}`))
      if (arabicVoices.length > 0) {
        const pref = voiceGender === 'female'
          ? ['Zariyah', 'Laila', 'Maha', 'Tamar', 'Zira', 'ar-SA', 'ar']
          : ['Hamed', 'Maged', 'Omar', 'Khalid', 'ar-SA', 'ar']
        let best: SpeechSynthesisVoice | null = null
        for (const n of pref) {
          best = arabicVoices.find(v => v.name.toLowerCase().includes(n.toLowerCase())) ?? null
          if (best) break
        }
        u.voice = best ?? arabicVoices[0]
      }

      u.onend  = () => { if (!cancelled) { index++; speakNext() } }
      u.onerror = () => { if (!cancelled) { index++; speakNext() } }
      synth.speak(u)
    }

    if (synth.getVoices().length === 0) {
      synth.addEventListener('voiceschanged', speakNext, { once: true })
    } else {
      speakNext()
    }

    return () => {
      cancelled = true
      synth.cancel()
    }
  }, [voiceGender])

  /* ── TTS — sequential: Gemini first, browser fallback ───── */
  const speak = useCallback(async (text: string) => {
    if (typeof window === 'undefined') return

    // Stop everything currently playing
    window.speechSynthesis.cancel()
    const prevCancel = browserTTSCancelRef.current
    if (prevCancel) { prevCancel(); browserTTSCancelRef.current = null }
    const prevAudio = audioRef.current
    if (prevAudio) { prevAudio.onended = null; prevAudio.onerror = null; prevAudio.pause(); prevAudio.src = ''; audioRef.current = null }

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

    // STEP 1: Try Gemini TTS — race against 4s timeout for instant fallback
    try {
      const ttsPromise = fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, gender: voiceGender }),
        signal: AbortSignal.timeout(9000),
      })

      // Race: TTS fetch vs 4s timeout
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
      const winner = await Promise.race([ttsPromise, timeoutPromise])

      if (winner === null) {
        // Gemini TTS too slow — use browser TTS immediately
        console.warn('[TTS] Gemini TTS timeout (4s), using browser TTS')
        const cancel = browserTTS(cleanText)
        browserTTSCancelRef.current = cancel
        ttsPromise.catch(() => {})
        return
      }

      if (winner.ok) {
        const contentType = winner.headers.get('Content-Type') || ''
        if (contentType.startsWith('audio/')) {
          const blob = await winner.blob()
          if (blob.size > 1000) {
            const url = URL.createObjectURL(blob)
            const audio = new Audio(url)
            audioRef.current = audio

            await new Promise<void>((resolve) => {
              audio.onended = () => {
                setIsSpeaking(false)
                audioRef.current = null
                setTimeout(() => URL.revokeObjectURL(url), 500)
                resolve()
              }
              audio.onerror = () => {
                setIsSpeaking(false)
                audioRef.current = null
                setTimeout(() => URL.revokeObjectURL(url), 500)
                resolve()
              }
              audio.play().catch(() => {
                setIsSpeaking(false)
                audioRef.current = null
                URL.revokeObjectURL(url)
                resolve()
              })
            })
            return  // SUCCESS — do NOT fall through to browser TTS
          }
        }
      }
      console.warn('[TTS] Gemini TTS failed, using browser TTS. Status:', winner.status)
    } catch (err: unknown) {
      const e = err as { message?: string }
      console.warn('[TTS] Gemini TTS error:', e?.message)
    }

    // STEP 2: Fallback — browser Web Speech API (only if Gemini failed/slow)
    const cancel = browserTTS(cleanText)
    browserTTSCancelRef.current = cancel
  }, [voiceGender, browserTTS])

  /* ── Stop speaking ───────────────────────────────────────── */
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()

    const cancelFn = browserTTSCancelRef.current
    if (cancelFn) { cancelFn(); browserTTSCancelRef.current = null }

    const audio = audioRef.current
    if (audio) { audio.onended = null; audio.onerror = null; audio.pause(); audio.src = ''; audioRef.current = null }

    setIsSpeaking(false)
  }, [])

  /* ── STT ─────────────────────────────────────────────────── */
  const startListening = useCallback((onResult: (text: string) => void) => {
    if (typeof window === 'undefined') return
    const w = window as unknown as WinSpeech
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
      if (autoSpeak) speak(aiContent)
    } catch (err) {
      console.error('sendMessage error:', err)
      const e = err as { message?: string }
      const isNetwork = typeof e?.message === 'string' && (e.message.toLowerCase().includes('fetch') || e.message.toLowerCase().includes('network') || e.message.toLowerCase().includes('failed'))
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
