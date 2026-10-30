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
}

export interface QuizQuestion {
  question: string
  choices: string[]
  correct: number
  explanation: string
}

export function useAIChat(mode: 'interview' | 'quiz' = 'interview') {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [careerResult, setCareerResult] = useState<CareerResult | null>(null)
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null)
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female')
  const recognitionRef = useRef<any>(null)
  const messagesRef = useRef<Message[]>([])

  // Keep ref in sync with state for use inside callbacks
  const updateMessages = useCallback((updater: (prev: Message[]) => Message[]) => {
    setMessages(prev => {
      const next = updater(prev)
      messagesRef.current = next
      return next
    })
  }, [])

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return
    const synth = window.speechSynthesis
    synth.cancel()
    const cleanText = text
      .replace(/\[CAREER_RESULT\][\s\S]*?\[\/CAREER_RESULT\]/g, '')
      .replace(/\[QUIZ_Q\][\s\S]*?\[\/QUIZ_Q\]/g, '')
      .trim()
    if (!cleanText) return

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'ar-SA'
    utterance.rate = 0.9
    utterance.pitch = voiceGender === 'female' ? 1.2 : 0.8

    const loadVoices = () => {
      const voices = synth.getVoices()
      const arabicVoices = voices.filter(v => v.lang.startsWith('ar'))
      if (arabicVoices.length > 0) {
        if (voiceGender === 'female') {
          const femaleVoice = arabicVoices.find(v =>
            v.name.toLowerCase().includes('female') ||
            v.name.includes('Laila') ||
            v.name.includes('Salma') ||
            v.name.includes('Amira')
          )
          utterance.voice = femaleVoice || arabicVoices[0]
        } else {
          const maleVoice = arabicVoices.find(v =>
            v.name.includes('Maged') ||
            v.name.includes('Tarik') ||
            v.name.toLowerCase().includes('male')
          )
          utterance.voice = maleVoice || arabicVoices[0]
        }
      }
    }

    if (synth.getVoices().length > 0) {
      loadVoices()
    } else {
      synth.onvoiceschanged = loadVoices
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    synth.speak(utterance)
  }, [voiceGender])

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  const startListening = useCallback((onResult: (text: string) => void) => {
    if (typeof window === 'undefined') return
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'ar-SA'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript
      onResult(text)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  const extractCareerResult = useCallback((text: string): CareerResult | null => {
    const match = text.match(/\[CAREER_RESULT\]([\s\S]*?)\[\/CAREER_RESULT\]/)
    if (!match) return null
    try {
      return JSON.parse(match[1].trim())
    } catch {
      return null
    }
  }, [])

  const extractQuizQuestion = useCallback((text: string): QuizQuestion | null => {
    const match = text.match(/\[QUIZ_Q\]([\s\S]*?)\[\/QUIZ_Q\]/)
    if (!match) return null
    try {
      return JSON.parse(match[1].trim())
    } catch {
      return null
    }
  }, [])

  const sendMessage = useCallback(async (content: string, autoSpeak = true) => {
    if (!content.trim() || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    updateMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const allMessages = [...messagesRef.current, userMsg]
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          mode,
        }),
      })

      if (!res.ok) throw new Error('API error ' + res.status)
      const data = await res.json()
      const aiContent: string = data.content

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
      }

      updateMessages(prev => [...prev, aiMsg])

      const result = extractCareerResult(aiContent)
      if (result) setCareerResult(result)

      const quiz = extractQuizQuestion(aiContent)
      if (quiz) setCurrentQuiz(quiz)

      if (autoSpeak) speak(aiContent)
    } catch (error) {
      console.error('[useAIChat] error:', error)
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
        timestamp: new Date(),
      }
      updateMessages(prev => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, mode, speak, extractCareerResult, extractQuizQuestion, updateMessages])

  const clearChat = useCallback(() => {
    setMessages([])
    messagesRef.current = []
    setCareerResult(null)
    setCurrentQuiz(null)
    stopSpeaking()
    stopListening()
  }, [stopSpeaking, stopListening])

  return {
    messages,
    isLoading,
    isListening,
    isSpeaking,
    careerResult,
    currentQuiz,
    setCurrentQuiz,
    voiceGender,
    setVoiceGender,
    sendMessage,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    clearChat,
  }
}
