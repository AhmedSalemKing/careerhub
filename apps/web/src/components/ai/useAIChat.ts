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
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  /* ── Browser TTS fallback ────────────────────────────────── */
  const browserTTS = useCallback((text: string) => {
    if (typeof window === 'undefined') return
    const synth = window.speechSynthesis

    const sentences = text
      .split(/[.!?،؛\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 2)

    if (!sentences.length) { setIsSpeaking(false); return }

    let index = 0

    const speakNext = () => {
      if (index >= sentences.length) { setIsSpeaking(false); return }

      const u = new SpeechSynthesisUtterance(sentences[index])
      u.lang   = 'ar-SA'
      u.rate   = 0.82
      u.pitch  = voiceGender === 'female' ? 1.1 : 0.8
      u.volume = 1.0

      const allVoices    = synth.getVoices()
      const arabicVoices = allVoices.filter(v => v.lang.startsWith('ar') || v.lang.startsWith('AR'))

      if (arabicVoices.length > 0) {
        const priority = voiceGender === 'female'
          ? ['Zariyah', 'Laila', 'Maha', 'Tamar', 'female', 'Female']
          : ['Hamed', 'Maged', 'Omar', 'male', 'Male']
        let best: SpeechSynthesisVoice | null = null
        for (const name of priority) {
          const found = arabicVoices.find(v => v.name.includes(name))
          if (found) { best = found; break }
        }
        u.voice = best ?? arabicVoices[0]
      }

      u.onend  = () => { index++; speakNext() }
      u.onerror = () => { index++; speakNext() }
      synth.speak(u)
    }

    if (synth.getVoices().length === 0) {
      synth.addEventListener('voiceschanged', speakNext, { once: true })
    } else {
      speakNext()
    }
  }, [voiceGender])

  /* ── TTS ─────────────────────────────────────────────────── */
  const speak = useCallback(async (text: string) => {
    if (typeof window === 'undefined') return

    window.speechSynthesis.cancel()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
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

    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, gender: voiceGender }),
        signal: AbortSignal.timeout(25000),
      })

      const contentType = res.headers.get('Content-Type') ?? ''
      if (res.ok && contentType.startsWith('audio/')) {
        const blob = await res.blob()
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audioRef.current = audio

          await new Promise<void>((resolve) => {
            audio.onended = () => {
              setIsSpeaking(false)
              audioRef.current = null
              setTimeout(() => URL.revokeObjectURL(url), 1000)
              resolve()
            }
            audio.onerror = () => {
              console.warn('[TTS] Audio playback error, falling back to browser TTS')
              setIsSpeaking(false)
              audioRef.current = null
              setTimeout(() => URL.revokeObjectURL(url), 1000)
              resolve()
            }
            audio.play().catch((playErr) => {
              console.warn('[TTS] play() failed:', playErr)
              setIsSpeaking(false)
              audioRef.current = null
              setTimeout(() => URL.revokeObjectURL(url), 1000)
              audioRef.current = null
              resolve()
            })
          })
          return
        }
      }

      const errData = res.ok ? null : await res.json().catch(() => null) as { error?: string } | null
      console.warn('[TTS] Edge TTS unavailable, using browser TTS. Reason:', errData?.error ?? res.status)
    } catch (err: unknown) {
      const e = err as { message?: string }
      console.warn('[TTS] Edge TTS exception:', e?.message)
    }

    browserTTS(cleanText)
  }, [voiceGender, browserTTS])

  /* ── Stop speaking ───────────────────────────────────────── */
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data      = await res.json() as { content?: string }
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
      const errMsg: Message = {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال. تأكد من إضافة GEMINI_API_KEY وحاول مجدداً.',
        timestamp: new Date(),
      }
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
