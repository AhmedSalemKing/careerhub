'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { useMutation, useQuery } from '@tanstack/react-query'
import { get, post } from '../../../../lib/api'
import { AuthGate } from '../../../components/AuthGate'
import { DashboardShell } from '../../../components/DashboardShell'
import { Button } from '../../../components/ui/Button'
import { useRouter } from 'next/navigation'
import { findPathByTitle } from '../../../../lib/career-paths'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuestionOption {
  value: string
  en: string
}

interface Question {
  id: number
  category: string
  en: string
  options: QuestionOption[]
}

interface LearningStep {
  month: string
  focus: string
  resources: string
}

interface SalaryRange {
  egypt: string
  saudi: string
}

interface Specialization {
  rank: number
  title: string
  titleEn: string
  matchScore: number
  whyMatch: string
  requiredSkills: string[]
  currentSkills: string[]
  missingSkills: string[]
  learningPath: LearningStep[]
  salaryRange: SalaryRange
  timeToFirstJob: string
  jobTitles: string[]
  demandLevel: string
}

interface Report {
  personalityType: string
  personalityDescription: string
  topSpecializations: Specialization[]
  personalityStrengths: string[]
  areasToImprove: string[]
  personalAdvice: string
  urgentFirstStep: string
  disclaimer: string | null
}

interface HistorySession {
  id: string
  status: string
  createdAt: string
  completedAt: string | null
  report: Report | null
}

type Screen = 'welcome' | 'questions' | 'loading' | 'results' | 'error'

const LOADING_MESSAGES = [
  'Analyzing your personality profile...',
  'Mapping skills to market demands...',
  'Finding your best career matches...',
  'Building your learning roadmap...',
  'Almost ready...',
]

// ─── Helper components ────────────────────────────────────────────────────────

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-[color:var(--surface-2)] ${className || ''}`}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

function Chip({ label, variant }: { label: string; variant?: 'green' | 'red' | 'default' }) {
  const map: Record<string, string> = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    default: 'bg-[color:var(--surface-2)] text-foreground',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${map[variant || 'default']}`}>
      {label}
    </span>
  )
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────

function WelcomeScreen({
  onStart,
  history,
  onViewReport,
  isStarting,
}: {
  onStart: () => void
  history: HistorySession[]
  onViewReport: (r: Report) => void
  isStarting: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-8 shadow-sm">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Discover Your Career Path
        </h2>
        <p className="mt-2 text-[color:var(--muted)]">
          15 questions &middot; ~5 minutes &middot; AI-powered analysis
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: '🧠', label: 'Personality Analysis' },
            { icon: '🎯', label: 'Top 3 Specializations' },
            { icon: '📚', label: 'Custom Learning Plan' },
            { icon: '💰', label: 'Salary Insights' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-center shadow-sm">
              <div className="text-2xl">{item.icon}</div>
              <div className="mt-1 text-xs font-semibold text-foreground">{item.label}</div>
            </div>
          ))}
        </div>

        <Button className="mt-8 px-8" onClick={onStart} disabled={isStarting}>
          {isStarting ? 'Starting...' : 'Start Assessment →'}
        </Button>
      </div>

      {history.length > 0 && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
          <div className="text-sm font-bold text-foreground">Previous Assessments</div>
          <div className="mt-4 space-y-3">
            {history.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {s.report?.personalityType ?? 'Career Assessment'}
                  </div>
                  <div className="text-xs text-[color:var(--muted)]">
                    {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : '—'}
                  </div>
                </div>
                {s.report && (
                  <button
                    className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                    onClick={() => onViewReport(s.report!)}
                  >
                    View Report
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Questions Screen ─────────────────────────────────────────────────────────

function QuestionsScreen({
  questions,
  answers,
  onAnswer,
  onBack,
}: {
  questions: Question[]
  answers: Array<{ questionId: number; answer: string }>
  onAnswer: (questionId: number, value: string) => void
  onBack: () => void
}) {
  const idx = answers.length
  const q = questions[idx] || null
  const progress = questions.length > 0 ? Math.round((idx / questions.length) * 100) : 0

  if (!q) return null

  const catLabel = q.category === 'technical' ? 'Technical' : 'Professional'
  const catColor =
    q.category === 'technical'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[color:var(--muted)]">
            Question {idx + 1} of {questions.length}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${catColor}`}>{catLabel}</span>
        </div>
        <ProgressBar value={progress} className="mt-3" />
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <p className="text-lg font-bold text-foreground sm:text-xl">{q.en}</p>

        <div className="mt-6 space-y-3">
          {q.options.map((opt) => (
            <button
              key={`${q.id}-${opt.value}`}
              onClick={() => onAnswer(q.id, opt.value)}
              className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 text-left text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.99]"
            >
              <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[color:var(--border)] text-xs font-bold">
                {opt.value}
              </span>
              {opt.en}
            </button>
          ))}
        </div>

        {idx > 0 && (
          <div className="mt-6 flex gap-3">
            <Button variant="ghost" className="text-sm" onClick={onBack}>← Previous</Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0)
  const [prog, setProg] = useState(0)

  useEffect(() => {
    const t1 = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 2000)
    const start = Date.now()
    const t2 = setInterval(() => setProg(Math.min(((Date.now() - start) / 15000) * 100, 95)), 200)
    return () => { clearInterval(t1); clearInterval(t2) }
  }, [])

  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-10 shadow-sm">
      <div className="text-5xl">🧠</div>
      <div className="mt-6 text-base font-semibold text-foreground">{LOADING_MESSAGES[msgIdx]}</div>
      <ProgressBar value={prog} className="mt-6 w-64" />
      <p className="mt-3 text-xs text-[color:var(--muted)]">This may take up to 30 seconds</p>
    </div>
  )
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function ResultsScreen({
  report,
  onRetake,
  onSavePath,
  locale,
}: {
  report: Report
  onRetake: () => void
  onSavePath: (spec: Specialization) => Promise<void>
  locale: string
}) {
  const router = useRouter()
  const [expandedRank, setExpandedRank] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const demandColor = (lvl: string) => {
    if (lvl.toLowerCase().includes('very high')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    if (lvl.toLowerCase().includes('high')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
  }

  const rankBadge = (r: number) => ({ 1: 'bg-yellow-400 text-yellow-900', 2: 'bg-gray-300 text-gray-800', 3: 'bg-amber-600 text-white' }[r] || 'bg-primary text-white')

  const doSave = async () => {
    if (!report.topSpecializations.length || saving || saved) return
    setSaving(true)
    try {
      await onSavePath(report.topSpecializations[0])
      setSaved(true)
      router.push(`/${locale}/dashboard/career-path`)
    } catch { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[color:var(--muted)]">
              Your Career Report · {new Date().toLocaleDateString()}
            </div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{report.personalityType}</h2>
            <p className="mt-2 max-w-xl text-sm text-[color:var(--muted)]">{report.personalityDescription}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {report.personalityStrengths.map((s) => <Chip key={s} label={s} variant="green" />)}
          </div>
        </div>
      </div>

      {/* Top 3 */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-foreground">Your Top 3 Specializations</h3>
        {report.topSpecializations.map((spec) => (
          <div key={spec.rank} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm">
            <button
              className="w-full rounded-2xl p-5 text-left transition-colors hover:bg-[color:var(--surface-2)]"
              onClick={() => setExpandedRank(expandedRank === spec.rank ? 0 : spec.rank)}
            >
              <div className="flex items-center gap-4">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${rankBadge(spec.rank)}`}>
                  #{spec.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-foreground">{spec.titleEn}</span>
                    <span className="text-xs text-[color:var(--muted)]">{spec.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${demandColor(spec.demandLevel)}`}>
                      {spec.demandLevel} Demand
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-[color:var(--muted)]">{spec.whyMatch}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-2xl font-extrabold text-primary">{spec.matchScore}%</div>
                  <div className="text-xs text-[color:var(--muted)]">Match</div>
                </div>
              </div>
              <ProgressBar value={spec.matchScore} className="mt-3" />
            </button>

            {expandedRank === spec.rank && (
              <div className="border-t border-[color:var(--border)] p-5 pt-4 space-y-5">
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[color:var(--muted)]">Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {spec.currentSkills.map((s) => <Chip key={`c-${s}`} label={`✓ ${s}`} variant="green" />)}
                    {spec.missingSkills.map((s) => <Chip key={`m-${s}`} label={`✗ ${s}`} variant="red" />)}
                  </div>
                </div>

                <div>
                  <div className="mb-3 text-xs font-bold uppercase tracking-wide text-[color:var(--muted)]">Learning Roadmap</div>
                  <div className="space-y-3">
                    {spec.learningPath.map((step, i) => (
                      <div key={`lp-${i}`} className="flex gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3">
                        <div className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-center text-xs font-bold text-primary">{step.month}</div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{step.focus}</div>
                          <div className="text-xs text-[color:var(--muted)]">{step.resources}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
                    <div className="text-lg">🇪🇬</div>
                    <div className="mt-1 text-xs font-semibold text-[color:var(--muted)]">Egypt</div>
                    <div className="font-bold text-foreground">{spec.salaryRange.egypt}/month</div>
                  </div>
                  <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
                    <div className="text-lg">🇸🇦</div>
                    <div className="mt-1 text-xs font-semibold text-[color:var(--muted)]">Saudi Arabia</div>
                    <div className="font-bold text-foreground">{spec.salaryRange.saudi}/month</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2 text-sm">
                    ⏱ First job in: <span className="font-bold">{spec.timeToFirstJob}</span>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[color:var(--muted)]">Job Titles You Can Apply For</div>
                  <div className="flex flex-wrap gap-2">
                    {spec.jobTitles.map((t) => <Chip key={`j-${t}`} label={t} />)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Advice */}
      <div className="rounded-2xl border border-l-4 border-primary bg-primary/5 p-6 shadow-sm">
        <div className="text-sm font-extrabold text-primary">Personal Advice</div>
        <p className="mt-2 text-sm text-foreground">{report.personalAdvice}</p>
        <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-[color:var(--muted)]">Your First Step This Week:</div>
          <p className="mt-1 font-semibold text-foreground">{report.urgentFirstStep}</p>
        </div>
      </div>

      {/* Areas to improve */}
      {report.areasToImprove.length > 0 && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm">
          <div className="mb-3 text-sm font-bold text-foreground">Areas to Improve</div>
          <div className="flex flex-wrap gap-2">
            {report.areasToImprove.map((a) => <Chip key={`a-${a}`} label={a} variant="red" />)}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-wrap gap-3">
        {report.topSpecializations.length > 0 && (
          <Button disabled={saving || saved} onClick={doSave}>
            {saved ? '✓ Path Saved!' : saving ? 'Saving...' : '⭐ Save This Path'}
          </Button>
        )}
        <Button variant="secondary" onClick={() => router.push(`/${locale}/dashboard/career-path`)}>Start Learning Path</Button>
        <Button variant="secondary" onClick={() => router.push(`/${locale}/dashboard/coaching`)}>Book Coaching Session</Button>
        <Button variant="ghost" onClick={onRetake}>Retake Assessment</Button>
      </div>

      <p className="text-xs text-[color:var(--muted)]">
        {report.disclaimer ?? 'This is an AI-powered recommendation based on your answers.'}
      </p>
    </div>
  )
}

// ════════════════════════════════════════════════════════
//   MAIN PAGE
// ════════════════════════════════════════════════════════

export default function AssessmentPage() {
  const locale = useLocale() as 'ar' | 'en'
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>('welcome')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Array<{ questionId: number; answer: string }>>([])
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')
  const historyRef = useRef<Array<Array<{ questionId: number; answer: string }>>>([[]])

  // ── Queries ──
  const questionsQ = useQuery({
    queryKey: ['ai-assessment-questions'],
    queryFn: async () => {
      const res = await get('/career/assessment/questions')
      const d = (res as any)?.data?.data
      return Array.isArray(d?.questions) ? d.questions : []
    },
  })

  const historyQ = useQuery({
    queryKey: ['ai-assessment-history'],
    queryFn: async () => {
      const res = await get('/career/assessment/session/history')
      const d = (res as any)?.data?.data
      return Array.isArray(d?.sessions) ? d.sessions : []
    },
  })

  // ── Mutations ──
  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await post('/career/assessment/session/start')
      const sid = (res as any)?.data?.data?.sessionId
      if (!sid) throw new Error('No session ID returned')
      return String(sid)
    },
  })

  const completeMutation = useMutation({
    mutationFn: async (payload: { sessionId: string; answers: Array<{ questionId: number; answer: string }> }) => {
      const res = await post(`/career/assessment/session/${payload.sessionId}/complete`, {
        answers: payload.answers,
      })
      const rd = (res as any)?.data?.data
      if (rd && rd.personalityType) return rd
      if (rd && rd.report && rd.report.personalityType) return rd.report
      throw new Error('Invalid report structure')
    },
  })

  // ── Handlers ──
  const handleStart = useCallback(async () => {
    try {
      const id = await startMutation.mutateAsync()
      setSessionId(id)
      setAnswers([])
      historyRef.current = [[]]
      setScreen('questions')
    } catch (e: any) {
      setError(e?.message || 'Failed to start')
    }
  }, [startMutation])

  const handleAnswer = useCallback(async (qid: number, val: string) => {
    const qs = questionsQ.data
    if (!qs) return
    const next = [...answers, { questionId: qid, answer: val }]
    setAnswers(next)
    historyRef.current = [...historyRef.current, next]
    if (next.length === qs.length && sessionId) {
      setScreen('loading')
      try {
        const result = await completeMutation.mutateAsync({ sessionId, answers: next })
        if (!result?.personalityType) throw new Error('Bad report')
        setReport(result)
        historyQ.refetch()
        setScreen('results')
      } catch (e: any) {
        setError(e?.message || 'Failed to generate report')
        setScreen('error')
      }
    }
  }, [answers, questionsQ.data, sessionId, completeMutation, historyQ])

  // ← ✅ تم إصلاح هذا السطر (كان فيه typo)
  const handleBack = useCallback(() => {
    const h = historyRef.current
    if (h.length <= 1) return
    historyRef.current = h.slice(0, -1)
    setAnswers(h[h.length - 2])  // ← صحيح هنا
  }, [])

  const handleRetake = useCallback(() => {
    setReport(null)
    setAnswers([])
    setSessionId(null)
    setError('')
    setScreen('welcome')
  }, [])

  const handleSavePath = useCallback(async (spec: Specialization) => {
    const titleEn = spec.titleEn || spec.title || ''
    const match = findPathByTitle(titleEn)
    await post('/career/my-path', {
      pathId: match?.path.id || titleEn.toLowerCase().replace(/\s+/g, '-'),
      pathTitle: match?.path.title || titleEn,
      pathCategory: match?.category.category || 'Technology & Development',
      aiRecommended: true,
    })
  }, [])

  const handleViewReport = useCallback((r: Report) => {
    setReport(r)
    setScreen('results')
  }, [])

  const questions: Question[] = questionsQ.data || []
  const history: HistorySession[] = historyQ.data || []

  return (
    <AuthGate>
      <DashboardShell title="Career Assessment" subtitle="Discover your ideal tech career path">
        {screen === 'welcome' && (
          <WelcomeScreen onStart={handleStart} history={history} onViewReport={handleViewReport} isStarting={startMutation.isPending} />
        )}

        {screen === 'questions' && questions.length > 0 && (
          <QuestionsScreen questions={questions} answers={answers} onAnswer={handleAnswer} onBack={handleBack} />
        )}

        {screen === 'loading' && <LoadingScreen />}

        {screen === 'error' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 p-8 text-center shadow-sm">
            <div className="text-4xl">⚠️</div>
            <h3 className="mt-4 text-lg font-bold text-foreground">Something went wrong</h3>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button className="mt-6" onClick={() => { setScreen('welcome'); setAnswers([]); setSessionId(null); setError('') }}>
              Try Again
            </Button>
          </div>
        )}

        {screen === 'results' && report && (
          <ResultsScreen report={report} onRetake={handleRetake} onSavePath={handleSavePath} locale={locale} />
        )}
      </DashboardShell>
    </AuthGate>
  )
}