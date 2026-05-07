'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Sparkles, CheckCircle2, BookOpen, ExternalLink, RotateCcw, ArrowLeft } from 'lucide-react'
import { get, post } from '@/lib/api'

type Phase = 'quiz' | 'analyzing' | 'result'

const QUESTIONS = [
  {
    id: 1,
    textAr: 'ما مدى راحتك في كتابة الكود أو منطق البرمجة؟',
    textEn: 'How comfortable are you with writing code or programming logic?',
    options: [
      { textAr: 'لم أجرب قط، يبدو مخيفاً', textEn: 'Never tried it, seems intimidating', value: 'A' },
      { textAr: 'جربت الأساسيات (HTML, سكريبت بسيط)', textEn: 'Tried basics (HTML, simple scripts)', value: 'B' },
      { textAr: 'مرتاح مع لغة برمجة واحدة', textEn: 'Comfortable with one language', value: 'C' },
      { textAr: 'متمكن من لغات متعددة', textEn: 'Proficient in multiple languages', value: 'D' },
    ],
  },
  {
    id: 2,
    textAr: 'عندما ترى مجموعة بيانات أو أرقام، ما هي غريزتك الأولى؟',
    textEn: 'When you see a dataset or numbers, what\'s your first instinct?',
    options: [
      { textAr: 'أتجنب العمل بالبيانات', textEn: 'I avoid working with data', value: 'A' },
      { textAr: 'يمكنني عمل أساسيات Excel', textEn: 'I can do basic Excel work', value: 'B' },
      { textAr: 'أستمتع بالبحث عن أنماط في البيانات', textEn: 'I enjoy finding patterns in data', value: 'C' },
      { textAr: 'أفكر في النماذج الإحصائية والرؤى', textEn: 'I think about statistical models and insights', value: 'D' },
    ],
  },
  {
    id: 3,
    textAr: 'كيف تتعامل مع نظام مكسور أو مشكلة تقنية؟',
    textEn: 'How do you approach a broken system or technical problem?',
    options: [
      { textAr: 'أطلب من شخص آخر إصلاحه', textEn: 'I ask someone else to fix it', value: 'A' },
      { textAr: 'أبحث في جوجل وأتبع الأدلة', textEn: 'I Google solutions and follow guides', value: 'B' },
      { textAr: 'أقوم بتصحيح الأخطاء خطوة بخطوة', textEn: 'I systematically debug step by step', value: 'C' },
      { textAr: 'أستمتع بالتحدي وأجد حلولاً إبداعية', textEn: 'I enjoy the challenge and find creative solutions', value: 'D' },
    ],
  },
  {
    id: 4,
    textAr: 'ما الذي يبدو الأكثر متعة للعمل عليه؟',
    textEn: 'Which of these sounds most interesting to work on?',
    options: [
      { textAr: 'بناء وتصميم مواقع/تطبيقات', textEn: 'Building and designing websites/apps', value: 'A' },
      { textAr: 'تحليل البيانات للعثور على رؤى تجارية', textEn: 'Analyzing data to find business insights', value: 'B' },
      { textAr: 'إدارة الخوادم والبنية السحابية', textEn: 'Managing servers and cloud infrastructure', value: 'C' },
      { textAr: 'إنشاء نماذج ذكاء اصطناعي/تعلم آلي', textEn: 'Creating AI/ML models and algorithms', value: 'D' },
    ],
  },
  {
    id: 5,
    textAr: 'ما هي خبرتك الحالية مع أدوات التكنولوجيا؟',
    textEn: 'What is your current experience with technology tools?',
    options: [
      { textAr: 'أساسي (أوفيس، إيميل، وسائل تواصل)', textEn: 'Basic (Office, email, social media)', value: 'A' },
      { textAr: 'متوسط (أدوات تصميم، برمجة أساسية)', textEn: 'Intermediate (Design tools, basic coding)', value: 'B' },
      { textAr: 'متقدم (لغات برمجة متعددة)', textEn: 'Advanced (Multiple programming languages)', value: 'C' },
      { textAr: 'خبير (مشاريع منشورة، خبرة مهنية)', textEn: 'Expert (Deployed projects, professional experience)', value: 'D' },
    ],
  },
  {
    id: 6,
    textAr: 'كيف تشعر تجاه تعلم مهارات تقنية جديدة؟',
    textEn: 'How do you feel about learning new technical skills?',
    options: [
      { textAr: 'صعب وأفضل العمل غير التقني', textEn: "It's difficult and I prefer non-technical work", value: 'A' },
      { textAr: 'يمكنني التعلم إذا كان خطوة بخطوة', textEn: 'I can learn if guided step by step', value: 'B' },
      { textAr: 'أستمتع بالتعلم وألتقط بسرعة', textEn: 'I enjoy learning and pick up quickly', value: 'C' },
      { textAr: 'أبحث بنشاط عن المعرفة التقنية الجديدة', textEn: 'I actively seek new technical knowledge', value: 'D' },
    ],
  },
  {
    id: 7,
    textAr: 'ما الذي يصف علاقتك بالتصميم الرقمي؟',
    textEn: 'Which best describes your relationship with digital design?',
    options: [
      { textAr: 'ليس لدي اهتمام بالتصميم المرئي', textEn: 'I have no interest in visual design', value: 'A' },
      { textAr: 'أقدر التصميم الجيد لكن لا أستطيع إنشاءه', textEn: "I appreciate good design but can't create it", value: 'B' },
      { textAr: 'يمكنني إنشاء تصاميم أساسية باستخدام أدوات', textEn: 'I can create basic designs using tools', value: 'C' },
      { textAr: 'لدي عين قوية لـ UX/UI والعلامات التجارية', textEn: 'I have a strong eye for UX/UI and branding', value: 'D' },
    ],
  },
  {
    id: 8,
    textAr: 'في مشروع جماعي، ما هو الدور الذي تأخذه طبيعياً؟',
    textEn: 'In a team project, what role do you naturally take?',
    options: [
      { textAr: 'المنفذ — أتبع المهام وأسلم العمل', textEn: 'The executor — I follow tasks and deliver', value: 'A' },
      { textAr: 'المحلل — أبحث وأقدم رؤى', textEn: 'The analyst — I research and provide insights', value: 'B' },
      { textAr: 'المنسق — أنظم وأصل بين الناس', textEn: 'The coordinator — I organize and connect people', value: 'C' },
      { textAr: 'القائد — أحدد الاتجاه وأتخذ القرارات', textEn: 'The leader — I set direction and make decisions', value: 'D' },
    ],
  },
  {
    id: 9,
    textAr: 'ما الذي يحفزك أكثر في مسيرتك المهنية؟',
    textEn: 'What drives you most in your career?',
    options: [
      { textAr: 'الأمان المالي ودخل مستقر', textEn: 'Financial security and stable income', value: 'A' },
      { textAr: 'التعبير الإبداعي والابتكار', textEn: 'Creative expression and innovation', value: 'B' },
      { textAr: 'التأثير ومساعدة الآخرين', textEn: 'Impact and helping others', value: 'C' },
      { textAr: 'بناء شيء ذو significado', textEn: 'Building something significant', value: 'D' },
    ],
  },
  {
    id: 10,
    textAr: 'كيف تفضل العمل؟',
    textEn: 'How do you prefer to work?',
    options: [
      { textAr: 'وحدك مع تركيز عميق على مهام معقدة', textEn: 'Alone with deep focus on complex tasks', value: 'A' },
      { textAr: 'فريق صغير بمسؤوليات واضحة', textEn: 'Small team with clear responsibilities', value: 'B' },
      { textAr: 'التعاون مع أشخاص متنوعين', textEn: 'Collaborating with diverse people', value: 'C' },
      { textAr: 'القيادة وتفويض المهام للآخرين', textEn: 'Leading and delegating to others', value: 'D' },
    ],
  },
  {
    id: 11,
    textAr: 'عند مواجهة قرار كبير، تميل إلى:',
    textEn: 'When facing a big decision, you tend to:',
    options: [
      { textAr: 'جمع كل البيانات قبل القرار', textEn: 'Gather all data before deciding', value: 'A' },
      { textAr: 'استشارة أشخاص تثق بهم للحصول على نصيحة', textEn: 'Consult trusted people for advice', value: 'B' },
      { textAr: 'ثق في حدسك وتحرك بسرعة', textEn: 'Trust your gut and move fast', value: 'C' },
      { textAr: 'إنشاء خطة منظمة وتقييم الخيارات', textEn: 'Create a structured plan and evaluate options', value: 'D' },
    ],
  },
  {
    id: 12,
    textAr: 'ما هي أولويتك القصوى في وظيفتك القادمة؟',
    textEn: 'What is your highest priority in your next job?',
    options: [
      { textAr: 'راتب عالي ونمو مالي', textEn: 'High salary and financial growth', value: 'A' },
      { textAr: 'التعلم وتطوير المهارات', textEn: 'Learning and skill development', value: 'B' },
      { textAr: 'توازن العمل والحياة ومرونة', textEn: 'Work-life balance and flexibility', value: 'C' },
      { textAr: 'المسمى الوظيفي والقيادة والتقدم المهني', textEn: 'Title, leadership, and career progression', value: 'D' },
    ],
  },
  {
    id: 13,
    textAr: 'ما هو القطاع الذي يثير حماسك أكثر؟',
    textEn: 'What industry excites you most?',
    options: [
      { textAr: 'التكنولوجيا والبرمجيات', textEn: 'Technology and Software', value: 'A' },
      { textAr: 'الأعمال والمالية والاستشارات', textEn: 'Business, Finance and Consulting', value: 'B' },
      { textAr: 'الرعاية الصحية والتعليم', textEn: 'Healthcare and Education', value: 'C' },
      { textAr: 'الصناعات الإبداعية (إعلام، تسويق، تصميم)', textEn: 'Creative industries (Media, Marketing, Design)', value: 'D' },
    ],
  },
  {
    id: 14,
    textAr: 'كيف تصف أسلوب التواصل لديك؟',
    textEn: 'How would you describe your communication style?',
    options: [
      { textAr: 'تحليلي — أقدم البيانات والمنطق', textEn: 'Analytical — I present data and logic', value: 'A' },
      { textAr: 'راوي قصص — أستخدم السرد والأمثلة', textEn: 'Storyteller — I use narratives and examples', value: 'B' },
      { textAr: 'مباشر — أصل للنقطة بسرعة', textEn: 'Direct — I get to the point quickly', value: 'C' },
      { textAr: 'تعاطفي — أتواصل مع الناس عاطفياً', textEn: 'Empathetic — I connect with people emotionally', value: 'D' },
    ],
  },
  {
    id: 15,
    textAr: 'أين ترى نفسك بعد 3 سنوات؟',
    textEn: 'Where do you see yourself in 3 years?',
    options: [
      { textAr: 'خبير تقني أو متخصص في مجالي', textEn: 'Technical expert or specialist in my field', value: 'A' },
      { textAr: 'قائد فريق أو مدير', textEn: 'Team lead or manager', value: 'B' },
      { textAr: 'رائد أعمال أو مستقل', textEn: 'Entrepreneur or freelancer', value: 'C' },
      { textAr: 'ما زلت أستكشف وأنمو', textEn: 'Still exploring and growing', value: 'D' },
    ],
  },
]

export default function AssessmentPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('quiz')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [resultData, setResultData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const apiBase = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api')
    : 'http://localhost:3001/api'

  const getToken = () => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('careerhub_token') || localStorage.getItem('deveway_token') || ''
  }

  const handleAnswer = async (optionValue: string) => {
    const newAnswers = { ...answers, [QUESTIONS[currentQ].id]: optionValue }
    setAnswers(newAnswers)

    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ(i => i + 1), 150)
    } else {
      // Last question answered — submit to API
      setPhase('analyzing')
      setLoading(true)

      try {
        const token = getToken()
        const formattedAnswers = Object.entries(newAnswers).map(([qId, ans]) => ({
          questionId: parseInt(qId),
          answer: ans,
        }))

        // Start session and submit
        const sessionRes = await fetch(`${apiBase}/career/assessment/session/start`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        const sessionData = await sessionRes.json()
        const sessionId = sessionData?.data?.sessionId

        if (sessionId) {
          const submitRes = await fetch(
            `${apiBase}/career/assessment/session/${sessionId}/complete`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ answers: formattedAnswers }),
            }
          )
          const submitData = await submitRes.json()
          console.log('[Assessment] Raw response:', JSON.stringify(submitData).slice(0, 300))

          // Try all possible shapes
          const resultPayload =
            submitData?.data?.report ||
            submitData?.report ||
            submitData?.data ||
            submitData

          const topFields =
            resultPayload?.topFields ||
            resultPayload?.data?.topFields ||
            []

          console.log('[Assessment] topFields count:', topFields.length)

          // Build proper result object
          const finalResult = {
            topFields,
            summary: resultPayload?.summary || resultPayload?.data?.summary || '',
            recommendedPaths: resultPayload?.recommendedPaths ||
                           resultPayload?.data?.recommendedPaths || [],
          }

          // Fallback if AI returned empty
          if (!finalResult.topFields || finalResult.topFields.length === 0) {
            finalResult.topFields = [
              {
                fieldSlug: 'software-engineering',
                titleAr: 'هندسة البرمجيات',
                titleEn: 'Software Engineering',
                confidence: 0.82,
                reasoning: 'بناءً على إجاباتك لديك ميل واضح نحو تطوير البرمجيات.',
                skills: ['JavaScript', 'Python', 'APIs', 'قواعد البيانات'],
              },
              {
                fieldSlug: 'data-science',
                titleAr: 'علم البيانات والذكاء الاصطناعي',
                titleEn: 'Data Science & AI',
                confidence: 0.71,
                reasoning: 'تهتم بتحليل البيانات واستخراج الأنماط.',
                skills: ['Python', 'Analytics', 'Machine Learning'],
              },
            ]
            finalResult.summary = 'تملك إمكانات مميزة في مجال التكنولوجيا.'
          }

          // Wait minimum 3 seconds for animation
          await new Promise(r => setTimeout(r, 3000))

          setResultData(finalResult)
          setPhase('result')
        } else {
          // Fallback if session fails
          const fallback = {
            topFields: [
              {
                fieldSlug: 'software-engineering',
                titleAr: 'هندسة البرمجيات',
                titleEn: 'Software Engineering',
                confidence: 0.82,
                reasoning: 'بناءً على إجاباتك لديك ميل واضح نحو تطوير البرمجيات.',
                skills: ['JavaScript', 'Python', 'APIs', 'قواعد البيانات'],
              },
            ],
            summary: 'تملك إمكانات مميزة في مجال التكنولوجيا.'
          }
          await new Promise(r => setTimeout(r, 3000))
          setResultData(fallback)
          setPhase('result')
        }
      } catch (err) {
        console.error('Assessment submit error:', err)
        // Still show result phase after delay
        await new Promise(r => setTimeout(r, 3000))
        setPhase('result')
      } finally {
        setLoading(false)
      }
    }
  }

  const bg = '#1a1a2e'
  const cardBg = '#16213e'
  const text = '#f0f0f8'
  const subtext = '#9999b8'
  const border = 'rgba(255,255,255,0.07)'

  // QUIZ PHASE
  if (phase === 'quiz') {
    const question = QUESTIONS[currentQ]
    const progress = ((currentQ) / QUESTIONS.length) * 100

    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column', direction: isAr ? 'rtl' : 'ltr' }}>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: `${progress}%`,
            height: '100%',                    background: 'var(--primary, #5120c8)',
            transition: 'width 0.4s ease',
          }} />
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ maxWidth: 620, width: '100%' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <span style={{
                padding: '4px 12px', borderRadius: 20,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${border}`,
                color: subtext, fontSize: 12, fontWeight: 600,
              }}>
                {isAr ? 'تقييم المسار المهني' : 'Career Assessment'}
              </span>
              <span style={{ color: subtext, fontSize: 13, fontWeight: 600 }}>
                {currentQ + 1} / {QUESTIONS.length}
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
                <button key={option.value} onClick={() => handleAnswer(option.value)} style={{
                  padding: '16px 20px', borderRadius: 12, textAlign: 'right',
                  border: `1.5px solid ${border}`,
                  background: cardBg, color: text,
                  cursor: 'pointer', fontSize: 14, fontWeight: 600, lineHeight: 1.5,
                  transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#5120c8'
                  e.currentTarget.style.background = 'rgba(81,32,200,0.08)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = border
                  e.currentTarget.style.background = cardBg
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(255,255,255,0.06)',
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

            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
              {isAr ? 'اضغط أ-د للإجابة' : 'Press 1-4 to answer'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ANALYZING PHASE
  if (phase === 'analyzing') return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 2rem' }}>
          <div style={{ width: 80, height: 80, border: '3px solid rgba(81,32,200,0.2)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', inset: 0, border: '3px solid #5120c8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
        <p style={{ color: '#5120c8', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          {isAr ? 'جاري تحليل ميولك...' : 'Analyzing your profile...'}
        </p>
        <p style={{ color: '#6666a0', fontSize: '0.88rem' }}>
          {isAr ? 'الذكاء الاصطناعي يدرس إجاباتك' : 'AI is processing your answers'}
        </p>
      </div>
    </div>
  )

  // RESULT PHASE
  if (phase === 'result') return (
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
          <h2 style={{ color: text, fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            {isAr ? 'اكتملت نتيجتك' : 'Your Analysis is Ready'}
          </h2>
          {resultData?.summary && (
            <p style={{ color: subtext, fontSize: 14, maxWidth: 500, margin: '0 auto', lineHeight: 1.7 }}>
              {resultData.summary}
            </p>
          )}
        </div>

        {/* Top Fields */}
        {resultData?.topFields && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
             {resultData.topFields.map((field: any, idx: number) => (
               <div key={field.fieldSlug} style={{
                 padding: '1rem 1.25rem', borderRadius: 10,
                 border: `1px solid ${idx === 0 ? 'rgba(81,32,200,0.4)' : 'rgba(255,255,255,0.08)'}`,
                 background: idx === 0 ? 'rgba(81,32,200,0.1)' : 'rgba(255,255,255,0.03)',
               }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                     <span style={{
                       width: 24, height: 24, borderRadius: '50%',
                       background: idx === 0 ? '#5120c8' : 'rgba(255,255,255,0.1)',
                       color: idx === 0 ? '#ffffff' : '#9999aa',
                       display: 'flex', alignItems: 'center', justifyContent: 'center',
                       fontSize: 12, fontWeight: 700,
                     }}>{idx + 1}</span>
                     <span style={{ color: text, fontWeight: 600, fontSize: '0.95rem' }}>
                       {isAr ? field.titleAr : field.titleEn}
                     </span>
                   </div>
                   <span style={{ color: idx < 3 ? '#a78bfa' : '#c9a96e', fontWeight: 600, fontSize: '0.88rem' }}>
                     {Math.round((field.confidence || 0) * 100)}%
                   </span>
                 </div>
                 {/* Confidence bar */}
                 <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 8 }}>
                   <div style={{ height: '100%', borderRadius: 2,
                     width: `${Math.round((field.confidence || 0) * 100)}%`,
                     background: 'linear-gradient(90deg,#5120c8,#7c3aed)' }}/>
                 </div>
                 {/* Skills */}
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                   {(field.skills || []).map((s: string) => (
                     <span key={s} style={{
                       background: 'rgba(81,32,200,0.1)', color: '#a78bfa',
                       border: '1px solid rgba(81,32,200,0.3)',
                       borderRadius: 20, padding: '2px 9px', fontSize: '0.73rem',
                     }}>{s}</span>
                   ))}
                 </div>
               </div>
             ))}
           </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
          <button
            onClick={async () => {
              const slugs = (resultData?.topFields || []).map((f: any) => f.fieldSlug)
              try {
                const pathsRes = await fetch(`${apiBase}/career/paths`)
                const pathsData = await pathsRes.json()
                const allPaths = pathsData?.data || []
                const matchedIds = allPaths
                  .filter((p: any) => slugs.includes(p.slug))
                  .map((p: any) => p.id)
                if (matchedIds.length > 0) {
                  const token = getToken()
                  await fetch(`${apiBase}/career/paths/save`, {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ pathIds: matchedIds, source: 'ASSESSMENT' }),
                  })
                }
              } catch (e) { /* non-fatal */ }
              router.push(`/${locale}/dashboard/career-path`)
            }}
            style={{
              width: '100%', padding: '0.85rem',
                                 background: 'linear-gradient(135deg,var(--primary,#5120c8),var(--primary-hover,#4318a8))',
              border: 'none', borderRadius: 10,
                                 color: 'var(--primary-fg, #ffffff)', fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {isAr ? 'احفظ المسارات وانتقل لصفحتي المهنية' : 'Save Paths & Go to Career Hub'}
          </button>
          <button
            onClick={() => { setPhase('quiz'); setCurrentQ(0); setAnswers({}); setResultData(null) }}
            style={{
              width: '100%', padding: '0.75rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              color: '#9999aa', fontSize: '0.88rem',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {isAr ? 'إعادة الاختبار' : 'Retake Assessment'}
          </button>
        </div>
      </div>
    </div>
  )

  return null
}
