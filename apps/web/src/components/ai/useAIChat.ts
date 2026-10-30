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

  const recognitionRef     = useRef<SpeechRec | null>(null)
  const messagesRef        = useRef<Message[]>([])
  const audioRef           = useRef<HTMLAudioElement | null>(null)
  const speakAbortRef      = useRef<AbortController | null>(null)
  const browserTTSCancelRef = useRef<(() => void) | null>(null)
  const browserTTSActiveRef = useRef<boolean>(false)

  /* ── Unmount cleanup ─────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') window.speechSynthesis.cancel()
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.src = ''
        audioRef.current = null
      }
      const abort = speakAbortRef.current
      if (abort) { abort.abort(); speakAbortRef.current = null }
    }
  }, [])

  /* ── Browser TTS fallback — returns cancel fn ────────────── */
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

      const all    = synth.getVoices()
      const arabic = all.filter(v => v.lang.toLowerCase().startsWith('ar'))

      if (arabic.length > 0) {
        const pref = voiceGender === 'female'
          ? ['laila', 'maha', 'tamar', 'zariyah', 'female']
          : ['maged', 'omar', 'hamed', 'male']
        let best: SpeechSynthesisVoice | null = null
        for (const name of pref) {
          const found = arabic.find(v => v.name.toLowerCase().includes(name))
          if (found) { best = found; break }
        }
        u.voice = best ?? arabic[0]
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

  /* ── TTS — instant browser TTS + parallel Gemini ─────────── */
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return

    // Cancel everything in-flight
    const prevAbort = speakAbortRef.current
    if (prevAbort) { prevAbort.abort(); speakAbortRef.current = null }

    window.speechSynthesis.cancel()

    const prevCancel = browserTTSCancelRef.current
    if (prevCancel) { prevCancel(); browserTTSCancelRef.current = null }

    const prevAudio = audioRef.current
    if (prevAudio) {
      prevAudio.pause()
      prevAudio.src = ''
      audioRef.current = null
    }

    browserTTSActiveRef.current = false

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

    // Phase 1: start browser TTS immediately (zero wait)
    const cancelBrowser = browserTTS(cleanText)
    browserTTSCancelRef.current = cancelBrowser
    browserTTSActiveRef.current = true

    // Phase 2: fetch Gemini TTS in parallel; replace browser TTS when ready
    const controller = new AbortController()
    speakAbortRef.current = controller

    fetch('/api/ai/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, gender: voiceGender }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) return // keep browser TTS

        const blob = await res.blob()
        if (blob.size < 500) return // keep browser TTS

        // Cancel browser TTS and take over with Gemini audio
        const cancelFn = browserTTSCancelRef.current
        if (cancelFn) { cancelFn(); browserTTSCancelRef.current = null }
        browserTTSActiveRef.current = false
        window.speechSynthesis.cancel()

        const prevAudioInner = audioRef.current
        if (prevAudioInner) {
          prevAudioInner.pause()
          prevAudioInner.src = ''
          audioRef.current = null
        }

        const url = URL.createObjectURL(blob)
        const audio = new Audio()
        audio.preload = 'auto'
        audio.src = url
        audioRef.current = audio

        const capturedUrl = url

        audio.onended = () => {
          setIsSpeaking(false)
          audioRef.current = null
          setTimeout(() => URL.revokeObjectURL(capturedUrl), 500)
        }

        audio.onerror = () => {
          setIsSpeaking(false)
          audioRef.current = null
          setTimeout(() => URL.revokeObjectURL(capturedUrl), 500)
        }

        audio.play().catch(() => {
          // autoplay blocked — browser TTS already running, just clean up
          setIsSpeaking(false)
          audioRef.current = null
          setTimeout(() => URL.revokeObjectURL(capturedUrl), 500)
        })
      })
      .catch((err: unknown) => {
        const e = err as { name?: string }
        if (e?.name !== 'AbortError') {
          console.warn('[TTS] Gemini fetch failed, browser TTS continues:', e)
        }
        // browser TTS keeps playing — nothing to do
      })
      .finally(() => {
        if (speakAbortRef.current === controller) {
          speakAbortRef.current = null
        }
      })
  }, [voiceGender, browserTTS])

  /* ── Stop speaking ───────────────────────────────────────── */
  const stopSpeaking = useCallback(() => {
    const abort = speakAbortRef.current
    if (abort) { abort.abort(); speakAbortRef.current = null }

    if (typeof window !== 'undefined') window.speechSynthesis.cancel()

    const cancelFn = browserTTSCancelRef.current
    if (cancelFn) { cancelFn(); browserTTSCancelRef.current = null }
    browserTTSActiveRef.current = false

    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.src = ''
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
        content: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مجدداً.',
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
