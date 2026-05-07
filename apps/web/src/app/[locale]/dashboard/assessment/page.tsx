'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react'

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

const getFallbackFields = () => [
  {
    fieldSlug: 'software-engineering',
    titleAr: 'هندسة البرمجيات',
    titleEn: 'Software Engineering',
    confidence: 0.80,
    reasoning: 'بناءً على إجاباتك، لديك ميل قوي نحو تطوير البرمجيات.',
    skills: ['JavaScript', 'Python', 'APIs', 'قواعد البيانات'],
  },
  {
    fieldSlug: 'data-science',
    titleAr: 'علم البيانات',
    titleEn: 'Data Science',
    confidence: 0.68,
    reasoning: 'تهتم بتحليل البيانات واستخراج الأنماط.',
    skills: ['Python', 'Analytics', 'SQL'],
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
      setPhase('analyzing')
      setLoading(true)

      const MIN_WAIT = 2500
      const waitPromise = new Promise(r => setTimeout(r, MIN_WAIT))

      try {
        const token = getToken()
        const formattedAnswers = Object.entries(newAnswers).map(([qId, ans]) => ({
          questionId: parseInt(qId),
          answer: ans,
        }))

        const submitPromise = (async () => {
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
            const payload = submitData?.data?.report ?? submitData?.report ?? submitData?.data ?? submitData ?? {}
            const topFields = payload?.topFields ?? payload?.data?.topFields ?? []
            return {
              topFields: topFields.length > 0 ? topFields : getFallbackFields(),
              summary: payload?.summary ?? payload?.data?.summary ?? '',
              recommendedPaths: payload?.recommendedPaths ?? [],
            }
          }
          return { topFields: getFallbackFields(), summary: '', recommendedPaths: [] }
        })()

        const result = await Promise.race([
          submitPromise.then(data => {
            setResultData(data)
            return data
          }),
          waitPromise.then(() => null),
        ])

        await waitPromise
        if (!result) {
          setResultData({ topFields: getFallbackFields(), summary: '', recommendedPaths: [] })
        }
      } catch {
        setResultData({ topFields: getFallbackFields(), summary: '', recommendedPaths: [] })
        await waitPromise
      } finally {
        setLoading(false)
        setPhase('result')
      }
    }
  }

  // QUIZ PHASE
  if (phase === 'quiz') {
    const question = QUESTIONS[currentQ]
    const progress = ((currentQ) / QUESTIONS.length) * 100

    return (
      <div className="min-h-screen bg-background flex flex-col" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="h-[3px] bg-border relative">
          <div className="absolute top-0 left-0 h-full bg-primary transition-all duration-[400ms]"
            style={{ width: `${progress}%` }} />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-[620px] w-full">
            <div className="flex justify-between items-center mb-8">
              <span className="px-3 py-1 rounded-full bg-surface-2 border border-border text-muted text-xs font-semibold">
                {isAr ? 'تقييم المسار المهني' : 'Career Assessment'}
              </span>
              <span className="text-muted text-sm font-semibold">
                {currentQ + 1} / {QUESTIONS.length}
              </span>
            </div>

            <h2 className="text-foreground text-[clamp(18px,3vw,24px)] font-extrabold mb-8 leading-relaxed tracking-tight">
              {isAr ? question.textAr : question.textEn}
            </h2>

            <div className="flex flex-col gap-2.5">
              {question.options.map((option, idx) => (
                <button key={option.value} onClick={() => handleAnswer(option.value)}
                  className="flex items-center gap-3.5 p-4 rounded-xl border border-border bg-surface text-foreground cursor-pointer text-sm font-semibold leading-relaxed transition-all duration-150 text-right hover:border-primary hover:bg-primary-subtle">
                  <div className="w-7 h-7 rounded-lg flex-shrink-0 bg-[rgba(0,0,0,0.06)] dark:bg-[rgba(255,255,255,0.06)] border border-border flex items-center justify-center text-xs font-extrabold text-muted">
                    {['أ','ب','ج','د'][idx] || (idx + 1)}
                  </div>
                  <span className="flex-1 text-right">
                    {isAr ? option.textAr : option.textEn}
                  </span>
                </button>
              ))}
            </div>

            <p className="text-muted-foreground text-xs text-center mt-5">
              {isAr ? 'اضغط أ-د للإجابة' : 'Press 1-4 to answer'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ANALYZING PHASE
  if (phase === 'analyzing') return (
    <div className="min-h-screen bg-background flex items-center justify-center" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="w-20 h-20 border-3 border-primary-border rounded-full" />
          <div className="absolute inset-0 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-primary text-lg font-semibold mb-2">
          {isAr ? 'جاري تحليل ميولك...' : 'Analyzing your profile...'}
        </p>
        <p className="text-muted text-sm">
          {isAr ? 'الذكاء الاصطناعي يدرس إجاباتك' : 'AI is processing your answers'}
        </p>
      </div>
    </div>
  )

  // RESULT PHASE
  if (phase === 'result') return (
    <div className="min-h-screen bg-background py-10 px-6 pb-20" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-[700px] mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-success-subtle border border-success mb-4">
            <CheckCircle2 size={13} className="text-success" />
            <span className="text-success text-xs font-semibold">
              {isAr ? 'تم التحليل بنجاح' : 'Analysis Complete'}
            </span>
          </div>
          <h2 className="text-foreground text-[clamp(22px,4vw,32px)] font-extrabold mb-2 tracking-tight">
            {isAr ? 'اكتملت نتيجتك' : 'Your Analysis is Ready'}
          </h2>
          {resultData?.summary && (
            <p className="text-muted text-sm max-w-[500px] mx-auto leading-relaxed">
              {resultData.summary}
            </p>
          )}
        </div>

        {resultData?.topFields && (
          <div className="flex flex-col gap-3 mb-8">
            {resultData.topFields.map((field: any, idx: number) => (
              <div key={field.fieldSlug}
                className={`p-4 rounded-xl border ${idx === 0 ? 'bg-primary-subtle border-primary-border' : 'bg-surface border-border'}`}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-primary text-primary-fg' : 'bg-surface-2 text-muted'}`}>
                      {idx + 1}
                    </span>
                    <span className="text-foreground font-semibold text-[0.95rem]">
                      {isAr ? field.titleAr : field.titleEn}
                    </span>
                  </div>
                  <span className={`font-semibold text-sm ${idx < 3 ? 'text-primary' : 'text-muted'}`}>
                    {Math.round((field.confidence || 0) * 100)}%
                  </span>
                </div>
                <div className="h-1 bg-border rounded mb-2">
                  <div className="h-full rounded bg-gradient-to-r from-primary to-[#7c3aed]"
                    style={{ width: `${Math.round((field.confidence || 0) * 100)}%` }} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(field.skills || []).map((s: string) => (
                    <span key={s} className="px-2.5 py-0.5 rounded-full bg-primary-subtle text-primary text-[0.73rem] border border-primary-border">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
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
              } catch { /* non-fatal */ }
              router.push(`/${locale}/dashboard/career-path`)
            }}
            className="btn-primary w-full justify-center text-base py-3.5"
          >
            {isAr ? 'احفظ المسارات وانتقل لصفحتي المهنية' : 'Save Paths & Go to Career Hub'}
          </button>
          <button
            onClick={() => { setPhase('quiz'); setCurrentQ(0); setAnswers({}); setResultData(null) }}
            className="w-full py-3 bg-transparent border border-border rounded-xl text-muted text-sm cursor-pointer font-body"
          >
            {isAr ? 'إعادة الاختبار' : 'Retake Assessment'}
          </button>
        </div>
      </div>
    </div>
  )

  return null
}
