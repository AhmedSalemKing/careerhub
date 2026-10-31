'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { VoiceOrb }  from '@/components/ai/VoiceOrb'
import { useAIChat } from '@/components/ai/useAIChat'
import type { CareerResult } from '@/components/ai/useAIChat'

/* ── Types ────────────────────────────────────────────────── */
interface QuizQuestion {
  question: string
  choices:  string[]
  correct:  number
  explanation: string
}

/* ── Constants ────────────────────────────────────────────── */
const STAGES = [
  'فهم تجربتك الحالية',
  'اكتشاف الاهتمامات',
  'جمع أدلة ومهارات',
  'التمييز بين المسارات',
  'التوصية والخطة',
  'مراجعة النتائج',
]

const FIRST_MSG = `مرحباً! أنا مساعدك في ديفي واي لاكتشاف مسارك المهني.
خلينا نبدأ — إيه أكثر حاجة استمتعت بيها لما اشتغلت على مشروع تقني أو حاولت تحل مشكلة؟
احكيلي عن مثال حقيقي، حتى لو كان مشروعاً صغيراً.`

const QUIZ_START = `ابدأ الاختبار التفاعلي الآن. أنشئ السؤال الأول لاكتشاف المسار المهني المناسب.
استخدم هذا الفورمات بالضبط:
[QUIZ_Q]{"question":"...","choices":["أ) ...","ب) ...","ج) ...","د) ..."],"correct":0,"explanation":"..."}[/QUIZ_Q]
ثم أضف جملة تشجيعية قصيرة قبل السؤال.`

/* ── Career Result Card ───────────────────────────────────── */
function CareerResultCard({ result, onRestart }: { result: CareerResult; onRestart: () => void }) {
  const router = useRouter()
  const locale = useLocale()
  const score  = Math.min(Math.max(result.matchScore ?? 85, 60), 99)

  const radius = 42
  const circ   = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--background)' }}>
      <div style={{ width: '100%', maxWidth: 680, direction: 'rtl' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'color-mix(in srgb, var(--primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)', marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success, #22c55e)' }} />
            <span style={{ fontSize: 12, fontFamily: 'PingAR', fontWeight: 500, color: 'var(--primary)' }}>تحليل مكتمل</span>
          </div>
          <h1 style={{ fontSize: 28, fontFamily: 'PingAR', fontWeight: 900, margin: '0 0 8px', color: 'var(--foreground)' }}>نتيجة تقييمك المهني</h1>
          <p style={{ fontSize: 14, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--muted-foreground)', margin: 0 }}>بناءً على محادثتنا، هذا المسار الأنسب لك</p>
        </div>

        {/* Score + primary path */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ flexShrink: 0, position: 'relative', width: 110, height: 110 }}>
            <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="55" cy="55" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle cx="55" cy="55" r={radius} fill="none" stroke="var(--primary)" strokeWidth="10"
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontSize: 24, fontFamily: 'PingAR', fontWeight: 900, color: 'var(--foreground)' }}>{score}%</span>
              <span style={{ fontSize: 9, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--muted-foreground)' }}>تطابق</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontFamily: 'PingAR', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: 4 }}>المسار الأساسي الموصى به</div>
            <div style={{ fontSize: 22, fontFamily: 'PingAR', fontWeight: 900, color: 'var(--foreground)', marginBottom: 8 }}>{result.primaryPath}</div>
            {result.summary && <p style={{ fontSize: 13, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.6 }}>{result.summary}</p>}
          </div>
        </div>

        {/* Grid: strengths + next steps */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 12, fontFamily: 'PingAR', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: 12 }}>نقاط قوتك</div>
            {(result.strengths ?? []).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success, #22c55e)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: 12, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--foreground)' }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 12, fontFamily: 'PingAR', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: 12 }}>خطواتك التالية</div>
            {(result.nextSteps ?? []).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontFamily: 'PingAR', fontWeight: 900, color: 'var(--primary)', flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                <span style={{ fontSize: 12, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--foreground)', lineHeight: 1.4 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary paths */}
        {(result.secondaryPaths ?? []).length > 0 && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontFamily: 'PingAR', fontWeight: 500, color: 'var(--muted-foreground)', marginBottom: 10 }}>مسارات بديلة مناسبة</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {result.secondaryPaths.map((p, i) => (
                <span key={i} style={{ padding: '4px 14px', borderRadius: 20, border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)', background: 'color-mix(in srgb, var(--primary) 8%, transparent)', fontSize: 12, fontFamily: 'PingAR', fontWeight: 500, color: 'var(--primary)' }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {result.timeline && (
          <div style={{ background: 'color-mix(in srgb, var(--primary) 7%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontSize: 13, fontFamily: 'PingAR', fontWeight: 500, color: 'var(--primary)' }}>الجدول الزمني المتوقع: {result.timeline}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push(`/${locale}/dashboard/career-path`)}
            style={{ flex: 1, padding: '13px 20px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground, #fff)', fontFamily: 'PingAR', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}
          >
            ابدأ مسارك الآن
          </button>
          <button
            onClick={onRestart}
            style={{ padding: '13px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', fontFamily: 'PingAR', fontWeight: 300, fontSize: 14, cursor: 'pointer' }}
          >
            إعادة التقييم
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Interview Mode ───────────────────────────────────────── */
function InterviewMode({ onEnd }: { onEnd: () => void }) {
  const {
    messages, isLoading, isListening, isSpeaking,
    careerResult, voiceGender, setVoiceGender,
    audioUnlocked, unlockAudio,
    sendMessage, speak, stopSpeaking, startListening, stopListening, clearChat,
    addAssistantMessage,
  } = useAIChat()

  const [input,   setInput]   = useState('')
  const [started, setStarted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    return () => {
      stopSpeaking()
      if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    }
  }, [stopSpeaking])

  const timeLeft = Math.max(0, 30 * 60 - elapsed)
  const mm       = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss       = String(timeLeft % 60).padStart(2, '0')

  useEffect(() => {
    if (!started) {
      setStarted(true)
      setTimeout(() => {
        addAssistantMessage(FIRST_MSG)
        // Don't speak on mount — browser blocks autoplay before user interaction
      }, 600)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const currentStage = Math.min(Math.floor(messages.length / 2), STAGES.length - 1)

  const unlockAutoplay = useCallback(async () => {
    await unlockAudio()
  }, [unlockAudio])

  const handleSend = useCallback(async () => {
    if (!input.trim()) return
    await unlockAutoplay()
    sendMessage(input)
    setInput('')
  }, [input, sendMessage, unlockAutoplay])

  const handleMic = useCallback(async () => {
    if (isListening) { stopListening(); return }
    await unlockAutoplay()
    stopSpeaking()
    startListening(text => sendMessage(text))
  }, [isListening, stopListening, stopSpeaking, startListening, sendMessage, unlockAutoplay])

  if (careerResult) {
    return <CareerResultCard result={careerResult} onRestart={() => { clearChat(); setStarted(false) }} />
  }

  const lastAI = [...messages].reverse().find(m => m.role === 'assistant')
  const cleanAI = lastAI?.content
    .replace(/\[CAREER_RESULT\][\s\S]*?\[\/CAREER_RESULT\]/g, '')
    .replace(/\[QUIZ_Q\][\s\S]*?\[\/QUIZ_Q\]/g, '')
    .trim() ?? ''

  const orbStatus = isListening ? 'يسمع الآن' : isLoading ? 'يفكر' : isSpeaking ? 'يتحدث' : 'جاهز'

  return (
    <div dir="rtl" style={{ display: 'flex', height: '100vh', background: 'var(--background)', color: 'var(--foreground)', overflow: 'hidden' }}>

      {/* Timer */}
      <div style={{ position: 'absolute', bottom: 100, right: 24, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style={{ fontSize: 12, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--muted-foreground)' }}>الوقت المتبقي</span>
          <span style={{ fontSize: 16, fontFamily: 'PingAR', fontWeight: 900, color: timeLeft < 300 ? 'var(--error, #ef4444)' : 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
            {mm}:{ss}
          </span>
        </div>
      </div>

      {/* Stages sidebar */}
      <div style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px', minWidth: 190 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontFamily: 'PingAR', fontWeight: 500, color: 'var(--muted-foreground)' }}>مراحل المقابلة</span>
            <span style={{ fontSize: 11, fontFamily: 'PingAR', fontWeight: 900, color: 'var(--primary)' }}>{currentStage + 1} / {STAGES.length}</span>
          </div>
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((currentStage + 1) / STAGES.length) * 100}%`, background: 'var(--primary)', borderRadius: 2, transition: 'width .5s ease' }} />
          </div>
          {STAGES.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: i < currentStage ? 'var(--success, #22c55e)' : i === currentStage ? 'var(--primary)' : 'color-mix(in srgb, var(--foreground) 15%, transparent)',
                transition: 'background .3s',
                boxShadow: i === currentStage ? '0 0 8px color-mix(in srgb, var(--primary) 60%, transparent)' : undefined,
              }} />
              <span style={{
                fontSize: 11, fontFamily: 'PingAR',
                color: i === currentStage ? 'var(--foreground)' : i < currentStage ? 'var(--success, #6ee7b7)' : 'var(--muted-foreground)',
                fontWeight: i === currentStage ? 500 : 300,
              }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main center */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Top bar */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', zIndex: 10 }}>
          <button
            onClick={() => { stopSpeaking(); onEnd() }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer', fontSize: 13, fontFamily: 'PingAR', fontWeight: 300 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            إنهاء المقابلة
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-foreground, white)" strokeWidth="1.8"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontFamily: 'PingAR', fontWeight: 500, color: 'var(--foreground)' }}>DeveWay Career AI</div>
              <div style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success, #22c55e)', fontFamily: 'PingAR', fontWeight: 300 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success, #22c55e)' }} />
                متصل الآن
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--muted-foreground)' }}>الصوت:</span>
            {(['female', 'male'] as const).map(g => (
              <button key={g} onClick={() => setVoiceGender(g)} style={{
                padding: '4px 12px', borderRadius: 20, border: '1px solid',
                borderColor: voiceGender === g ? 'color-mix(in srgb, var(--primary) 60%, transparent)' : 'var(--border)',
                background: voiceGender === g ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'transparent',
                color: voiceGender === g ? 'var(--primary)' : 'var(--muted-foreground)',
                fontSize: 11, fontFamily: 'PingAR', fontWeight: voiceGender === g ? 500 : 300, cursor: 'pointer',
              }}>
                {g === 'female' ? 'أنثى' : 'ذكر'}
              </button>
            ))}
          </div>
        </div>

        {/* Audio unlock button — shown until user interacts */}
        {!audioUnlocked && (
          <button
            onClick={async () => {
              await unlockAutoplay()
              if (messages.length > 0 && messages[0].role === 'assistant') {
                speak(messages[0].content)
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 18px', borderRadius: 20,
              background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
              color: 'var(--primary)',
              fontFamily: 'PingAR', fontWeight: 300, fontSize: 12,
              cursor: 'pointer', marginBottom: 8,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            اضغط لتفعيل الصوت
          </button>
        )}

        {/* Orb */}
        <div style={{ marginTop: 16, marginBottom: 16, background: 'transparent' }}>
          <VoiceOrb
            isListening={isListening}
            isSpeaking={isSpeaking}
            isThinking={isLoading}
            onClick={handleMic}
            size={230}
          />
        </div>

        {/* Status */}
        <div style={{ fontSize: 14, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--muted-foreground)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          {(isListening || isSpeaking || isLoading) && (
            <span style={{ display: 'inline-flex', gap: 3 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', animation: `_dot ${0.8 + i * 0.15}s ease infinite alternate` }} />
              ))}
            </span>
          )}
          <span>{orbStatus}...</span>
        </div>
        <style>{`@keyframes _dot{from{transform:translateY(0)}to{transform:translateY(-5px)}}`}</style>

        {/* Last AI message */}
        {cleanAI && (
          <div style={{ maxWidth: 520, width: '90%', background: 'color-mix(in srgb, var(--foreground) 5%, transparent)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, lineHeight: 1.7, fontSize: 14, fontFamily: 'PingAR', fontWeight: 300, textAlign: 'center', color: 'var(--foreground)' }}>
            {cleanAI.length > 220 ? cleanAI.slice(0, 220) + '...' : cleanAI}
          </div>
        )}

        {/* Input bar */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: 'var(--card)', borderTop: '1px solid var(--border)', zIndex: 20 }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="اكتب إجابتك..."
              disabled={isLoading || isListening}
              style={{ flex: 1, padding: '12px 18px', borderRadius: 24, border: '1px solid var(--border)', background: 'color-mix(in srgb, var(--foreground) 5%, transparent)', color: 'var(--foreground)', fontSize: 14, fontFamily: 'PingAR', fontWeight: 300, outline: 'none', direction: 'rtl' }}
            />
            <button
              onClick={handleMic}
              style={{ width: 46, height: 46, borderRadius: '50%', border: 'none', background: isListening ? 'var(--primary)' : 'color-mix(in srgb, var(--foreground) 10%, transparent)', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .2s', boxShadow: isListening ? '0 0 0 4px color-mix(in srgb, var(--primary) 20%, transparent)' : undefined }}
            >
              {isListening
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-foreground, white)" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              }
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              style={{ width: 46, height: 46, borderRadius: '50%', border: 'none', background: input.trim() ? 'var(--primary)' : 'color-mix(in srgb, var(--foreground) 8%, transparent)', color: input.trim() ? 'var(--primary-foreground, white)' : 'var(--muted-foreground)', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .2s' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Quiz Mode ────────────────────────────────────────────── */
function QuizMode({ onEnd }: { onEnd: () => void }) {
  const { messages, isLoading, careerResult, sendMessage, clearChat } = useAIChat()
  const [currentQ, setCurrentQ] = useState<QuizQuestion | null>(null)
  const [qIndex,   setQIndex]   = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showExp,  setShowExp]  = useState(false)
  const [started,  setStarted]  = useState(false)
  const [score,    setScore]    = useState(0)
  const TOTAL = 8

  const parseQuiz = (text: string): QuizQuestion | null => {
    const m = text.match(/\[QUIZ_Q\]([\s\S]*?)\[\/QUIZ_Q\]/)
    if (!m) return null
    try { return JSON.parse(m[1].trim()) } catch { return null }
  }

  useEffect(() => {
    if (!started) { setStarted(true); sendMessage(QUIZ_START, false) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const last = [...messages].reverse().find(m => m.role === 'assistant')
    if (!last) return
    const q = parseQuiz(last.content)
    if (q) { setCurrentQ(q); setSelected(null); setShowExp(false) }
  }, [messages])

  const handleSelect = (i: number) => {
    if (selected !== null || !currentQ) return
    setSelected(i)
    setShowExp(true)
    if (i === currentQ.correct) setScore(s => s + 1)
  }

  const handleNext = () => {
    const next = qIndex + 1
    setQIndex(next)
    setSelected(null)
    setShowExp(false)
    setCurrentQ(null)
    if (next >= TOTAL) {
      sendMessage(`لقد أجبت على ${TOTAL} أسئلة بنتيجة ${score}/${TOTAL}. الآن قدم توصية المسار المهني المخصصة باستخدام فورمات [CAREER_RESULT].`, false)
    } else {
      sendMessage(`أجبت. السؤال التالي رقم ${next + 1} من ${TOTAL}. استخدم فورمات [QUIZ_Q] بالضبط.`, false)
    }
  }

  if (careerResult) {
    return <CareerResultCard result={careerResult} onRestart={() => { clearChat(); setStarted(false); setQIndex(0); setScore(0) }} />
  }

  const pct = Math.round((qIndex / TOTAL) * 100)

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 640, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button onClick={onEnd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer', fontSize: 13, fontFamily: 'PingAR', fontWeight: 300 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          خروج
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontFamily: 'PingAR', fontWeight: 500, color: 'var(--muted-foreground)' }}>السؤال {Math.min(qIndex + 1, TOTAL)} من {TOTAL}</span>
          <span style={{ fontSize: 13, fontFamily: 'PingAR', fontWeight: 900, color: 'var(--primary)' }}>{score} صح</span>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 640, height: 6, background: 'var(--border)', borderRadius: 3, marginBottom: 32, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)', borderRadius: 3, transition: 'width .4s ease' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 640 }}>
        {isLoading && !currentQ ? (
          <div style={{ textAlign: 'center', padding: 60, fontSize: 14, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--muted-foreground)' }}>
            يتم توليد السؤال...
          </div>
        ) : currentQ ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 11, fontFamily: 'PingAR', fontWeight: 500, color: 'var(--primary)', marginBottom: 10, letterSpacing: '.08em' }}>سؤال {qIndex + 1}</div>
              <h2 style={{ fontSize: 20, fontFamily: 'PingAR', fontWeight: 900, lineHeight: 1.5, margin: 0, color: 'var(--foreground)' }}>{currentQ.question}</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {currentQ.choices.map((c, i) => {
                const isCorrect  = i === currentQ.correct
                const isSelected = i === selected
                let bg = 'var(--card)', border = 'var(--border)', color = 'var(--foreground)'
                if (selected !== null) {
                  if (isCorrect)       { bg = 'color-mix(in srgb, var(--success, #22c55e) 12%, transparent)'; border = 'var(--success, #22c55e)'; color = 'var(--success, #22c55e)' }
                  else if (isSelected) { bg = 'color-mix(in srgb, var(--error, #ef4444) 12%, transparent)'; border = 'var(--error, #ef4444)'; color = 'var(--error, #ef4444)' }
                }
                return (
                  <button key={i} onClick={() => handleSelect(i)} disabled={selected !== null}
                    style={{ padding: '14px 18px', borderRadius: 12, border: `1.5px solid ${border}`, background: bg, color, textAlign: 'right', cursor: selected !== null ? 'default' : 'pointer', fontSize: 14, fontFamily: 'PingAR', fontWeight: isSelected || (selected !== null && isCorrect) ? 500 : 300, transition: 'all .2s', direction: 'rtl' }}>
                    {c}
                  </button>
                )
              })}
            </div>

            {showExp && (
              <div style={{ background: 'color-mix(in srgb, var(--primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 13, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--foreground)', lineHeight: 1.6 }}>
                <span style={{ fontWeight: 500, color: 'var(--primary)' }}>التفسير: </span>
                {currentQ.explanation}
              </div>
            )}

            {selected !== null && (
              <button onClick={handleNext} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground, #fff)', fontFamily: 'PingAR', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>
                {qIndex + 1 >= TOTAL ? 'عرض النتيجة' : 'السؤال التالي'}
              </button>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--muted-foreground)' }}>جاري التحليل...</div>
        )}
      </div>
    </div>
  )
}

/* ── Mode Select ──────────────────────────────────────────── */
function ModeSelect({ onSelect }: { onSelect: (m: 'interview' | 'quiz') => void }) {
  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--background)' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'color-mix(in srgb, var(--primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
        </div>
        <h1 style={{ fontSize: 32, fontFamily: 'PingAR', fontWeight: 900, margin: '0 0 10px', color: 'var(--foreground)' }}>اكتشف مسارك المهني</h1>
        <p style={{ fontSize: 15, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--muted-foreground)', margin: '0 0 4px' }}>مع مساعدك الذكي في DeveWay</p>
        <p style={{ fontSize: 13, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--muted-foreground)' }}>اختر الطريقة التي تناسبك لاكتشاف فرصك المهنية.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, width: '100%', maxWidth: 640 }}>
        {/* Interview */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'color-mix(in srgb, var(--primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.7"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h2 style={{ fontSize: 20, fontFamily: 'PingAR', fontWeight: 900, margin: '0 0 10px', color: 'var(--foreground)' }}>مقابلة مع AI</h2>
          <p style={{ fontSize: 13, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--muted-foreground)', margin: '0 0 16px', lineHeight: 1.6, flex: 1 }}>
            حاور مساعدك الذكي في حوار تفاعلي يستكشف اهتماماتك وخبراتك ويقدم توصيات مخصصة.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success, #22c55e)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontSize: 12, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--muted-foreground)' }}>المدة التقريبية: 25-30 دقيقة</span>
          </div>
          <button onClick={() => onSelect('interview')} style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground, #fff)', fontFamily: 'PingAR', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>
            ابدأ المقابلة
          </button>
        </div>

        {/* Quiz */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #2bbfa3)" strokeWidth="1.7"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h2 style={{ fontSize: 20, fontFamily: 'PingAR', fontWeight: 900, margin: '0 0 10px', color: 'var(--foreground)' }}>اختبار تفاعلي</h2>
          <p style={{ fontSize: 13, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--muted-foreground)', margin: '0 0 16px', lineHeight: 1.6, flex: 1 }}>
            أسئلة ذكية تتكيف مع إجاباتك لتحديد أنسب المسارات المهنية لك بدقة عالية.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success, #22c55e)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontSize: 12, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--muted-foreground)' }}>المدة التقريبية: 15-20 دقيقة</span>
          </div>
          <button onClick={() => onSelect('quiz')} style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', fontFamily: 'PingAR', fontWeight: 300, fontSize: 14, cursor: 'pointer' }}>
            ابدأ الاختبار
          </button>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'PingAR', fontWeight: 300, color: 'var(--muted-foreground)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        التوصيات مبنية على المعلومات التي تشاركها معنا، وهي إرشاد مهني وليست ضماناً لوظيفة معينة.
      </div>
    </div>
  )
}

/* ── Main export ──────────────────────────────────────────── */
export default function AIInterviewPage({ mode }: { mode?: string }) {
  const router = useRouter()
  const locale = useLocale()

  const handleEnd = () => router.push(`/${locale}/dashboard/assessment`)

  if (mode === 'interview') return <InterviewMode onEnd={handleEnd} />
  if (mode === 'quiz')      return <QuizMode      onEnd={handleEnd} />
  return <ModeSelect onSelect={m => router.push(`/${locale}/dashboard/assessment?mode=${m}`)} />
}
