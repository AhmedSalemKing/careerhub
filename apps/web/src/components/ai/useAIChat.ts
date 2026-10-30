'use client'
import { useState, useCallback, useRef } from 'react'

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

  const updateMessages = useCallback((updater: (prev: Message[]) => Message[]) => {
    setMessages(prev => {
      const next = updater(prev)
      messagesRef.current = next
      return next
    })
  }, [])

  /* ── TTS ─────────────────────────────────────────────────── */
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const synth = window.speechSynthesis
    synth.cancel()
    const clean = text
      .replace(/\[CAREER_RESULT\][\s\S]*?\[\/CAREER_RESULT\]/g, '')
      .replace(/\[QUIZ_Q\][\s\S]*?\[\/QUIZ_Q\]/g, '')
      .trim()
    if (!clean) return

    const utter   = new SpeechSynthesisUtterance(clean)
    utter.lang    = 'ar-SA'
    utter.rate    = 0.88
    utter.pitch   = voiceGender === 'female' ? 1.15 : 0.82
    utter.volume  = 1

    const trySpeak = () => {
      const voices   = synth.getVoices()
      const arVoices = voices.filter(v => v.lang.startsWith('ar'))
      if (arVoices.length > 0) {
        const pick = voiceGender === 'female'
          ? arVoices.find(v => /female|laila|hala|zira/i.test(v.name)) ?? arVoices[0]
          : arVoices.find(v => /male|maged|tarik/i.test(v.name))       ?? arVoices[0]
        utter.voice = pick
      }
      utter.onstart = () => setIsSpeaking(true)
      utter.onend   = () => setIsSpeaking(false)
      utter.onerror = () => setIsSpeaking(false)
      synth.speak(utter)
    }

    if (synth.getVoices().length > 0) trySpeak()
    else synth.onvoiceschanged = trySpeak
  }, [voiceGender])

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
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
    updateMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const all = [...messagesRef.current]
      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: all.map(m => ({ role: m.role, content: m.content })) }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data      = await res.json() as { content?: string }
      const aiContent = data.content ?? 'عذراً، لم أتمكن من الرد.'

      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiContent, timestamp: new Date() }
      updateMessages(prev => [...prev, aiMsg])

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
      updateMessages(prev => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, updateMessages, extractCareerResult, speak])

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
  }
}
