'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  Sparkles, BarChart3, BookOpen, CheckCircle2, ExternalLink,
  RotateCcw, ArrowLeft, ArrowRight, RefreshCw
} from 'lucide-react'
import {
  QUESTION_BANK, TRACK_META, selectAdaptiveQuestions,
  calculateResults, type Question, type CareerScore
} from '@/lib/assessment-engine'

type Phase = 'intro' | 'questions' | 'analyzing' | 'results'

export default function AssessmentPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  
  const [phase, setPhase] = useState<Phase>('intro')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [scores, setScores] = useState<Record<string, number>>({})
  const [results, setResults] = useState<CareerScore[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => { setReady(true) }, [])

  useEffect(() => {
    if (phase !== 'questions') return
    const handleKey = (e: KeyboardEvent) => {
      const num = parseInt(e.key)
      if (num >= 1 && num <= 4) {
        const question = questions[currentIdx]
        if (question && question.options[num - 1]) {
          handleAnswer(num - 1)
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [phase, currentIdx, questions])

  const startAssessment = () => {
    const initial = selectAdaptiveQuestions(QUESTION_BANK, {}, {})
    setQuestions(initial)
    setCurrentIdx(0)
    setAnswers({})
    setScores({})
    setPhase('questions')
  }

  const handleAnswer = (optionIdx: number) => {
    const question = questions[currentIdx]
    const newAnswers = { ...answers, [question.id]: optionIdx }
    
    const option = question.options[optionIdx]
    const newScores: Record<string, number> = { ...scores }
    Object.entries(option.weights).forEach(([track, weight]) => {
      newScores[track] = (newScores[track] || 0) + weight
    })
    
    setAnswers(newAnswers)
    setScores(newScores)
    
    if (currentIdx < questions.length - 1) {
      if (currentIdx === 5) {
        const adaptive = selectAdaptiveQuestions(QUESTION_BANK, newAnswers, newScores)
        const answeredIds = Object.keys(newAnswers)
        const remaining = adaptive.filter(q => !answeredIds.includes(q.id))
        const answeredQs = questions.filter(q => answeredIds.includes(q.id))
        setQuestions([...answeredQs, ...remaining].slice(0, 15))
      }
      setTimeout(() => setCurrentIdx(i => i + 1), 150)
    } else {
      setPhase('analyzing')
      setTimeout(() => {
        const res = calculateResults(questions, newAnswers, locale)
        setResults(res)
        setPhase('results')
      }, 2500)
    }
  }

  const bg = isDark ? '#0d0d0d' : '#fafafa'
  const cardBg = isDark ? '#111111' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb'
  const text = isDark ? '#f1f5f9' : '#0d0d0d'
  const subtext = isDark ? '#94a3b8' : '#6b7280'

  if (!ready) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #5120c8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (phase === 'intro') return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, margin: '0 auto 24px',
          background: isDark ? 'rgba(81,32,200,0.12)' : 'rgba(81,32,200,0.08)',
          border: '1px solid rgba(81,32,200,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={26} color="#5120c8" />
        </div>
        <h1 style={{ color: text, fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
          {isAr ? 'اكتشف مسارك المهني' : 'Discover Your Career Path'}
        </h1>
        <p style={{ color: subtext, fontSize: 15, margin: '0 0 32px', lineHeight: 1.75 }}>
          {isAr
            ? '15 سؤال ذكي يحلل اهتماماتك ومهاراتك وشخصيتك النتيجة مخصصة لك بالكامل'
            : '15 smart questions analyzing your interests, skills and personality completely personalized results'}
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
          {[
            { icon: <Sparkles size={16} color="#5120c8" />, labelAr: 'أسئلة تكيفية', labelEn: 'Adaptive Questions' },
            { icon: <BarChart3 size={16} color="#5120c8" />, labelAr: 'نتيجة دقيقة', labelEn: 'Accurate Results' },
            { icon: <BookOpen size={16} color="#5120c8" />, labelAr: 'كورسات مخصصة', labelEn: 'Matched Courses' },
          ].map((f, i) => (
            <div key={i} style={{
              padding: '14px 10px', borderRadius: 12,
              border: `1px solid ${border}`,
              background: cardBg,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              {f.icon}
              <span style={{ color: subtext, fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
                {isAr ? f.labelAr : f.labelEn}
              </span>
            </div>
          ))}
        </div>
        
        <button onClick={startAssessment} style={{
          width: '100%', padding: '15px', borderRadius: 14,
          background: '#5120c8', color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em',
          boxShadow: '0 4px 20px rgba(81,32,200,0.3)',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          {isAr ? 'ابدأ الاختبار الذكي' : 'Start Smart Assessment'}
        </button>
        <p style={{ color: isDark ? 'rgba(255,255,255,0.2)' : '#d1d5db', fontSize: 12, marginTop: 12 }}>
          {isAr ? 'مجاني بالكامل يستغرق 3-5 دقائق' : 'Completely free takes 3-5 minutes'}
        </p>
      </div>
    </div>
  )

  if (phase === 'questions') {
    const question = questions[currentIdx]
    const progress = ((currentIdx) / questions.length) * 100
    
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column', direction: isAr ? 'rtl' : 'ltr' }}>
        <div style={{ height: 3, background: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0', position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: `${progress}%`,
            height: '100%', background: '#5120c8',
            transition: 'width 0.4s ease',
          }} />
        </div>
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ maxWidth: 620, width: '100%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <span style={{
                padding: '4px 12px', borderRadius: 20,
                background: isDark ? 'rgba(255,255,255,0.06)' : '#f4f4f8',
                border: `1px solid ${border}`,
                color: subtext, fontSize: 12, fontWeight: 600,
              }}>
                {isAr ? question.phaseAr : question.phaseEn}
              </span>
              <span style={{ color: subtext, fontSize: 13, fontWeight: 600 }}>
                {currentIdx + 1} / {questions.length}
              </span>
            </div>
            
            <h2 style={{
              color: text, fontSize: 'clamp(18px,3vw,24px)', fontWeight: 800,
              margin: '0 0 32px', lineHeight: 1.4, letterSpacing: '-0.02em',
            }}>
              {isAr ? question.textAr : question.textEn}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {question.options.map((option, idx) => (
                <button key={idx} onClick={() => handleAnswer(idx)} style={{
                  padding: '16px 20px', borderRadius: 12, textAlign: 'right',
                  border: `1.5px solid ${border}`,
                  background: cardBg, color: text,
                  cursor: 'pointer', fontSize: 14, fontWeight: 600, lineHeight: 1.5,
                  transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#5120c8'
                  e.currentTarget.style.background = isDark ? 'rgba(81,32,200,0.08)' : 'rgba(81,32,200,0.04)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = border
                  e.currentTarget.style.background = cardBg
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: isDark ? 'rgba(255,255,255,0.06)' : '#f4f4f8',
                    border: `1px solid ${border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: subtext,
                  }}>
                    {['أ','ب','ج','د'][idx] || (idx + 1)}
                  </div>
                  <span style={{ flex: 1, textAlign: isAr ? 'right' : 'left' }}>
                    {isAr ? option.textAr : option.textEn}
                  </span>
                </button>
              ))}
            </div>
            
            <p style={{ color: isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
              {isAr ? 'اضغط 1-4 للإجابة' : 'Press 1-4 to answer'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'analyzing') return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 24px' }}>
          <div style={{ width: 64, height: 64, border: '3px solid rgba(81,32,200,0.2)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', inset: 0, border: '3px solid #5120c8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
        <h2 style={{ color: text, fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>
          {isAr ? 'جاري تحليل إجاباتك...' : 'Analyzing your answers...'}
        </h2>
        <p style={{ color: subtext, fontSize: 14 }}>
          {isAr ? 'نبني ملفك المهني الشخصي' : 'Building your personal career profile'}
        </p>
      </div>
    </div>
  )

  if (phase === 'results') {
    const top = results[0]
    
    return (
      <div style={{ minHeight: '100vh', background: bg, padding: '40px 24px 80px', direction: isAr ? 'rtl' : 'ltr' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 20,
              background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)',
              marginBottom: 16,
            }}>
              <CheckCircle2 size={13} color="#16a34a" />
              <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 600 }}>
                {isAr ? 'تم التحليل بنجاح' : 'Analysis Complete'}
              </span>
            </div>
            <h1 style={{ color: text, fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {isAr ? `مسارك المثالي: ${top?.titleAr}` : `Your Ideal Path: ${top?.titleEn}`}
            </h1>
            <p style={{ color: subtext, fontSize: 14 }}>
              {isAr ? 'إليك أفضل 5 مسارات مهنية تناسبك بناء على إجاباتك' : 'Here are the top 5 career paths matching your profile'}
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
            {results.map((result, idx) => (
              <div key={result.track} style={{
                padding: '20px 24px', borderRadius: 16,
                border: `1.5px solid ${idx === 0 ? 'rgba(81,32,200,0.4)' : border}`,
                background: idx === 0 ? (isDark ? 'rgba(81,32,200,0.08)' : 'rgba(81,32,200,0.03)') : cardBg,
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: idx === 0 ? '#5120c8' : isDark ? 'rgba(255,255,255,0.06)' : '#f4f4f8',
                  border: `1px solid ${idx === 0 ? 'transparent' : border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: idx === 0 ? '#fff' : subtext, fontSize: 14, fontWeight: 800,
                }}>
                  {idx + 1}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <h3 style={{ color: text, fontSize: 16, fontWeight: 800, margin: 0 }}>
                      {isAr ? result.titleAr : result.titleEn}
                    </h3>
                    {idx === 0 && (
                      <span style={{ padding: '2px 8px', borderRadius: 6, background: '#5120c8', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                        {isAr ? 'الأنسب لك' : 'Best Match'}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 6, background: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${result.normalized}%`, height: '100%',
                        background: idx === 0 ? '#5120c8' : '#94a3b8',
                        borderRadius: 3, transition: 'width 1s ease',
                      }} />
                    </div>
                    <span style={{ color: idx === 0 ? '#5120c8' : subtext, fontSize: 13, fontWeight: 800, minWidth: 36 }}>
                      {result.normalized}%
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => window.open(`https://devewayhub.vercel.app/${locale}/courses?category=${TRACK_META[result.track]?.category || 'tech'}`, '_blank')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 10,
                    background: idx === 0 ? '#5120c8' : 'transparent',
                    color: idx === 0 ? '#fff' : '#5120c8',
                    border: `1px solid ${idx === 0 ? 'transparent' : 'rgba(81,32,200,0.3)'}`,
                    cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    flexShrink: 0, transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  <BookOpen size={13} />
                  {isAr ? 'عرض الكورسات' : 'View Courses'}
                  <ExternalLink size={11} />
                </button>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push(`/${locale}/dashboard/career-path`)}
              style={{
                flex: 1, minWidth: 200, padding: '14px', borderRadius: 12,
                background: '#5120c8', color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              {isAr ? 'استكشف مسارك التفصيلي' : 'Explore Your Detailed Path'}
            </button>
            <button
              onClick={() => { setPhase('intro') }}
              style={{
                padding: '14px 20px', borderRadius: 12, cursor: 'pointer',
                border: `1px solid ${border}`, background: 'transparent',
                color: subtext, fontSize: 14, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'opacity 0.15s',
              }}>
              <RotateCcw size={15} />
              {isAr ? 'أعد الاختبار' : 'Retake'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}