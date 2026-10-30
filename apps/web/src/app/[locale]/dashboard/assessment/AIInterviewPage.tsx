'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { VoiceOrb } from '@/components/ai/VoiceOrb'
import { useAIChat, type Message, type QuizQuestion } from '@/components/ai/useAIChat'

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const IcMic = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)

const IcSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const IcStop = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
  </svg>
)

const IcCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const IcArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
)

const IcX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const IcStar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

// ── Stage definitions ─────────────────────────────────────────────────────────
const STAGES = [
  { id: 1, label: 'فهم تجربتك الحالية' },
  { id: 2, label: 'اكتشاف الاهتمامات' },
  { id: 3, label: 'جمع المهارات والأدلة' },
  { id: 4, label: 'التمييز بين المسارات' },
  { id: 5, label: 'التوصية والخطة' },
  { id: 6, label: 'مراجعة النتائج' },
]

const QUIZ_INITIAL_PROMPT =
  'ابدأ الاختبار التفاعلي. أنشئ أول سؤال اختيار من متعدد لاكتشاف المسار المهني المناسب للمستخدم. الفورمات المطلوب بالضبط: [QUIZ_Q]{"question":"...","choices":["أ) ...","ب) ...","ج) ...","د) ..."],"correct":0,"explanation":"..."}[/QUIZ_Q]'

const INTERVIEW_INITIAL =
  'مرحباً! أنا مساعدك في DeveWay لاكتشاف مسارك المهني. خلينا نبدأ من خبرتك — إيه أكثر حاجة استمتعت بيها لما اشتغلت على مشروع تقني أو حاولت تحل مشكلة؟ احكيلي عن مثال حقيقي، حتى لو كان مشروعاً صغيراً.'

// ── Timer hook ────────────────────────────────────────────────────────────────
function useTimer(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const start = useCallback(() => {
    if (intervalRef.current) return
    intervalRef.current = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000)
  }, [])
  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    setSeconds(initialSeconds)
  }, [initialSeconds])
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return { display: `${mm}:${ss}`, seconds, start, reset }
}

// ── Result card ────────────────────────────────────────────────────────────────
function CareerResultCard({ result, onRestart, locale }: {
  result: NonNullable<ReturnType<typeof useAIChat>['careerResult']>
  onRestart: () => void
  locale: string
}) {
  const router = useRouter()
  const isAr = locale === 'ar'
  const score = Math.min(100, Math.max(0, result.matchScore))
  const circumference = 2 * Math.PI * 40

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px 80px',
        fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif',
      }}
    >
      <div style={{ maxWidth: 600, width: '100%' }}>
        {/* Score circle */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="color-mix(in srgb, var(--foreground) 8%, transparent)" strokeWidth="8"/>
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="#7c3aed" strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (circumference * score) / 100}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px', transition: 'stroke-dashoffset 1s ease' }}
              />
              <text x="50" y="56" textAnchor="middle" fill="var(--foreground)" fontSize="18" fontWeight="900" fontFamily='"PingAR",sans-serif'>
                {score}%
              </text>
            </svg>
          </div>
          <h1 style={{ margin: '16px 0 4px', fontWeight: 900, fontSize: 22, color: 'var(--foreground)' }}>
            {result.primaryPath}
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontWeight: 300, fontSize: 13, margin: 0 }}>
            {isAr ? 'مسارك المهني الأنسب' : 'Your best-fit career path'}
          </p>
        </div>

        {/* Secondary paths */}
        {result.secondaryPaths?.length > 0 && (
          <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {result.secondaryPaths.map(p => (
              <span key={p} style={{
                padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 300,
                background: 'color-mix(in srgb, var(--foreground) 6%, transparent)',
                border: '1px solid color-mix(in srgb, var(--foreground) 12%, transparent)',
                color: 'var(--foreground)',
              }}>
                {p}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gap: 14 }}>
          {/* Strengths */}
          {result.strengths?.length > 0 && (
            <div style={{ background: 'var(--card)', borderRadius: 16, padding: '16px 18px', border: '1px solid color-mix(in srgb, var(--foreground) 8%, transparent)' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>
                {isAr ? 'نقاط قوتك' : 'Your strengths'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.strengths.map(s => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#22c55e', flexShrink: 0 }}><IcCheck /></span>
                    <span style={{ fontSize: 13, fontWeight: 300, color: 'var(--foreground)' }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next steps */}
          {result.nextSteps?.length > 0 && (
            <div style={{ background: 'var(--card)', borderRadius: 16, padding: '16px 18px', border: '1px solid color-mix(in srgb, var(--foreground) 8%, transparent)' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>
                {isAr ? 'الخطوات التالية' : 'Next steps'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.nextSteps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%', background: 'rgba(124,58,237,0.2)',
                      color: '#a78bfa', fontSize: 10, fontWeight: 500,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 300, color: 'var(--foreground)', lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline + courses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {result.timeline && (
              <div style={{ background: 'var(--card)', borderRadius: 14, padding: '14px 16px', border: '1px solid color-mix(in srgb, var(--foreground) 8%, transparent)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 300, color: 'var(--muted-foreground)', marginBottom: 6 }}>
                  {isAr ? 'الجدول الزمني' : 'Timeline'}
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, color: '#a78bfa' }}>{result.timeline}</div>
              </div>
            )}
            {result.recommendedCourses?.length > 0 && (
              <div style={{ background: 'var(--card)', borderRadius: 14, padding: '14px 16px', border: '1px solid color-mix(in srgb, var(--foreground) 8%, transparent)' }}>
                <div style={{ fontSize: 11, fontWeight: 300, color: 'var(--muted-foreground)', marginBottom: 6 }}>
                  {isAr ? 'كورسات مقترحة' : 'Recommended courses'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {result.recommendedCourses.slice(0, 2).map(c => (
                    <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ color: '#f59e0b' }}><IcStar /></span>
                      <span style={{ fontSize: 11, fontWeight: 300, color: 'var(--foreground)' }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={() => router.push(`/${locale}/dashboard/career-path`)}
            style={{
              flex: 1, padding: '13px 20px', borderRadius: 12, border: 'none',
              background: '#7c3aed', color: 'var(--primary-foreground)',
              fontFamily: '"PingAR",sans-serif', fontWeight: 500, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {isAr ? 'ابدأ مسارك الآن' : 'Start your path'}
            <IcArrow />
          </button>
          <button
            onClick={onRestart}
            style={{
              padding: '13px 16px', borderRadius: 12,
              border: '1px solid color-mix(in srgb, var(--foreground) 14%, transparent)',
              background: 'transparent', color: 'var(--foreground)',
              fontFamily: '"PingAR",sans-serif', fontWeight: 300, fontSize: 13, cursor: 'pointer',
            }}
          >
            {isAr ? 'إعادة' : 'Restart'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Quiz mode ─────────────────────────────────────────────────────────────────
function QuizMode({ locale }: { locale: string }) {
  const isAr = locale === 'ar'
  const router = useRouter()
  const { messages, isLoading, careerResult, currentQuiz, setCurrentQuiz, sendMessage, clearChat } = useAIChat('quiz')
  const [started, setStarted] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)

  const handleStart = useCallback(() => {
    setStarted(true)
    sendMessage(QUIZ_INITIAL_PROMPT, false)
  }, [sendMessage])

  const handleSelect = useCallback((idx: number) => {
    if (selected !== null || !currentQuiz) return
    setSelected(idx)
    setShowExplanation(true)
    if (idx === currentQuiz.correct) setScore(s => s + 1)
  }, [selected, currentQuiz])

  const handleNext = useCallback(() => {
    if (questionCount >= 7) {
      // Ask for final career result
      sendMessage('أعطني التوصية النهائية المبنية على إجاباتي في الاختبار، استخدم فورمات [CAREER_RESULT].', false)
    } else {
      setSelected(null)
      setShowExplanation(false)
      setCurrentQuiz(null)
      setQuestionCount(q => q + 1)
      sendMessage('السؤال التالي من فضلك.', false)
    }
  }, [questionCount, sendMessage, setCurrentQuiz])

  if (careerResult) {
    return <CareerResultCard result={careerResult} onRestart={() => { clearChat(); setStarted(false); setQuestionCount(0); setScore(0) }} locale={locale} />
  }

  if (!started) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: '0 20px', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h1 style={{ fontWeight: 900, fontSize: 22, color: 'var(--foreground)', margin: '0 0 8px' }}>
            {isAr ? 'الاختبار التفاعلي' : 'Interactive Quiz'}
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontWeight: 300, fontSize: 13, margin: '0 0 28px', lineHeight: 1.6 }}>
            {isAr ? '8 أسئلة ذكية تكشف مسارك المهني الأنسب' : '8 smart questions to find your ideal career path'}
          </p>
          <button onClick={handleStart} style={{ padding: '13px 32px', borderRadius: 12, border: 'none', background: '#7c3aed', color: 'var(--primary-foreground)', fontFamily: '"PingAR",sans-serif', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>
            {isAr ? 'ابدأ الاختبار' : 'Start Quiz'}
          </button>
          <button onClick={() => router.back()} style={{ display: 'block', margin: '12px auto 0', background: 'transparent', border: 'none', color: 'var(--muted-foreground)', fontFamily: '"PingAR",sans-serif', fontWeight: 300, fontSize: 12, cursor: 'pointer' }}>
            {isAr ? 'رجوع' : 'Go back'}
          </button>
        </div>
      </div>
    )
  }

  const progress = ((questionCount + (selected !== null ? 1 : 0)) / 8) * 100

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid color-mix(in srgb, var(--foreground) 8%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => { clearChat(); setStarted(false) }} style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: '"PingAR",sans-serif', fontWeight: 300, fontSize: 13 }}>
          <IcX /> {isAr ? 'إنهاء' : 'End'}
        </button>
        <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--foreground)' }}>
          {isAr ? `سؤال ${questionCount + 1} من 8` : `Question ${questionCount + 1} of 8`}
        </span>
        <span style={{ fontWeight: 300, fontSize: 13, color: '#22c55e' }}>
          {isAr ? `${score} صح` : `${score} correct`}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'color-mix(in srgb, var(--foreground) 6%, transparent)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #6366f1)', transition: 'width 0.4s ease' }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        {isLoading && !currentQuiz ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', animation: `quizDot 1.2s ${i * 0.2}s ease infinite` }} />
              ))}
            </div>
            <p style={{ color: 'var(--muted-foreground)', fontWeight: 300, fontSize: 13 }}>
              {isAr ? 'جاري توليد السؤال...' : 'Generating question...'}
            </p>
          </div>
        ) : currentQuiz ? (
          <div style={{ maxWidth: 520, width: '100%' }}>
            <h2 style={{ fontWeight: 500, fontSize: 18, color: 'var(--foreground)', marginBottom: 24, lineHeight: 1.5, textAlign: 'center' }}>
              {currentQuiz.question}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentQuiz.choices.map((choice, i) => {
                const isSelected = selected === i
                const isCorrect = i === currentQuiz.correct
                const showResult = selected !== null
                let bg = 'var(--card)'
                let borderColor = 'color-mix(in srgb, var(--foreground) 10%, transparent)'
                let color = 'var(--foreground)'
                if (showResult && isCorrect) { bg = 'rgba(34,197,94,0.12)'; borderColor = '#22c55e'; color = '#16a34a' }
                else if (showResult && isSelected && !isCorrect) { bg = 'rgba(239,68,68,0.12)'; borderColor = '#ef4444'; color = '#dc2626' }
                else if (isSelected) { bg = 'rgba(124,58,237,0.15)'; borderColor = '#7c3aed'; color = '#a78bfa' }
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={selected !== null}
                    style={{
                      padding: '14px 18px', borderRadius: 12, border: `1.5px solid ${borderColor}`,
                      background: bg, color, cursor: selected !== null ? 'default' : 'pointer',
                      fontFamily: '"PingAR",sans-serif', fontWeight: 300, fontSize: 14,
                      textAlign: 'right', transition: 'all 0.15s',
                    }}
                  >
                    {choice}
                  </button>
                )
              })}
            </div>

            {showExplanation && (
              <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'color-mix(in srgb, var(--foreground) 4%, transparent)', border: '1px solid color-mix(in srgb, var(--foreground) 8%, transparent)' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 300, color: 'var(--foreground)', lineHeight: 1.6 }}>
                  {currentQuiz.explanation}
                </p>
              </div>
            )}

            {selected !== null && (
              <button onClick={handleNext} style={{ marginTop: 16, width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: '#7c3aed', color: 'var(--primary-foreground)', fontFamily: '"PingAR",sans-serif', fontWeight: 500, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {questionCount >= 7 ? (isAr ? 'اعرض النتيجة' : 'Show result') : (isAr ? 'السؤال التالي' : 'Next question')}
                <IcArrow />
              </button>
            )}
          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes quizDot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ── Interview mode ─────────────────────────────────────────────────────────────
export default function AIInterviewPage({ mode = 'interview' }: { mode?: 'interview' | 'quiz' }) {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()

  if (mode === 'quiz') return <QuizMode locale={locale} />

  const {
    messages,
    isLoading,
    isListening,
    isSpeaking,
    careerResult,
    voiceGender,
    setVoiceGender,
    sendMessage,
    stopSpeaking,
    startListening,
    stopListening,
    clearChat,
  } = useAIChat('interview')

  const [input, setInput] = useState('')
  const [started, setStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timer = useTimer(30 * 60)

  const currentStage = Math.min(6, Math.floor(messages.length / 2) + 1)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleStart = useCallback(async () => {
    setStarted(true)
    timer.start()
    await sendMessage(INTERVIEW_INITIAL, true)
  }, [sendMessage, timer])

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return
    sendMessage(input.trim())
    setInput('')
  }, [input, isLoading, sendMessage])

  const handleVoice = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening(text => {
        setInput(text)
        // Auto-send after voice input
        setTimeout(() => {
          sendMessage(text)
          setInput('')
        }, 300)
      })
    }
  }, [isListening, startListening, stopListening, sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const orbStatus = isListening ? 'يسمع الآن' : isLoading ? 'يفكر' : isSpeaking ? 'يتحدث' : 'جاهز'
  const orbStatusEn = isListening ? 'Listening' : isLoading ? 'Thinking' : isSpeaking ? 'Speaking' : 'Ready'

  if (careerResult) {
    return <CareerResultCard result={careerResult} onRestart={() => { clearChat(); setStarted(false); timer.reset() }} locale={locale} />
  }

  if (!started) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: '0 20px', fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif' }}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <VoiceOrb isListening={false} isSpeaking={false} isThinking={false} size={160} />
          <h1 style={{ fontWeight: 900, fontSize: 22, color: 'var(--foreground)', margin: '20px 0 8px' }}>
            {isAr ? 'مقابلة AI المهنية' : 'AI Career Interview'}
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontWeight: 300, fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
            {isAr
              ? 'محادثة ذكية تكتشف مسارك المهني الأنسب بناءً على اهتماماتك وخبرتك'
              : 'A smart conversation that finds your ideal career path based on your interests and experience'}
          </p>
          {/* Voice gender selector */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <span style={{ fontWeight: 300, fontSize: 12, color: 'var(--muted-foreground)' }}>
              {isAr ? 'صوت المساعد:' : 'Voice:'}
            </span>
            {(['female', 'male'] as const).map(g => (
              <button
                key={g}
                onClick={() => setVoiceGender(g)}
                style={{
                  padding: '4px 14px', borderRadius: 20, border: '1px solid',
                  borderColor: voiceGender === g ? '#7c3aed' : 'color-mix(in srgb, var(--foreground) 15%, transparent)',
                  background: voiceGender === g ? 'rgba(124,58,237,0.18)' : 'transparent',
                  color: voiceGender === g ? '#a78bfa' : 'var(--muted-foreground)',
                  fontFamily: '"PingAR",sans-serif', fontWeight: 300, fontSize: 11, cursor: 'pointer',
                }}
              >
                {g === 'female' ? (isAr ? 'أنثى' : 'Female') : (isAr ? 'ذكر' : 'Male')}
              </button>
            ))}
          </div>
          <button onClick={handleStart} style={{ padding: '13px 36px', borderRadius: 12, border: 'none', background: '#7c3aed', color: 'var(--primary-foreground)', fontFamily: '"PingAR",sans-serif', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>
            {isAr ? 'ابدأ المقابلة' : 'Start Interview'}
          </button>
          <button onClick={() => router.back()} style={{ display: 'block', margin: '12px auto 0', background: 'transparent', border: 'none', color: 'var(--muted-foreground)', fontFamily: '"PingAR",sans-serif', fontWeight: 300, fontSize: 12, cursor: 'pointer' }}>
            {isAr ? 'رجوع' : 'Go back'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: 'var(--background)',
        display: 'flex',
        fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid color-mix(in srgb, var(--foreground) 8%, transparent)',
          flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isLoading ? '#f59e0b' : isSpeaking ? '#3b82f6' : isListening ? '#a78bfa' : '#22c55e' }} />
            <span style={{ fontWeight: 300, fontSize: 13, color: 'var(--foreground)' }}>
              DeveWay Career AI — {isAr ? orbStatus : orbStatusEn}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 300, fontSize: 12, color: timer.seconds < 300 ? '#ef4444' : 'var(--muted-foreground)' }}>
              {timer.display}
            </span>
            {/* Voice gender */}
            <div style={{ display: 'flex', gap: 6 }}>
              {(['female', 'male'] as const).map(g => (
                <button key={g} onClick={() => setVoiceGender(g)} style={{
                  padding: '3px 10px', borderRadius: 20, border: '1px solid',
                  borderColor: voiceGender === g ? '#7c3aed' : 'color-mix(in srgb, var(--foreground) 12%, transparent)',
                  background: voiceGender === g ? 'rgba(124,58,237,0.18)' : 'transparent',
                  color: voiceGender === g ? '#a78bfa' : 'var(--muted-foreground)',
                  fontFamily: '"PingAR",sans-serif', fontWeight: 300, fontSize: 11, cursor: 'pointer',
                }}>
                  {g === 'female' ? (isAr ? 'أنثى' : 'F') : (isAr ? 'ذكر' : 'M')}
                </button>
              ))}
            </div>
            <button onClick={() => { stopSpeaking(); clearChat(); setStarted(false); timer.reset() }} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 8,
              border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)',
              color: '#ef4444', cursor: 'pointer',
              fontFamily: '"PingAR",sans-serif', fontWeight: 300, fontSize: 12,
            }}>
              <IcX />
              {isAr ? 'إنهاء' : 'End'}
            </button>
          </div>
        </div>

        {/* Orb + status */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24, paddingBottom: 8 }}>
          <VoiceOrb
            isListening={isListening}
            isSpeaking={isSpeaking}
            isThinking={isLoading}
            size={200}
            onClick={isSpeaking ? stopSpeaking : undefined}
          />
          <div style={{ display: 'flex', gap: 5, marginTop: 12, alignItems: 'center' }}>
            <span style={{ fontWeight: 300, fontSize: 13, color: 'var(--muted-foreground)' }}>
              {isAr ? orbStatus : orbStatusEn}
            </span>
            {(isLoading || isSpeaking || isListening) && (
              <div style={{ display: 'flex', gap: 3 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#7c3aed', animation: `interviewDot 1s ${i * 0.15}s ease infinite` }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          {messages.map((msg: Message) => {
            const isUser = msg.role === 'user'
            const displayContent = msg.content
              .replace(/\[CAREER_RESULT\][\s\S]*?\[\/CAREER_RESULT\]/g, '')
              .trim()
            if (!displayContent) return null
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end', gap: 8 }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: 14,
                  background: isUser
                    ? 'color-mix(in srgb, var(--foreground) 6%, transparent)'
                    : 'rgba(124,58,237,0.15)',
                  border: `1px solid ${isUser ? 'color-mix(in srgb, var(--foreground) 10%, transparent)' : 'rgba(124,58,237,0.3)'}`,
                  fontSize: 13, fontWeight: 300, color: 'var(--foreground)', lineHeight: 1.6,
                  wordBreak: 'break-word',
                }}>
                  {displayContent}
                </div>
              </div>
            )
          })}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ padding: '10px 16px', borderRadius: 14, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#7c3aed', animation: `interviewDot 1s ${i * 0.15}s ease infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid color-mix(in srgb, var(--foreground) 8%, transparent)',
          display: 'flex', gap: 8, alignItems: 'flex-end',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAr ? 'اكتب ردك هنا...' : 'Type your response...'}
            rows={1}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 12,
              border: '1px solid color-mix(in srgb, var(--foreground) 12%, transparent)',
              background: 'color-mix(in srgb, var(--foreground) 4%, transparent)',
              color: 'var(--foreground)', resize: 'none', outline: 'none',
              fontFamily: '"PingAR","Plus Jakarta Sans",sans-serif',
              fontWeight: 300, fontSize: 14, lineHeight: 1.5,
              maxHeight: 120, overflowY: 'auto',
            }}
          />
          {/* Mic button */}
          <button
            onClick={handleVoice}
            title={isAr ? (isListening ? 'إيقاف' : 'تحدث') : (isListening ? 'Stop' : 'Speak')}
            style={{
              width: 42, height: 42, borderRadius: 11, border: 'none', flexShrink: 0,
              background: isListening ? 'rgba(139,92,246,0.25)' : 'color-mix(in srgb, var(--foreground) 6%, transparent)',
              color: isListening ? '#a78bfa' : 'var(--muted-foreground)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            {isListening ? <IcStop /> : <IcMic />}
          </button>
          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              width: 42, height: 42, borderRadius: 11, border: 'none', flexShrink: 0,
              background: input.trim() && !isLoading ? '#7c3aed' : 'color-mix(in srgb, var(--foreground) 6%, transparent)',
              color: input.trim() && !isLoading ? 'white' : 'var(--muted-foreground)',
              cursor: input.trim() && !isLoading ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            <IcSend />
          </button>
        </div>
      </div>

      {/* Right sidebar — stages (desktop only) */}
      <div style={{
        width: 220, borderRight: '1px solid color-mix(in srgb, var(--foreground) 8%, transparent)',
        padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 6,
        flexShrink: 0,
      }}
        className="interview-sidebar"
      >
        <h3 style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted-foreground)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {isAr ? 'مراحل المقابلة' : 'Interview stages'}
        </h3>
        {STAGES.map(stage => {
          const done = stage.id < currentStage
          const active = stage.id === currentStage
          return (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 500,
                background: done ? '#7c3aed' : active ? 'rgba(124,58,237,0.2)' : 'color-mix(in srgb, var(--foreground) 6%, transparent)',
                border: `1.5px solid ${done ? '#7c3aed' : active ? '#7c3aed' : 'color-mix(in srgb, var(--foreground) 15%, transparent)'}`,
                color: done ? 'white' : active ? '#a78bfa' : 'var(--muted-foreground)',
              }}>
                {done ? <IcCheck /> : stage.id}
              </div>
              <span style={{ fontSize: 12, fontWeight: active ? 500 : 300, color: active ? 'var(--foreground)' : 'var(--muted-foreground)', lineHeight: 1.3 }}>
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes interviewDot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        @media (max-width: 768px) {
          .interview-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  )
}
