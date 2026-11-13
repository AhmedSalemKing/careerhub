'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { VoiceOrb }  from '@/components/ai/VoiceOrb'
import { useAIChat } from '@/components/ai/useAIChat'
import type { CareerResult } from '@/components/ai/useAIChat'
import { computeDiscoveryStage, type ChatMessage } from './career-signals'
import { useAuthStore } from '@/stores/authStore'
import { useCareerMemory, buildMemoryContext } from '@/components/ai/useCareerMemory'
import { getToken } from '@/lib/auth'
import { useQueries } from '@tanstack/react-query'
import { useTracks, fetchTrack, formatSalaryRange, type Track } from '@/lib/tracks'
import { aiMarketPayload } from '@/lib/market'
import { useMarket } from '@/app/contexts/MarketContext'
import { formatCurrency } from '@/lib/formatCurrency'
import { MARKET_CONFIG, toLang } from '@/lib/marketConfig'
import { RasheedAvatar, CharacterAvatar } from '../../../components/CharacterDuo'
import { SECTION_SVGS, CHECK_SVG } from './sections'

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

const FIRST_MSG = `مرحباً! أنا رشيد، مرشدك المهني في ديفي واي لاكتشاف مسارك المهني.
خلينا نبدأ — إيه أكثر حاجة استمتعت بيها لما اشتغلت على مشروع تقني أو حاولت تحل مشكلة؟
احكيلي عن مثال حقيقي، حتى لو كان مشروعاً صغيراً.`

const QUIZ_START = `ابدأ الاختبار التفاعلي الآن. أنشئ السؤال الأول لاكتشاف المسار المهني المناسب.
استخدم هذا الفورمات بالضبط:
[QUIZ_Q]{"question":"...","choices":["أ) ...","ب) ...","ج) ...","د) ..."],"correct":0,"explanation":"..."}[/QUIZ_Q]
ثم أضف جملة تشجيعية قصيرة قبل السؤال.`

/* ── Quiz Assessment Types & Data ────────────────────────── */
interface QuizResult {
  summary: string
  topCareers: {
    name: string
    nameEn: string
    trackSlug?: string
    match: number
    reason: string
    strengths: string[]
    skillsToLearn: string[]
    nextStep: string
  }[]
  overallStrengths: string[]
  mainBarrier: string
  personalNote: string
}

const PHASES = [
  { id: 'profiling',   label: 'فهم المستخدم' },
  { id: 'interests',   label: 'الاهتمامات المهنية' },
  { id: 'skills',      label: 'المهارات والقدرات' },
  { id: 'behavioral',  label: 'السلوك المهني' },
  { id: 'motivation',  label: 'الدوافع وبيئة العمل' },
  { id: 'readiness',   label: 'الجاهزية المهنية' },
]

const ALL_QUESTIONS = [
  { id: 'p1q1', phase: 'profiling', phaseLabel: 'فهم المستخدم', question: 'إيه أقرب وصف لمرحلتك المهنية حالياً؟', options: ['طالب', 'خريج جديد', 'موظف حالياً', 'بفكر أغير مجالي', 'صاحب مشروع'] },
  { id: 'p1q2', phase: 'profiling', phaseLabel: 'فهم المستخدم', question: 'إيه هدفك الأساسي خلال الـ 12 شهر الجايين؟', options: ['أحصل على أول وظيفة', 'أغير مجالي المهني', 'أترقى في وظيفتي', 'أزيد دخلي', 'أكتسب مهارات جديدة'] },
  { id: 'p1q3', phase: 'profiling', phaseLabel: 'فهم المستخدم', question: 'إيه نوع الخبرة اللي اكتسبتها لحد دلوقتي؟', options: ['دراسة أكاديمية فقط', 'تدريب أو internship', 'مشروعات شخصية', 'عمل فعلي بخبرة', 'لا توجد خبرة بعد'] },
  { id: 'p2q1', phase: 'interests', phaseLabel: 'الاهتمامات المهنية', question: 'لو قدامك مشروع جديد، أنهي مهمة هتختار تبدأ بيها؟', options: ['تحليل البيانات واستخراج insights', 'ابتكار فكرة وتصميم الحل', 'تنظيم التنفيذ والخطة', 'التواصل مع العملاء وفهم احتياجاتهم', 'بناء المنتج تقنياً من الصفر'] },
  { id: 'p2q2', phase: 'interests', phaseLabel: 'الاهتمامات المهنية', question: 'إيه أكتر نشاط بيخليك مندمج ومش حاسس بالوقت؟', options: ['البحث والتحليل العميق', 'التصميم والإبداع البصري', 'مساعدة الناس وحل مشاكلهم', 'حل المشكلات التقنية البرمجية', 'التخطيط وإدارة المشروعات'] },
  { id: 'p2q3', phase: 'interests', phaseLabel: 'الاهتمامات المهنية', question: 'لو اتيحت لك فرصة تتعلم مهارة جديدة مجاناً، هتختار إيه؟', options: ['البرمجة وتطوير البرمجيات', 'تحليل البيانات والذكاء الاصطناعي', 'التصميم وتجربة المستخدم', 'التسويق الرقمي والمبيعات', 'إدارة المشروعات والمنتجات'] },
  { id: 'p3q1', phase: 'skills', phaseLabel: 'المهارات والقدرات', question: 'لما تواجه مشكلة جديدة، غالباً بتبدأ إزاي؟', options: ['أجمع المعلومات وأحللها أولاً', 'أجرب حلول مختلفة بشكل عملي', 'أستشير أشخاص عندهم خبرة', 'أقسم المشكلة لخطوات صغيرة', 'أبحث عن حلول مشابهة على الإنترنت'] },
  { id: 'p3q2', phase: 'skills', phaseLabel: 'المهارات والقدرات', question: 'إيه مدى راحتك مع الأرقام والبيانات والتحليل؟', options: ['بحب الأرقام وبتعامل معها بسهولة', 'مش بكره بس مش الأقوى عندي', 'بفضل الأعمال الإبداعية أو التواصلية', 'بعتمد على أدوات جاهزة', 'صعب عليا أوي'] },
  { id: 'p3q3', phase: 'skills', phaseLabel: 'المهارات والقدرات', question: 'لما تحتاج تتعلم حاجة جديدة، إيه أسلوبك؟', options: ['أجرب وأتعلم من الأخطاء بنفسي', 'أشوف شرح على يوتيوب أو دورة', 'أتبع منهجاً منظماً خطوة بخطوة', 'أتعلم مع مدرب أو mentor', 'أقرأ وثائق وdocumentation'] },
  { id: 'p4q1', phase: 'behavioral', phaseLabel: 'السلوك المهني', question: 'أنت مسؤول عن تسليم مشروع خلال يومين واكتشفت مشكلة ممكن تؤخر التسليم. أول إجراء تتخذه؟', options: ['أحلل سبب المشكلة وأحدد البدائل والوقت المطلوب', 'أبلغ الفريق وأقترح إعادة توزيع المهام', 'أبحث عن حل سريع وأختبره قبل ما أتصعيد', 'أتواصل فوراً مع المسؤول وأعرض عليه الخيارات'] },
  { id: 'p4q2', phase: 'behavioral', phaseLabel: 'السلوك المهني', question: 'أثناء العمل الجماعي، اختلف زميلان على طريقة تنفيذ مهمة. كيف تتصرف؟', options: ['أساعدهما في مقارنة الحلول بناءً على النتائج المتوقعة', 'أستمع لكل طرف وأحاول الوصول لاتفاق', 'أقترح تجربة الحلين عملياً ونشوف النتيجة', 'أطلب تحديد معايير واضحة نبني عليها القرار'] },
  { id: 'p4q3', phase: 'behavioral', phaseLabel: 'السلوك المهني', question: 'تم تكليفك بمهمة خارج نطاق خبرتك تماماً. كيف تتعامل معها؟', options: ['أبحث بنفسي عن كل المعلومات اللازمة', 'أطلب توجيهاً من شخص أكثر خبرة', 'أقسم المهمة لخطوات وأتعلم خلال التنفيذ', 'أوضح المهارات اللي محتاجها وأقترح خطة تنفيذ'] },
  { id: 'p5q1', phase: 'motivation', phaseLabel: 'الدوافع وبيئة العمل', question: 'إيه أهم عامل بالنسبة لك في اختيار الوظيفة؟', options: ['الدخل والاستقرار المادي', 'الإبداع والابتكار', 'التعلم والنمو المستمر', 'التأثير الإيجابي وخدمة الآخرين', 'الاستقلالية والمرونة'] },
  { id: 'p5q2', phase: 'motivation', phaseLabel: 'الدوافع وبيئة العمل', question: 'أي بيئة عمل بتساعدك تقدم أفضل أداء؟', options: ['فريق متعاون ومنظم', 'عمل مستقل بحرية كاملة', 'نظام وإجراءات واضحة', 'بيئة متغيرة بتحديات جديدة كل يوم'] },
  { id: 'p5q3', phase: 'motivation', phaseLabel: 'الدوافع وبيئة العمل', question: 'لما تفكر في نجاحك المهني، إيه أول حاجة بتيجي في بالك؟', options: ['أصبح خبيراً معروفاً في مجالي', 'أقود فريقاً ناجحاً', 'أبني مشروعي الخاص', 'أحقق دخلاً ممتازاً ومستقراً', 'أُحدث تأثيراً إيجابياً في المجتمع'] },
  { id: 'p6q1', phase: 'readiness', phaseLabel: 'الجاهزية المهنية', question: 'كم ساعة تقدر تخصص أسبوعياً لتطوير مهاراتك؟', options: ['أقل من 3 ساعات', 'من 3 إلى 5 ساعات', 'من 6 إلى 10 ساعات', 'أكثر من 10 ساعات'] },
  { id: 'p6q2', phase: 'readiness', phaseLabel: 'الجاهزية المهنية', question: 'إيه مستوى لغتك الإنجليزية في التعامل مع مواد العمل؟', options: ['مبتدئ — بالكاد أفهم', 'متوسط — أفهم لكن صعب أكتب', 'جيد — أقرأ وأكتب بشكل مقبول', 'متقدم — مريح تماماً'] },
  { id: 'p6q3', phase: 'readiness', phaseLabel: 'الجاهزية المهنية', question: 'ما أكبر عائق يواجهك حالياً في تطوير مسارك؟', options: ['ضيق الوقت', 'التكلفة المادية', 'مش عارف أبدأ منين', 'نقص المهارات الأساسية', 'قلة الفرص في محيطي'] },
]

/* ── Responsive overrides (inline styles cannot use media queries) ── */
const INTERVIEW_CSS = `
  @media (max-width: 768px) {
    .interview-stages { left: 12px !important; }
    .interview-stages > div { min-width: 150px !important; padding: 12px 14px !important; }
  }
  @media (max-width: 640px) {
    .interview-root { height: 100dvh !important; }
    .interview-stages { display: none !important; }
    .interview-header { flex-wrap: wrap !important; gap: 8px !important; padding: 12px !important; justify-content: center !important; }
    .interview-timer-wrap { right: 12px !important; bottom: 88px !important; }
    .interview-timer { padding: 6px 10px !important; gap: 6px !important; }
    .interview-timer span { font-size: 13px !important; }
    .interview-input { padding: 12px !important; }
    .interview-grid2 { grid-template-columns: 1fr !important; }
    .interview-actions { flex-direction: column !important; }
    .interview-actions button { width: 100% !important; }
  }
`

/* ── Career Result Card ───────────────────────────────────── */
function CareerResultCard({ result, onRestart }: { result: CareerResult; onRestart: () => void }) {
  const router = useRouter()
  const locale = useLocale()
  const score  = Math.min(Math.max(result.matchScore ?? 85, 60), 99)

  const radius = 42
  const circ   = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <style>{INTERVIEW_CSS}</style>
      <div style={{ width: '100%', maxWidth: 680, direction: 'rtl' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, background: 'color-mix(in srgb, var(--primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)', marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success, #22c55e)' }} />
            <span style={{ fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 500, color: 'var(--primary)' }}>تحليل مكتمل</span>
          </div>
          <h1 style={{ fontSize: 28, fontFamily: 'var(--font-ui)', fontWeight: 900, margin: '0 0 8px', color: 'var(--ink)' }}>نتيجة تقييمك المهني</h1>
          <p style={{ fontSize: 14, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'var(--ink-3)', margin: 0 }}>بناءً على محادثتنا، هذا المسار الأنسب لك</p>
        </div>

        {/* Score + primary path */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: 28, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flexShrink: 0, position: 'relative', width: 110, height: 110 }}>
            <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="55" cy="55" r={radius} fill="none" stroke="var(--line)" strokeWidth="10" />
              <circle cx="55" cy="55" r={radius} fill="none" stroke="var(--primary)" strokeWidth="10"
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontSize: 24, fontFamily: 'var(--font-ui)', fontWeight: 900, color: 'var(--ink)' }}>{score}%</span>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'var(--ink-3)' }}>تطابق</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 500, color: 'var(--ink-3)', marginBottom: 4 }}>المسار الأساسي الموصى به</div>
            <div style={{ fontSize: 22, fontFamily: 'var(--font-ui)', fontWeight: 900, color: 'var(--ink)', marginBottom: 8 }}>{result.primaryPath}</div>
            {result.summary && <p style={{ fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'var(--ink-3)', margin: 0, lineHeight: 1.6 }}>{result.summary}</p>}
          </div>
        </div>

        {/* Grid: strengths + next steps */}
        <div className="interview-grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 500, color: 'var(--ink-3)', marginBottom: 12 }}>نقاط قوتك</div>
            {(result.strengths ?? []).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success, #22c55e)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'var(--ink)' }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 500, color: 'var(--ink-3)', marginBottom: 12 }}>خطواتك التالية</div>
            {(result.nextSteps ?? []).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 900, color: 'var(--primary)', flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'var(--ink)', lineHeight: 1.4 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary paths */}
        {(result.secondaryPaths ?? []).length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 500, color: 'var(--ink-3)', marginBottom: 10 }}>مسارات بديلة مناسبة</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {result.secondaryPaths.map((p, i) => (
                <span key={i} style={{ padding: '4px 14px', borderRadius: 20, border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)', background: 'color-mix(in srgb, var(--primary) 8%, transparent)', fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 500, color: 'var(--primary)' }}>
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
            <span style={{ fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 500, color: 'var(--primary)' }}>الجدول الزمني المتوقع: {result.timeline}</span>
          </div>
        )}

        {/* Actions */}
        <div className="interview-actions" style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push(`/${locale}/dashboard/career-path`)}
            style={{ flex: 1, padding: '13px 20px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground, #fff)', fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}
          >
            ابدأ مسارك الآن
          </button>
          <button
            onClick={onRestart}
            style={{ padding: '13px 20px', borderRadius: 12, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)', fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 14, cursor: 'pointer' }}
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
    messages, isLoading, isListening, micState, isSpeaking,
    careerResult, voiceGender, setVoiceGender,
    ttsError, audioUnlocked, unlockAudio,
    sendMessage, speak, stopSpeaking, startListening, stopListening, clearChat,
    addAssistantMessage,
  } = useAIChat()

  const authUser   = useAuthStore(s => s.user)
  const userId     = authUser?.id ?? undefined
  const { load: loadMemory, loadFromServer: loadMemoryFromServer, saveResult: saveCareerResult } = useCareerMemory(userId)

  const [input,            setInput]            = useState('')
  const [started,          setStarted]          = useState(false)
  const [elapsed,          setElapsed]          = useState(0)
  const [handsFreeEnabled, setHandsFreeEnabled] = useState(false)
  const [handsFreePaused,  setHandsFreePaused]  = useState(false)
  const [micError,         setMicError]         = useState<string | null>(null)
  const [orbSize,          setOrbSize]          = useState(230)
  const messagesEndRef   = useRef<HTMLDivElement>(null)
  const spokenInitialRef  = useRef(false)
  const hasSpokeRef        = useRef(false)
  const autoListenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cbRef              = useRef({ startListening, sendMessage })

  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const update = () => setOrbSize(window.innerWidth < 640 ? 170 : 230)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    return () => {
      stopSpeaking()
      if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current)
      if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    }
  }, [stopSpeaking])

  const timeLeft = Math.max(0, 30 * 60 - elapsed)
  const mm       = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss       = String(timeLeft % 60).padStart(2, '0')

  // When the 30-minute session window closes, pause hands-free auto-listen.
  // The interview can still continue manually; this prevents the mic from
  // auto-restarting indefinitely after the intended session duration.
  useEffect(() => {
    if (timeLeft === 0 && handsFreeEnabled && !handsFreePaused) {
      setHandsFreePaused(true)
    }
  }, [timeLeft, handsFreeEnabled, handsFreePaused])

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

  // Save career result to localStorage when it first arrives
  useEffect(() => {
    if (careerResult) saveCareerResult(careerResult)
  }, [careerResult, saveCareerResult])

  // Build memory context for sendMessage calls.
  // Phase 1 (sync): loads from localStorage immediately for the first message.
  // Phase 2 (async): fetches from server and updates the ref; subsequent
  //   messages in the same session will use the authoritative server copy.
  const memoryContextRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const localMemory = loadMemory()
    memoryContextRef.current = buildMemoryContext(localMemory) || undefined

    // Non-blocking server load — update ref when it arrives
    loadMemoryFromServer().then(serverMemory => {
      if (serverMemory) {
        memoryContextRef.current = buildMemoryContext(serverMemory) || undefined
      }
    }).catch(() => { /* server unavailable — local memory is still set */ })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Evidence-based discovery-dimension tracker.
  // Dimensions are AREAS, not sequential steps — may be revisited freely.
  // Final stage "مراجعة النتائج" only appears when careerResult arrives.
  const currentStage = computeDiscoveryStage(messages as ChatMessage[], STAGES.length)

  const unlockAutoplay = useCallback(async () => {
    await unlockAudio()
    // Speaking is handled by the effect below — not here
  }, [unlockAudio])

  const handleEnableHandsFree = useCallback(async () => {
    setMicError(null)
    await unlockAutoplay()
    setHandsFreeEnabled(true)
    setHandsFreePaused(false)
  }, [unlockAutoplay])

  const handleHandsFreeToggle = useCallback(() => {
    if (handsFreePaused) setMicError(null)
    setHandsFreePaused(p => !p)
  }, [handsFreePaused])

  // Speak the initial interview question exactly once after audio is unlocked.
  // Guard via ref: prevents re-speaking when voiceGender changes or messages update.
  useEffect(() => {
    if (!audioUnlocked || spokenInitialRef.current) return
    const firstMsg = messages.find(m => m.role === 'assistant')
    if (!firstMsg) return
    spokenInitialRef.current = true
    speak(firstMsg.content)
  }, [audioUnlocked, messages, speak])

  // Keep stable refs to callbacks so the auto-listen timer never has stale closures
  useEffect(() => { cbRef.current = { startListening, sendMessage } }, [startListening, sendMessage])

  // Hands-free auto-listen: restart listening each time TTS finishes speaking
  useEffect(() => {
    if (autoListenTimerRef.current) { clearTimeout(autoListenTimerRef.current); autoListenTimerRef.current = null }
    if (!handsFreeEnabled || handsFreePaused || !audioUnlocked) return
    // TTS is running — mark that at least one TTS cycle has started
    if (isSpeaking) { hasSpokeRef.current = true; return }
    // Don't auto-listen before the first TTS plays (prevents immediate mic on mount)
    if (!hasSpokeRef.current) return
    // Already active or busy — don't double-start
    if (isListening || isLoading || micState !== 'idle') return

    autoListenTimerRef.current = setTimeout(() => {
      autoListenTimerRef.current = null
      cbRef.current.startListening(
        text => cbRef.current.sendMessage(text, true, memoryContextRef.current),
        err  => {
          if (err === 'not-allowed' || err === 'start-failed' || err === 'already-started') {
            setMicError('not-allowed')
            setHandsFreePaused(true)   // stop auto-restart after permission denial or start failure
          }
        },
        { autoSubmit: true },        // hands-free: silence ends the answer
      )
    }, 400)

    return () => {
      if (autoListenTimerRef.current) { clearTimeout(autoListenTimerRef.current); autoListenTimerRef.current = null }
    }
  }, [isSpeaking, handsFreeEnabled, handsFreePaused, audioUnlocked, isListening, isLoading, micState])

  const handleSend = useCallback(async () => {
    if (!input.trim()) return
    await unlockAutoplay()
    const ok = await sendMessage(input, true, memoryContextRef.current)
    if (ok) setInput('')
  }, [input, sendMessage, unlockAutoplay])

  const handleMic = useCallback(async () => {
    if (handsFreeEnabled) {
      // In hands-free mode the orb/mic button pauses or resumes auto-listening.
      if (isListening) stopListening()
      handleHandsFreeToggle()
      return
    }
    if (isListening) { stopListening(); return }
    if (micState === 'processing' || isLoading) return
    await unlockAutoplay()
    stopSpeaking()
    startListening(
      text => sendMessage(text, true, memoryContextRef.current),
      err  => { if (err === 'not-allowed') setMicError('not-allowed') },
      { autoSubmit: false },       // push-to-talk: only stop submits, no mid-thought send
    )
  }, [handsFreeEnabled, handleHandsFreeToggle, isListening, stopListening, micState, isLoading, stopSpeaking, startListening, sendMessage, unlockAutoplay])

  if (careerResult) {
    return <CareerResultCard result={careerResult} onRestart={() => { clearChat(); setStarted(false) }} />
  }

  const lastAI = [...messages].reverse().find(m => m.role === 'assistant')
  const cleanAI = lastAI?.content
    .replace(/\[CAREER_RESULT\][\s\S]*?\[\/CAREER_RESULT\]/g, '')
    .replace(/\[QUIZ_Q\][\s\S]*?\[\/QUIZ_Q\]/g, '')
    .trim() ?? ''

  const orbStatus = micState === 'listening' ? 'يسمع الآن'
    : micState === 'processing' ? 'يعالج'
    : isLoading ? 'يفكر'
    : isSpeaking ? 'يتحدث'
    : handsFreeEnabled && !handsFreePaused && hasSpokeRef.current ? 'ينتظر'
    : 'جاهز'

  return (
    <div className="interview-root" dir="rtl" style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--ink)', overflow: 'hidden' }}>
      <style>{INTERVIEW_CSS}</style>

      {/* Timer */}
      <div className="interview-timer-wrap" style={{ position: 'absolute', bottom: 100, right: 24, zIndex: 10 }}>
        <div className="interview-timer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'var(--ink-3)' }}>الوقت المتبقي</span>
          <span style={{ fontSize: 16, fontFamily: 'var(--font-ui)', fontWeight: 900, color: timeLeft < 300 ? 'var(--error, #ef4444)' : 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
            {mm}:{ss}
          </span>
        </div>
      </div>

      {/* Stages sidebar */}
      <div className="interview-stages" style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 18px', minWidth: 190 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 500, color: 'var(--ink-3)' }}>مراحل المقابلة</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 900, color: 'var(--primary)' }}>{currentStage + 1} / {STAGES.length}</span>
          </div>
          <div style={{ height: 3, background: 'var(--line)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((currentStage + 1) / STAGES.length) * 100}%`, background: 'var(--primary)', borderRadius: 2, transition: 'width .5s ease' }} />
          </div>
          {STAGES.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: i < currentStage ? 'var(--success, #22c55e)' : i === currentStage ? 'var(--primary)' : 'color-mix(in srgb, var(--ink) 15%, transparent)',
                transition: 'background .3s',
                boxShadow: i === currentStage ? '0 0 8px color-mix(in srgb, var(--primary) 60%, transparent)' : undefined,
              }} />
              <span style={{
                fontSize: 11, fontFamily: 'var(--font-ui)',
                color: i === currentStage ? 'var(--ink)' : i < currentStage ? 'var(--success, #6ee7b7)' : 'var(--ink-3)',
                fontWeight: i === currentStage ? 500 : 300,
              }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main center */}
      <div className="interview-main" style={{ flex: 1, minHeight: 0, minWidth: 0, overflowY: 'auto', paddingBottom: 96, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Top bar */}
        <div className="interview-header" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', zIndex: 10 }}>
          <button
            onClick={() => { stopSpeaking(); onEnd() }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 300 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            إنهاء المقابلة
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-foreground, white)" strokeWidth="1.8"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 500, color: 'var(--ink)' }}>رشيد · DeveWay</div>
              <div style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success, #22c55e)', fontFamily: 'var(--font-ui)', fontWeight: 300 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success, #22c55e)' }} />
                متصل الآن
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'var(--ink-3)' }}>الصوت:</span>
            <span style={{
              padding: '4px 12px', borderRadius: 20,
              border: '1px solid color-mix(in srgb, var(--primary) 60%, transparent)',
              background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
              color: 'var(--primary)',
              fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 500,
            }}>
              رشيد · ذكر
            </span>
          </div>
        </div>

        {/* Audio unlock — offer hands-free or manual mode */}
        {!audioUnlocked && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={handleEnableHandsFree}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 18px', borderRadius: 20,
                background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                border: '1px solid color-mix(in srgb, var(--primary) 40%, transparent)',
                color: 'var(--primary)',
                fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              </svg>
              محادثة صوتية تلقائية
            </button>
            <button
              onClick={unlockAutoplay}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 20,
                background: 'transparent',
                border: '1px solid var(--line)',
                color: 'var(--ink-3)',
                fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
              كتابة / صوت يدوي
            </button>
          </div>
        )}

        {/* Orb */}
        <div style={{ marginTop: 16, marginBottom: 16, background: 'transparent' }}>
          <VoiceOrb
            isListening={isListening}
            isSpeaking={isSpeaking}
            isThinking={isLoading}
            onClick={handleMic}
            size={orbSize}
          />
        </div>

        {/* Status */}
        <div style={{ fontSize: 14, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'var(--ink-3)', marginBottom: ttsError ? 8 : 20, display: 'flex', alignItems: 'center', gap: 8 }}>
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

        {/* Hands-free mode indicator — tap to pause/resume */}
        {handsFreeEnabled && (
          <div
            onClick={handleHandsFreeToggle}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, marginBottom: 10, cursor: 'pointer',
              background: handsFreePaused ? 'color-mix(in srgb, var(--ink) 8%, transparent)' : 'color-mix(in srgb, var(--primary) 12%, transparent)',
              border: `1px solid ${handsFreePaused ? 'var(--line)' : 'color-mix(in srgb, var(--primary) 35%, transparent)'}`,
            }}
          >
            {handsFreePaused
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/></svg>
            }
            <span style={{ fontSize: 11, fontFamily: 'var(--font-ui)', fontWeight: 500, color: handsFreePaused ? 'var(--ink-3)' : 'var(--primary)' }}>
              {handsFreePaused ? 'موقف مؤقتاً — انقر للاستئناف' : 'محادثة صوتية تلقائية — انقر للإيقاف المؤقت'}
            </span>
          </div>
        )}

        {/* Mic permission denied error */}
        {micError === 'not-allowed' && (
          <div style={{ maxWidth: 460, width: '90%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, marginBottom: 10,
            background: 'color-mix(in srgb, var(--error, #ef4444) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--error, #ef4444) 25%, transparent)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--error, #ef4444)" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ flex: 1, fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'color-mix(in srgb, var(--error, #ef4444) 90%, var(--ink))' }}>
              تعذر الوصول للميكروفون. تحقق من إعدادات المتصفح وأعط الإذن.
            </span>
            <button onClick={() => setMicError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 2, display: 'flex' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}

        {/* TTS error banner — shown when voice is unavailable; interview continues via text */}
        {ttsError && (
          <div style={{ maxWidth: 460, width: '90%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'color-mix(in srgb, var(--error, #ef4444) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--error, #ef4444) 25%, transparent)', marginBottom: 14 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--error, #ef4444)" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'color-mix(in srgb, var(--error, #ef4444) 90%, var(--ink))' }}>
              {ttsError === 'quota_exceeded'
                ? 'تم استنفاد حصة الصوت اليومية. يمكنك متابعة المقابلة نصياً.'
                : ttsError === 'timeout'
                ? 'انتهت مهلة خدمة الصوت. تابع نصياً.'
                : 'خدمة الصوت غير متاحة حالياً. تابع المقابلة نصياً.'}
            </span>
          </div>
        )}

        {/* Last AI message */}
        {cleanAI && (
          <div style={{ maxWidth: 520, width: '90%', background: 'color-mix(in srgb, var(--ink) 5%, transparent)', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, lineHeight: 1.7, fontSize: 14, fontFamily: 'var(--font-ui)', fontWeight: 300, textAlign: 'center', color: 'var(--ink)' }}>
            {cleanAI.length > 220 ? cleanAI.slice(0, 220) + '...' : cleanAI}
          </div>
        )}

        {/* Input bar */}
        <div className="interview-input" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px', background: 'var(--surface)', borderTop: '1px solid var(--line)', zIndex: 20 }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="اكتب إجابتك..."
              disabled={isLoading || micState !== 'idle'}
              style={{ flex: 1, padding: '12px 18px', borderRadius: 24, border: '1px solid var(--line)', background: 'color-mix(in srgb, var(--ink) 5%, transparent)', color: 'var(--ink)', fontSize: 14, fontFamily: 'var(--font-ui)', fontWeight: 300, outline: 'none', direction: 'rtl' }}
            />
            <button
              onClick={handleMic}
              title={handsFreeEnabled ? (handsFreePaused ? 'استئناف الاستماع' : 'إيقاف مؤقت') : (isListening ? 'إيقاف' : 'تحدث')}
              style={{
                width: 46, height: 46, borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .2s',
                background: handsFreeEnabled
                  ? (handsFreePaused ? 'color-mix(in srgb, var(--ink) 10%, transparent)' : 'color-mix(in srgb, var(--primary) 20%, transparent)')
                  : (isListening ? 'var(--primary)' : 'color-mix(in srgb, var(--ink) 10%, transparent)'),
                color: handsFreeEnabled
                  ? (handsFreePaused ? 'var(--ink-3)' : 'var(--primary)')
                  : (isListening ? 'var(--primary-foreground, white)' : 'var(--ink)'),
                boxShadow: (isListening || (handsFreeEnabled && !handsFreePaused)) ? '0 0 0 4px color-mix(in srgb, var(--primary) 20%, transparent)' : undefined,
              }}
            >
              {handsFreeEnabled
                ? (handsFreePaused
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>)
                : (isListening
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>)
              }
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              style={{ width: 46, height: 46, borderRadius: '50%', border: 'none', background: input.trim() ? 'var(--primary)' : 'color-mix(in srgb, var(--ink) 8%, transparent)', color: input.trim() ? 'var(--primary-foreground, white)' : 'var(--ink-3)', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .2s' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Quiz Result Card ─────────────────────────────────────── */
export function QuizResultCard({ result, answers, onRestart }: { result: QuizResult; answers: Record<string, string>; onRestart: () => void }) {
  const router = useRouter()
  const locale = useLocale()
  const RC_COLORS = ['var(--brand)', 'var(--purple)', 'var(--lavender)']
  const { market, config } = useMarket()
  const currency = config.currency
  const lang = toLang(locale)

  // Real tracks from the admin API: jobs, courses, vision and package price come from here.
  const { data: tracks = [] } = useTracks('ar')
  const matchTrack = (c: QuizResult['topCareers'][number]): Track | undefined =>
    tracks.find((t) => t.slug === c.trackSlug) ??
    tracks.find((t) => t.slug === c.nameEn.toLowerCase().replace(/\s+/g, '-')) ??
    tracks.find((t) => t.name === c.name)
  const matched = result.topCareers.map(matchTrack)
  const details = useQueries({
    queries: matched.map((tk) => ({
      queryKey: ['track', tk?.slug ?? 'none', 'ar'],
      queryFn: () => fetchTrack(tk!.slug, 'ar'),
      enabled: !!tk,
      staleTime: 60_000,
    })),
  })

  // First two readiness answers mean fewer than 5 study hours a week.
  const readinessOpts = ALL_QUESTIONS.find((q) => q.id === 'p6q1')?.options ?? []
  const lowHours = [readinessOpts[0], readinessOpts[1]].filter(Boolean).includes(answers['p6q1'])

  const startPath = (idx: number) => {
    try {
      localStorage.setItem('rasheed_quiz_result', JSON.stringify(result))
      const ar = result.topCareers.map(c => ({
        track: c.nameEn.toLowerCase().replace(/\s+/g, '-'),
        score: c.match, normalized: c.match, titleAr: c.name, titleEn: c.nameEn,
      }))
      localStorage.setItem('assessmentResults', JSON.stringify(ar))
      const sel = result.topCareers[idx]
      if (sel) localStorage.setItem('rasheed_selected_career', JSON.stringify({
        track: sel.nameEn.toLowerCase().replace(/\s+/g, '-'),
        score: sel.match, normalized: sel.match, titleAr: sel.name, titleEn: sel.nameEn,
      }))
    } catch {}
    router.push(`/${locale}/dashboard/career-path`)
  }

  const VISION_LABEL = {
    KSA: { name: MARKET_CONFIG.KSA.vision.name[lang], logo: '/images/ro2ya.png' },
    EG: { name: MARKET_CONFIG.EG.vision.name[lang], logo: '/images/egypt-vision.webp' },
  } as const

  return (
    <div dir="rtl" className="dw-assess" style={{ overflowY: 'auto' }}>
      <style>{INTERVIEW_CSS}</style>
      <div className="wrap assess" style={{ maxWidth: '1240px' }}>
        <div className="a-top">
          <span className="eyebrow">{SECTION_SVGS[4]} نتائج تقييمك جاهزة</span>
          <h1>ترشيحات رشيد لك</h1>
          <p className="lede">بناءً على إجاباتك. هذه اقتراحات تساعدك على القرار، وليست ضمانًا.</p>
        </div>

        <div className="r-intro r-intro-lg">
          <span className="r-figure static">
            <span className="r-blob" aria-hidden="true" />
            <RasheedAvatar size={52} />
          </span>
          <div className="r-bubble">
            <b>رشيد</b> <span className="muted small">· مرشد DeveWay المهني بالذكاء الاصطناعي</span>
            <p>هذا ما توصّلت إليه. كل اقتراح مصحوب بأسبابي، لتقرّر أنت ما يناسبك.</p>
            <p>{result.summary}</p>
            {result.personalNote && <p className="pill" style={{ marginTop: 8 }}>{result.personalNote}</p>}
          </div>
        </div>

        <div className="results rc-list">
          {result.topCareers.map((career, i) => {
            const len = 2 * Math.PI * 27
            const tk = matched[i]
            const td = details[i]?.data ?? null
            const pkg = td?.package ?? null
            const jobs = (tk?.jobs ?? []).slice(0, 3)
            const pkgIds = pkg?.courseIds ?? []
            const allCourses = (tk?.courses ?? []).slice().sort((a, b) => (a.order || 0) - (b.order || 0))
            const inPackage = pkgIds.length ? allCourses.filter((c) => c.courseId && pkgIds.includes(c.courseId)) : []
            const courses = inPackage.length ? inPackage : allCourses
            const skills = tk?.skills?.length ? tk.skills : career.skillsToLearn
            const vision = tk && tk.vision2030.includes(market) ? market : undefined
            const visionDesc = vision === 'KSA' ? td?.visionDescKSA : vision === 'EG' ? td?.visionDescEG : null
            return (
              <article
                key={i}
                className={`rc${i === 0 ? ' best' : ''}`}
                style={{ animationDelay: `${i * 140}ms` }}
              >
                <header className="rc-head">
                  <span className="rc-ic" style={{ background: RC_COLORS[i % RC_COLORS.length] }}>{SECTION_SVGS[5]}</span>
                  <div className="rc-title">
                    <span className="rc-rank">{i === 0 ? <>{SECTION_SVGS[0]} الأنسب لك</> : `الخيار ${i + 1}`}</span>
                    <h3>{tk?.name ?? career.name}</h3>
                    <p>{tk?.description ? tk.description : career.nameEn}</p>
                  </div>
                  <div className="rc-match">
                    <span className="ring-wrap" style={{ width: 60, height: 60 }}>
                      <svg className="ring-svg" width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
                        <defs>
                          <linearGradient id={`rg-${i}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="var(--brand)" />
                            <stop offset="100%" stopColor="var(--lavender)" />
                          </linearGradient>
                        </defs>
                        <circle className="bg" cx="30" cy="30" r="27" strokeWidth="6" />
                        <circle
                          className="fg"
                          cx="30" cy="30" r="27" strokeWidth="6"
                          stroke={`url(#rg-${i})`}
                          strokeDasharray={len}
                          strokeDashoffset={len * (1 - Math.min(100, Math.max(0, career.match)) / 100)}
                          style={{ ['--len' as string]: len } as React.CSSProperties}
                        />
                      </svg>
                      <b>{career.match}%</b>
                    </span>
                    <small>توافق</small>
                  </div>
                </header>

                <div className="rc-grid">
                  <section className="rc-sec rc-why">
                    <h4>{SECTION_SVGS[5]} لماذا يناسبك</h4>
                    <ul className="reasons">
                      <li>{CHECK_SVG}<span>{career.reason}</span></li>
                      {career.strengths?.map(s => (
                        <li key={s}>{CHECK_SVG}<span>{s}</span></li>
                      ))}
                    </ul>
                  </section>

                  {jobs.length > 0 ? (
                    <section className="rc-sec">
                      <h4>{SECTION_SVGS[2]} الوظائف ذات الصلة</h4>
                      <ul className="jobs">
                        {jobs.map((j) => {
                          const sal = market === 'EG' ? j.salaryEG : j.salaryKSA
                          const salary = formatSalaryRange(sal.min, sal.max, currency, lang)
                          return (
                            <li key={j.title}>
                              <span className="j-main">
                                <span className="j-name">{j.titleAr || j.title}</span>
                                {j.desc && <span className="j-desc">{j.desc}</span>}
                                {salary && <span className="j-sal"><b>{salary}</b><small>/ {config.salaryUnit[lang]}</small></span>}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  ) : (
                    <section className="rc-sec">
                      <h4>{SECTION_SVGS[2]} خطوتك القادمة</h4>
                      <p className="rc-step">{career.nextStep}</p>
                    </section>
                  )}

                  {courses.length > 0 && (
                    <section className="rc-sec">
                      <h4>{SECTION_SVGS[1]} الدورات المشمولة <span className="pill pill-muted">{courses.length}</span></h4>
                      <ol className="rc-courses">
                        {courses.map((c, n) => (
                          <li key={`${c.order}-${c.title}`}>
                            <span className="c-n">{n + 1}</span>
                            <b>{c.title}</b>
                            {c.weeks > 0 && <small>{c.weeks} أسبوع</small>}
                          </li>
                        ))}
                      </ol>
                    </section>
                  )}

                  <section className="rc-sec">
                    <h4>{SECTION_SVGS[3]} المهارات التي ستبنيها</h4>
                    <div className="skills">{skills.map(s => <span key={s}>{s}</span>)}</div>
                  </section>
                </div>

                {vision && (
                  <div className="rc-vision">
                    <span className="v-logo"><img src={VISION_LABEL[vision].logo} alt={VISION_LABEL[vision].name} /></span>
                    <div>
                      <p className="v-name">متوافق مع {VISION_LABEL[vision].name}</p>
                      {visionDesc && <p>{visionDesc}</p>}
                    </div>
                  </div>
                )}

                <footer className="rc-foot">
                  {pkg ? (
                    <span className="rc-price"><small>سعر واحد شامل</small><b>{formatCurrency(market === 'EG' ? Math.round(pkg.price * config.salaryMultiplier) : pkg.price, market, locale)}</b></span>
                  ) : <span />}
                  <span className="rc-actions">
                    {tk && (
                      <a className="btn btn-ghost btn-sm" href={`/${locale}/careers/${tk.slug}`}>عرض المسار</a>
                    )}
                    <button
                      type="button"
                      className={`btn ${i === 0 ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                      onClick={() => startPath(i)}
                    >
                      ابدأ هذا المسار
                      <svg className="icon go flip" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </button>
                  </span>
                </footer>
              </article>
            )
          })}
        </div>

        {lowHours && (
          <p className="note info" style={{ marginTop: 20 }}>
            <span>مع أقل من 5 ساعات أسبوعيًا، نقترح دورة واحدة في كل مرة.</span>
          </p>
        )}
        <p className="muted small" style={{ textAlign: 'center', marginTop: 10 }}>
          تتبع شارات رؤية 2030 السوق الذي اخترته أعلى الصفحة. يعكس التوافق قراءة DeveWay للأولويات الوطنية المعلنة، وليس اعتمادًا رسميًا.
        </p>

        <div className="rc-bottom">
          <button type="button" className="btn btn-primary" onClick={() => router.push(`/${locale}/dashboard/my-courses`)}>
            افتح «تعلّمي»
          </button>
          <button type="button" className="btn btn-ghost" onClick={onRestart}>
            أعد التقييم
          </button>
        </div>
      </div>
    </div>
  )
}

/* Hint requests are paced (the free tier allows ~15 calls a minute); the final analysis skips this queue. */
class RateLimitedError extends Error {}
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const HINT_GAP_MS = 4000
let lastHintAt = 0
let hintChain: Promise<unknown> = Promise.resolve()
function queueHint<T>(job: () => Promise<T>): Promise<T> {
  const run = async () => {
    const wait = Math.max(0, lastHintAt + HINT_GAP_MS - Date.now())
    if (wait) await sleep(wait)
    lastHintAt = Date.now()
    return job()
  }
  const p = hintChain.then(run, run)
  hintChain = p.catch(() => undefined)
  return p
}

/** Pull the result JSON out of the model reply: tolerant of a missing closing tag, code fences and surrounding prose. */
function parseQuizResult(text: string): QuizResult | null {
  const open = text.indexOf('[QUIZ_RESULT]')
  let body = open >= 0 ? text.slice(open + '[QUIZ_RESULT]'.length) : text
  const close = body.indexOf('[/QUIZ_RESULT]')
  if (close >= 0) body = body.slice(0, close)
  body = body.replace(/```(?:json)?/gi, '')
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    const r = JSON.parse(body.slice(start, end + 1)) as Partial<QuizResult>
    if (!r || !Array.isArray(r.topCareers) || r.topCareers.length === 0) return null
    return {
      summary: r.summary ?? '',
      topCareers: r.topCareers.slice(0, 3).map((c) => ({
        name: c.name ?? '',
        nameEn: c.nameEn ?? '',
        trackSlug: c.trackSlug || undefined,
        match: Number(c.match) || 0,
        reason: c.reason ?? '',
        strengths: Array.isArray(c.strengths) ? c.strengths : [],
        skillsToLearn: Array.isArray(c.skillsToLearn) ? c.skillsToLearn : [],
        nextStep: c.nextStep ?? '',
      })),
      overallStrengths: Array.isArray(r.overallStrengths) ? r.overallStrengths : [],
      mainBarrier: r.mainBarrier ?? '',
      personalNote: r.personalNote ?? '',
    }
  } catch { return null }
}

/* ── Quiz Mode ────────────────────────────────────────────── */
const OPT_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ']
const RASHEED_REACTIONS: string[][] = [
  ['ممتاز! كل مرحلة لها قيمتها.', 'رائع، هذا يوضح نقطة انطلاقك.', 'جيد، بدأت الصورة تتضح.'],
  ['اهتماماتك هي بوصلتك.', 'رائع، الشغف مهم جداً.', 'فهمت ميولك أكثر!'],
  ['مهاراتك تميزك.', 'أسلوبك في التعلم يفرق كثيراً.', 'ممتاز، هذا يساعدني على التوجيه بدقة.'],
  ['شخصيتك تؤثر في مسارك المهني.', 'فهمتك أكثر!', 'هذا مهم جداً.'],
  ['دوافعك تحدد بيئتك المثالية.', 'رائع، هذا يعكس أولوياتك.', 'نحو مسار يناسبك.'],
  ['أهدافك واضحة، وهذا ممتاز.', 'الوقت المتاح عامل مهم.', 'قريباً من النتيجة!'],
]
const RASHEED_IDLE = 'اختر الإجابة الأقرب لك، ولا توجد إجابة خاطئة.'
const PHASE_HINTS: Record<string, string> = {
  profiling:  'أجب بصراحة عن وضعك الحالي، فلا توجد إجابة صح أو خطأ',
  interests:  'فكّر في الأنشطة اللي تستمتع بيها بشكل طبيعي',
  skills:     'مش مهم مستواك الحالي، فكّر في اللي تميل إليه',
  behavioral: 'تخيّل نفسك في الموقف فعلاً، واختر اللي كنت هتعمله بجد',
  motivation: 'فكّر في اللي بيخليك تكمل حتى لو صعب',
  readiness:  'اختر بواقعية، ده بيساعدنا نبني لك خطة تناسب وقتك',
}
const QUESTION_HINTS: Record<string, string> = {
  p5q2: 'تخيّل يوم عمل مثالي ليك',
}
const hintFor = (q: { id: string; phase: string }) => QUESTION_HINTS[q.id] ?? PHASE_HINTS[q.phase] ?? RASHEED_IDLE

function QuizMode({ onEnd, embedded = false }: { onEnd: () => void; embedded?: boolean }) {
  const [reaction,        setReaction]        = useState('')
  const [isReacting,      setIsReacting]      = useState(false)
  const [currentIndex,    setCurrentIndex]    = useState(0)
  const [answers,         setAnswers]         = useState<Record<string, string>>({})
  const [insight,         setInsight]         = useState('')
  const [isLoadingInsight,setIsLoadingInsight]= useState(false)
  const [isAnalyzing,     setIsAnalyzing]     = useState(false)
  const [result,          setResult]          = useState<QuizResult | null>(null)
  const [analysisError,   setAnalysisError]   = useState(false)
  const router = useRouter()
  const locale = useLocale()

  const { data: platformTracks = [] } = useTracks('ar')
  const currentQuestion  = ALL_QUESTIONS[currentIndex]
  const currentPhaseIdx  = PHASES.findIndex(p => p.id === currentQuestion.phase)
  const selectedOption   = answers[currentQuestion.id] ?? null

  // Auto-advance 800ms after a choice; any new choice, "previous" or "next" cancels the pending advance.
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextRef         = useRef<() => void>(() => {})
  const indexRef        = useRef(currentIndex)
  indexRef.current = currentIndex
  const clearAdvance = () => {
    if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null }
  }
  useEffect(() => clearAdvance, [])

  const callChat = async (prompt: string, maxOutputTokens?: number, ctx?: string, timeoutMs = 26_000): Promise<string> => {
    const token = getToken()
    const res = await fetch('/api/ai/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body:    JSON.stringify({ messages: [{ role: 'user', content: prompt }], ...aiMarketPayload(), ...(maxOutputTokens ? { maxOutputTokens } : {}), ...(ctx ? { ctx } : {}) }),
      signal:  AbortSignal.timeout(timeoutMs),
    })
    if (res.status === 429) throw new RateLimitedError()
    if (!res.ok) throw new Error(`chat http=${res.status}`)
    const data = await res.json() as { content?: string; isError?: boolean; rateLimited?: boolean }
    // The route reports quota / overload as 200 + isError: that is an error, not Rasheed's words.
    if (data.isError) throw (data.rateLimited ? new RateLimitedError() : new Error('chat error'))
    return data.content ?? ''
  }

  const handleSelect = async (opt: string) => {
    const qIndex = currentIndex
    const sameAsBefore = answers[currentQuestion.id] === opt
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: opt }))

    clearAdvance()
    if (qIndex < ALL_QUESTIONS.length - 1) {
      advanceTimerRef.current = setTimeout(() => { advanceTimerRef.current = null; nextRef.current() }, 800)
    }

    if (sameAsBefore) return

    const pool = RASHEED_REACTIONS[currentPhaseIdx] ?? RASHEED_REACTIONS[0]
    setReaction(pool[Math.floor(Math.random() * pool.length)])
    setIsReacting(true)
    setTimeout(() => setIsReacting(false), 1000)

    setIsLoadingInsight(true)
    setInsight('')
    const hintPrompt = `أنت رشيد مساعد DeveWay. المستخدم اختار: "${opt}" كإجابة على سؤال "${currentQuestion.question}". اكتب تعليقاً تشجيعياً ذكياً بالعربية في جملة واحدة فقط (15 كلمة كحد أقصى). لا تبدأ بـ"اختيار ممتاز" — كن محدداً وطبيعياً.`
    const askHint = () => callChat(hintPrompt, undefined, `insight:Q${qIndex + 1}`)
    try {
      const text = await queueHint(async () => {
        if (indexRef.current !== qIndex) return ''
        try { return await askHint() }
        catch (e) {
          if (!(e instanceof RateLimitedError)) throw e
          await sleep(5000)
          if (indexRef.current !== qIndex) return ''
          return await askHint() // a second 429 falls through: the question simply shows its normal hint
        }
      })
      if (indexRef.current === qIndex) setInsight(text.trim())
    } catch { /* a missing comment is non-critical: the question keeps its hint */ }
    finally { if (indexRef.current === qIndex) setIsLoadingInsight(false) }
  }

  const handlePrev = () => {
    clearAdvance()
    if (currentIndex === 0) return
    setCurrentIndex(currentIndex - 1)
    setInsight('')
    setReaction('')
    setIsLoadingInsight(false)
  }

  const handleNext = async () => {
    clearAdvance()
    if (!selectedOption) return
    const nextIndex = currentIndex + 1
    if (nextIndex >= ALL_QUESTIONS.length) {
      setIsAnalyzing(true)
      const finalAnswers = answers
      // Every answer goes to the model together with the question it answers.
      const qaText = ALL_QUESTIONS.map((q, n) =>
        `[Q${n + 1}: ${q.question}] → ${finalAnswers[q.id] || 'لم يجب'}`
      ).join('\n')
      const trackList = platformTracks.length
        ? platformTracks.map(t => `- ${t.slug}: ${t.name}`).join('\n')
        : `- Data Analyst, Frontend Developer, Backend Developer, Full Stack Developer, UI/UX Designer, Product Manager, Data Scientist, Business Analyst, DevOps Engineer, Digital Marketing, Cybersecurity, Mobile Developer`

      const { market: aiMarket, locale: aiLocale } = aiMarketPayload()
      const targetMarket = MARKET_CONFIG[aiMarket].aiTargetMarket[aiLocale]

      try {
        const text = await callChat(
`أنت رشيد، مرشد مهني. بناءً على إجابات المستخدم التالية على أسئلة التقييم المهني، قدّم توصيات مسارات مهنية مخصصة:

${qaText}

السوق المستهدف: ${targetMarket}
اربط التوصيات بسوق العمل هذا، وأي راتب تذكره يكون بعملته.

حلّل هذه الإجابات بعمق (لاحظ الأنماط وأي تناقضات بين الإجابات، ولا تحلل كل سؤال على حدة) وقدّم 3 مسارات مهنية مرتبة حسب التوافق مع أسباب واضحة لكل مسار.
اختر المسارات من هذه القائمة فقط${platformTracks.length ? '، وأعد الـ slug كما هو في الحقل trackSlug' : ''}:
${trackList}

أجب بهذا الفورمات بالضبط (JSON):
[QUIZ_RESULT]
{
  "summary": "تحليل شخصي مخصص له في 2-3 جمل بالعربية يعكس إجاباته فعلاً",
  "topCareers": [
    {
      "name": "اسم المسار بالعربي",
      "nameEn": "Career Name in English",
      "trackSlug": "slug من القائمة أعلاه (أو فارغ)",
      "match": 87,
      "reason": "ليه هو المناسب بالتحديد بناءً على إجاباته — جملة أو اثنتين",
      "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
      "skillsToLearn": ["مهارة 1", "مهارة 2", "مهارة 3"],
      "nextStep": "خطوة عملية محددة يبدأ بيها خلال 90 يوم"
    }
  ],
  "overallStrengths": ["قوة عامة 1", "قوة عامة 2"],
  "mainBarrier": "العائق الرئيسي اللي لاحظته من إجاباته وكيف يتغلب عليه",
  "personalNote": "ملاحظة شخصية من رشيد تشجيعية ومحددة ليه"
}
[/QUIZ_RESULT]`,
          4096,
          'analysis',
          58_000,
        )
        const parsed = parseQuizResult(text)
        if (!parsed) throw new Error('unparseable result')
        sessionStorage.setItem('assessmentResult', JSON.stringify({ result: parsed, answers: finalAnswers, timestamp: Date.now(), market: aiMarket }))
        router.push(`/${locale}/dashboard/assessment/result`)
      } catch (e) {
        console.error('[Assessment] analysis failed', e)
        setAnalysisError(true)
      }
      finally { setIsAnalyzing(false) }
      return
    }

    setCurrentIndex(nextIndex)
    setInsight('')
    setReaction('')
    setIsLoadingInsight(false)
  }
  nextRef.current = handleNext

  if (result) {
    return (
      <QuizResultCard
        result={result}
        answers={answers}
        onRestart={() => { clearAdvance(); setCurrentIndex(0); setAnswers({}); setInsight(''); setResult(null) }}
      />
    )
  }

  if (analysisError && !isAnalyzing) {
    return (
      <div dir="rtl" className="dw-assess">
        <div className="dw-as-center">
          <div className="dw-as-avatar"><RasheedAvatar size={96} /></div>
          <h2>تعذّر إكمال التحليل</h2>
          <p>إجاباتك محفوظة. اضغط لإعادة المحاولة.</p>
          <button type="button" className="btn btn-primary" onClick={() => { setAnalysisError(false); void handleNext() }}>
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  if (isAnalyzing) {
    return (
      <div dir="rtl" className="dw-assess">
        <div className="dw-as-center">
          <div className="dw-as-avatar"><RasheedAvatar size={96} /></div>
          <h2>رشيد بيحلل إجاباتك...</h2>
          <p>بيدرس الأنماط ويجهز تقريرك المخصص</p>
        </div>
      </div>
    )
  }

  const progressPercent = Math.round(((currentIndex + (selectedOption ? 1 : 0)) / ALL_QUESTIONS.length) * 100)
  const phaseLabel = PHASES[currentPhaseIdx]?.label ?? currentQuestion.phaseLabel
  const bubbleText = insight && !isLoadingInsight ? insight : (reaction || hintFor(currentQuestion))

  return (
    <div dir="rtl" className={`dw-assess${embedded ? ' embedded' : ''}`}>
      <div className="wrap assess" style={{ maxWidth: '1240px' }}>
        {!embedded && (
          <button onClick={onEnd} className="dw-as-exit">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            خروج
          </button>
        )}

        {/* Section stepper */}
        <ol className="secbar">
          {PHASES.map((ph, i) => (
            <li key={ph.id} className={i < currentPhaseIdx ? 'done' : i === currentPhaseIdx ? 'now' : ''}>
              <span className="sb-ic">{i < currentPhaseIdx ? CHECK_SVG : SECTION_SVGS[i]}</span>
              <span className="sb-l">{ph.label}</span>
            </li>
          ))}
        </ol>

        <div className="a-shell">
          {/* Rasheed panel */}
          <aside className={`r-panel${isReacting ? ' reacting' : ''}`} aria-live="polite">
            <div className="r-say">
              <b>رشيد</b><span className="muted small"> · مرشدك المهني</span>
              {isLoadingInsight ? (
                <div className="dots3" aria-label="رشيد يكتب">
                  <i /><i /><i />
                </div>
              ) : (
                <p>{bubbleText}</p>
              )}
            </div>
            <div className="r-figure">
              <span className="r-blob" aria-hidden="true" />
              <RasheedAvatar size={96} />
            </div>
            <div className="r-steps" aria-hidden="true">
              {ALL_QUESTIONS.map((q, i) => (
                <i key={q.id} className={i < currentIndex ? 'done' : i === currentIndex ? 'now' : ''} />
              ))}
            </div>
          </aside>

          {/* Question area */}
          <div className="a-main">
            <div className="a-progress">
              <span>القسم {currentPhaseIdx + 1} من {PHASES.length} · السؤال {currentIndex + 1} من {ALL_QUESTIONS.length}</span>
              <span className="a-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
                <span style={{ width: `${progressPercent}%` }} />
              </span>
              <span className="cast"><CharacterAvatar id="sa2" size={30} /><CharacterAvatar id="eg1" size={30} /></span>
            </div>

            <div className="qcard">
              <div className="r-ask">
                <RasheedAvatar size={34} />
                <span>
                  <b>يسأل رشيد</b> · <span className="muted">{phaseLabel}</span>
                </span>
              </div>
              <h2>{currentQuestion.question}</h2>

              <div className="opts" role="radiogroup" aria-label={currentQuestion.question}>
                {currentQuestion.options.map((opt, i) => {
                  const isSelected = selectedOption === opt
                  return (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleSelect(opt)}
                      className={`opt${isSelected ? ' on' : ''}`}
                    >
                      <span className="o-ic">{OPT_LETTERS[i] ?? String.fromCharCode(65 + i)}</span>
                      <span>{opt}</span>
                      <span className="o-check" aria-hidden="true">{CHECK_SVG}</span>
                    </button>
                  )
                })}
              </div>

              <div className="a-nav">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="btn btn-secondary"
                  style={{ opacity: currentIndex === 0 ? 0.4 : 1 }}
                >
                  <svg className="icon go" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  السابق
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!selectedOption}
                  className="btn btn-primary"
                >
                  {currentIndex === ALL_QUESTIONS.length - 1 ? 'عرض نتيجتي' : 'التالي'}
                  <svg className="icon go flip" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Mode Select ──────────────────────────────────────────── */
function ModeSelect({ onSelect }: { onSelect: (m: 'interview' | 'quiz') => void }) {
  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'color-mix(in srgb, var(--primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/></svg>
        </div>
        <h1 style={{ fontSize: 32, fontFamily: 'var(--font-ui)', fontWeight: 900, margin: '0 0 10px', color: 'var(--ink)' }}>اكتشف مسارك المهني</h1>
        <p style={{ fontSize: 15, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'var(--ink-3)', margin: '0 0 4px' }}>مع مساعدك الذكي في DeveWay</p>
        <p style={{ fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'var(--ink-3)' }}>اختر الطريقة التي تناسبك لاكتشاف فرصك المهنية.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, width: '100%', maxWidth: 640 }}>
        {/* Interview */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'color-mix(in srgb, var(--primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.7"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h2 style={{ fontSize: 20, fontFamily: 'var(--font-ui)', fontWeight: 900, margin: '0 0 10px', color: 'var(--ink)' }}>مقابلة مع AI</h2>
          <p style={{ fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'var(--ink-3)', margin: '0 0 16px', lineHeight: 1.6, flex: 1 }}>
            حاور مساعدك الذكي في حوار تفاعلي يستكشف اهتماماتك وخبراتك ويقدم توصيات مخصصة.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success, #22c55e)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'var(--ink-3)' }}>المدة التقريبية: 25-30 دقيقة</span>
          </div>
          <button onClick={() => onSelect('interview')} style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground, #fff)', fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>
            ابدأ المقابلة
          </button>
        </div>

        {/* Quiz */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #2bbfa3)" strokeWidth="1.7"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h2 style={{ fontSize: 20, fontFamily: 'var(--font-ui)', fontWeight: 900, margin: '0 0 10px', color: 'var(--ink)' }}>اختبار تفاعلي</h2>
          <p style={{ fontSize: 13, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'var(--ink-3)', margin: '0 0 16px', lineHeight: 1.6, flex: 1 }}>
            أسئلة ذكية تتكيف مع إجاباتك لتحديد أنسب المسارات المهنية لك بدقة عالية.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success, #22c55e)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'var(--ink-3)' }}>المدة التقريبية: 15-20 دقيقة</span>
          </div>
          <button onClick={() => onSelect('quiz')} style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)', fontFamily: 'var(--font-ui)', fontWeight: 300, fontSize: 14, cursor: 'pointer' }}>
            ابدأ الاختبار
          </button>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'var(--font-ui)', fontWeight: 300, color: 'var(--ink-3)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        التوصيات مبنية على المعلومات التي تشاركها معنا، وهي إرشاد مهني وليست ضماناً لوظيفة معينة.
      </div>
    </div>
  )
}

/* ── Main export ──────────────────────────────────────────── */
export default function AIInterviewPage({ mode, embedded = false }: { mode?: string; embedded?: boolean }) {
  const router = useRouter()
  const locale = useLocale()

  const handleEnd = () => router.push(`/${locale}/dashboard/assessment`)

  if (mode === 'interview') return <InterviewMode onEnd={handleEnd} />
  if (mode === 'quiz')      return <QuizMode      onEnd={handleEnd} embedded={embedded} />
  return <ModeSelect onSelect={m => router.push(`/${locale}/dashboard/assessment?mode=${m}`)} />
}
