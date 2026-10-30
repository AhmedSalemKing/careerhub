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

  const recognitionRef = useRef<SpeechRec | null>(null)
  const messagesRef    = useRef<Message[]>([])
  const audioRef       = useRef<HTMLAudioElement | null>(null)

  /* ── Unmount cleanup ─────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') window.speechSynthesis.cancel()
      const audio = audioRef.current
      if (audio) { audio.onended = null; audio.onerror = null; audio.pause(); audio.src = ''; audioRef.current = null }
    }
  }, [])

  /* ── Browser TTS — fallback only ────────────────────────── */
  const browserTTS = useCallback((text: string) => {
    if (typeof window === 'undefined') return
    const synth = window.speechSynthesis

    const sentences = text
      .split(/(?<=[.!?،؛])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 1)

    if (!sentences.length) { setIsSpeaking(false); return }

    let index = 0
    const speakNext = () => {
      if (index >= sentences.length) { setIsSpeaking(false); return }

      const u = new SpeechSynthesisUtterance(sentences[index])
      u.lang   = 'ar-EG'
      u.volume = 1.0

      if (voiceGender === 'female') {
        u.rate  = 0.85
        u.pitch = 1.05
      } else {
        u.rate  = 0.82
        u.pitch = 0.55
      }

      const arabicVoices = synth.getVoices().filter(v => v.lang.startsWith('ar') || v.lang.includes('AR'))
      if (arabicVoices.length > 0) {
        u.voice =
          arabicVoices.find(v => v.name.includes('Hoda')) ||
          arabicVoices.find(v => v.lang === 'ar-EG') ||
          arabicVoices[0]
      }

      u.onend  = () => { index++; speakNext() }
      u.onerror = () => { index++; speakNext() }
      synth.speak(u)
    }

    speakNext()
  }, [voiceGender])

  /* ── TTS — OpenAI first, browser fallback ───────────────── */
  const speak = useCallback(async (text: string) => {
    if (typeof window === 'undefined') return

    window.speechSynthesis.cancel()
    if (audioRef.current) {
      try { audioRef.current.pause(); audioRef.current.src = '' } catch { /* ignore */ }
      audioRef.current = null
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

    /* STEP 1 — Try OpenAI TTS */
    try {
      const res = await fetch('/api/ai/tts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: cleanText, gender: voiceGender }),
        signal:  AbortSignal.timeout(18000),
      })

      if (res.ok) {
        const contentType = res.headers.get('Content-Type') ?? ''
        if (contentType.startsWith('audio/')) {
          const blob = await res.blob()
          if (blob.size > 1000) {
            const url = URL.createObjectURL(blob)
            const audio = new Audio(url)
            audio.preload = 'auto'
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
              audio.play().catch((playErr: unknown) => {
                const e = playErr as { name?: string }
                console.warn('[TTS] play() rejected:', e?.name)
                setIsSpeaking(false)
                audioRef.current = null
                URL.revokeObjectURL(url)
                resolve()
              })
            })
            return
          }
        }
      }
      console.warn(`[TTS] OpenAI TTS failed (status=${res.status}), falling back to browser TTS`)
    } catch (err: unknown) {
      const e = err as { message?: string; name?: string }
      console.warn('[TTS] OpenAI TTS exception:', e?.message ?? e?.name)
    }

    /* STEP 2 — Browser fallback */
    browserTTS(cleanText)
  }, [voiceGender, browserTTS])

  /* ── Stop speaking ───────────────────────────────────────── */
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
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
      if (autoSpeak) void speak(aiContent)
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
