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
import {
  Brain,
  Target,
  BookOpen,
  DollarSign,
  Clock,
  AlertTriangle,
  Check,
  X,
  Star,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  GraduationCap,
  Briefcase,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Save,
  Calendar,
  Award,
  Zap,
} from 'lucide-react'

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
            { icon: Brain, label: 'Personality Analysis', color: '#8b5cf6' },
            { icon: Target, label: 'Top 3 Specializations', color: '#3b82f6' },
            { icon: BookOpen, label: 'Custom Learning Plan', color: '#10b981' },
            { icon: DollarSign, label: 'Salary Insights', color: '#f59e0b' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-center shadow-sm">
              <div 
                className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `${item.color}15` }}
              >
                <item.icon size={22} style={{ color: item.color }} />
              </div>
              <div className="mt-2 text-xs font-semibold text-foreground">{item.label}</div>
            </div>
          ))}
        </div>

        {/* ✅ زر Start Assessment - نص أبيض دائمًا */}
        <button
          onClick={onStart}
          disabled={isStarting}
          className="
            inline-flex h-11 items-center justify-center rounded-xl 
            text-sm font-bold transition-colors mt-8 px-8
            disabled:cursor-not-allowed disabled:opacity-60
            bg-primary hover:bg-primary/90
          "
          style={{ color: '#ffffff' }}
        >
          {isStarting ? (
            <span className="flex items-center gap-2">
              <RefreshCw size={16} className="animate-spin" />
              Starting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Start Assessment
              <ArrowRight size={16} />
            </span>
          )}
        </button>
      </div>

      {history.length > 0 && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Calendar size={16} />
            Previous Assessments
          </div>
          <div className="mt-4 space-y-3">
            {history.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Award size={18} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {s.report?.personalityType ?? 'Career Assessment'}
                    </div>
                    <div className="text-xs text-[color:var(--muted)]">
                      {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
                {s.report && (
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                    onClick={() => onViewReport(s.report!)}
                  >
                    <Eye size={14} />
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

// ─── Eye Icon (for View Report) ──────────────────────────────────────────────────

function Eye({ size, className }: { size?: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 14} 
      height={size || 14} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
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

  const catIcon = q.category === 'technical' ? Code : Users

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-[color:var(--muted)]">
            <HelpCircle size={16} />
            Question {idx + 1} of {questions.length}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${catColor}`}>
            {q.category === 'technical' ? <Code size={12} /> : <Users size={12} />}
            {catLabel}
          </span>
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
              className="group w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4 text-left text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.99]"
            >
              <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-[color:var(--border)] text-xs font-bold transition-colors group-hover:border-primary group-hover:bg-primary/10">
                {opt.value}
              </span>
              {opt.en}
            </button>
          ))}
        </div>

        {idx > 0 && (
          <div className="mt-6 flex gap-3">
            <button 
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[color:var(--muted)] hover:text-foreground hover:bg-[color:var(--surface-2)] transition-colors"
            >
              <ArrowLeft size={16} />
              Previous
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Additional Icons ──────────────────────────────────────────────────────────

function HelpCircle({ size, className }: { size?: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 16} 
      height={size || 16} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  )
}

function Code({ size, className }: { size?: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 12} 
      height={size || 12} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  )
}

function Users({ size, className }: { size?: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 12} 
      height={size || 12} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
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
      {/* ✨ أيقونة احترافية بدل الإيموجي */}
      <div className="relative">
        <Brain size={64} className="text-primary animate-pulse" />
        <Sparkles size={20} className="absolute -top-1 -right-1 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
      </div>
      
      <div className="mt-6 flex items-center gap-2 text-base font-semibold text-foreground">
        <Zap size={18} className="text-yellow-500" />
        {LOADING_MESSAGES[msgIdx]}
      </div>
      
      <ProgressBar value={prog} className="mt-6 w-64" />
      
      <p className="mt-3 flex items-center gap-1.5 text-xs text-[color:var(--muted)]">
        <Clock size={12} />
        This may take up to 30 seconds
      </p>
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

  const rankBadge = (r: number) => ({ 
    1: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-400/30', 
    2: 'bg-gray-300 text-gray-800', 
    3: 'bg-amber-600 text-white' 
  }[r] || 'bg-primary text-white')

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
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--muted)]">
              <FileText size={14} />
              Your Career Report · {new Date().toLocaleDateString()}
            </div>
            <h2 className="mt-1 flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
              <TrendingUp size={24} className="text-primary" />
              {report.personalityType}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[color:var(--muted)]">{report.personalityDescription}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {report.personalityStrengths.map((s) => (
              <Chip key={s} label={s} variant="green" />
            ))}
          </div>
        </div>
      </div>

      {/* Top 3 */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-base font-extrabold text-foreground">
          <Trophy size={20} className="text-yellow-500" />
          Your Top 3 Specializations
        </h3>
        
        {report.topSpecializations.map((spec) => (
          <div key={spec.rank} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm overflow-hidden">
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
                    <Briefcase size={16} className="text-muted" />
                    <span className="font-bold text-foreground">{spec.titleEn}</span>
                    <span className="text-xs text-[color:var(--muted)]">{spec.title}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${demandColor(spec.demandLevel)}`}>
                      <TrendingUp size={10} />
                      {spec.demandLevel} Demand
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-[color:var(--muted)]">{spec.whyMatch}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-2xl font-extrabold text-primary">{spec.matchScore}%</div>
                  <div className="text-xs text-[color:var(--muted)]">Match</div>
                </div>
                <ChevronDown 
                  size={18} 
                  className={`shrink-0 text-[color:var(--muted)] transition-transform duration-200 ${
                    expandedRank === spec.rank ? 'rotate-180' : ''
                  }`}
                />
              </div>
              <ProgressBar value={spec.matchScore} className="mt-3" />
            </button>

            {expandedRank === spec.rank && (
              <div className="border-t border-[color:var(--border)] p-5 pt-4 space-y-5">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[color:var(--muted)]">
                    <Wrench size={14} />
                    Skills
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {spec.currentSkills.map((s) => (
                      <span key={`c-${s}`} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <Check size={12} />
                        {s}
                      </span>
                    ))}
                    {spec.missingSkills.map((s) => (
                      <span key={`m-${s}`} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <X size={12} />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[color:var(--muted)]">
                    <GraduationCap size={14} />
                    Learning Roadmap
                  </div>
                  <div className="space-y-3">
                    {spec.learningPath.map((step, i) => (
                      <div key={`lp-${i}`} className="flex gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3">
                        <div className="flex shrink-0 flex-col items-center">
                          <div className="rounded-lg bg-primary/10 px-2 py-1 text-center text-xs font-bold text-primary">
                            {step.month}
                          </div>
                          <div className="mt-1 text-[10px] text-[color:var(--muted)]">
                            Step {i + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <MapPin size={14} className="text-primary" />
                            {step.focus}
                          </div>
                          <div className="mt-1 flex items-start gap-2 text-xs text-[color:var(--muted)]">
                            <BookOpen size={12} className="mt-0.5 shrink-0" />
                            {step.resources}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
                    <div className="flex items-center gap-2 text-lg">
                      <MapPin size={20} className="text-green-600" />
                      Egypt
                    </div>
                    <div className="mt-1 text-xs font-semibold text-[color:var(--muted)]">Average Salary</div>
                    <div className="flex items-center gap-1 font-bold text-foreground">
                      <DollarSign size={14} className="text-green-600" />
                      {spec.salaryRange.egypt}/month
                    </div>
                  </div>
                  <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] p-4">
                    <div className="flex items-center gap-2 text-lg">
                      <MapPin size={20} className="text-blue-600" />
                      Saudi Arabia
                    </div>
                    <div className="mt-1 text-xs font-semibold text-[color:var(--muted)]">Average Salary</div>
                    <div className="flex items-center gap-1 font-bold text-foreground">
                      <DollarSign size={14} className="text-blue-600" />
                      {spec.salaryRange.saudi}/month
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2 text-sm">
                    <Clock size={16} className="text-primary" />
                    First job in: <span className="font-bold">{spec.timeToFirstJob}</span>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[color:var(--muted)]">
                    <Briefcase size={14} />
                    Job Titles You Can Apply For
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {spec.jobTitles.map((t) => (
                      <Chip key={`j-${t}`} label={t} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Advice */}
      <div className="rounded-2xl border-l-4 border-primary bg-primary/5 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-extrabold text-primary">
          <Lightbulb size={18} />
          Personal Advice
        </div>
        <p className="mt-2 text-sm text-foreground">{report.personalAdvice}</p>
        <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[color:var(--muted)]">
            <Zap size={14} className="text-yellow-500" />
            Your First Step This Week:
          </div>
          <p className="mt-1 flex items-start gap-2 font-semibold text-foreground">
            <ArrowRight size={16} className="mt-0.5 shrink-0 text-primary" />
            {report.urgentFirstStep}
          </p>
        </div>
      </div>

      {/* Areas to improve */}
      {report.areasToImprove.length > 0 && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
            <AlertTriangle size={16} className="text-orange-500" />
            Areas to Improve
          </div>
          <div className="flex flex-wrap gap-2">
            {report.areasToImprove.map((a) => (
              <Chip key={`a-${a}`} label={a} variant="red" />
            ))}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-wrap gap-3">
        {report.topSpecializations.length > 0 && (
          <button
            disabled={saving || saved}
            onClick={doSave}
            className="inline-flex h-11 items-center justify-center rounded-xl text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 bg-primary hover:bg-primary/90 px-6"
            style={{ color: '#ffffff' }}
          >
            {saved ? (
              <span className="flex items-center gap-2">
                <Check size={16} />
                Path Saved!
              </span>
            ) : saving ? (
              <span className="flex items-center gap-2">
                <RefreshCw size={16} className="animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Star size={16} />
                Save This Path
              </span>
            )}
          </button>
        )}
        
        <button
          onClick={() => router.push(`/${locale}/dashboard/career-path`)}
          className="inline-flex h-11 items-center justify-center rounded-xl text-sm font-bold transition-colors border border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--surface-2)] px-6"
        >
          <GraduationCap size={16} />
          Start Learning Path
        </button>
        
        <button
          onClick={() => router.push(`/${locale}/dashboard/coaching`)}
          className="inline-flex h-11 items-center justify-center rounded-xl text-sm font-bold transition-colors border border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--surface-2)] px-6"
        >
          <Users size={16} />
          Book Coaching Session
        </button>
        
        <button
          onClick={onRetake}
          className="inline-flex h-11 items-center justify-center rounded-xl text-sm font-bold transition-colors text-[color:var(--muted)] hover:text-foreground hover:bg-[color:var(--surface-2)] px-6"
        >
          <RefreshCw size={16} />
          Retake Assessment
        </button>
      </div>

      <p className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
        <Info size={14} />
        {report.disclaimer ?? 'This is an AI-powered recommendation based on your answers.'}
      </p>
    </div>
  )
}

// ─── Additional Icons for Results ───────────────────────────────────────────────

function FileText({ size, className }: { size?: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 14} 
      height={size || 14} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  )
}

function Trophy({ size, className }: { size?: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 20} 
      height={size || 20} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17c0 .55-.45 1-1 1h0a1 1 0 0 1-1-1v-2.34"></path>
      <path d="M14 14.66V17c0 .55.45 1 1 1h0a1 1 0 0 1 1-1v-2.34"></path>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
    </svg>
  )
}

function Wrench({ size, className }: { size?: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 14} 
      height={size || 14} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>
  )
}

function Lightbulb({ size, className }: { size?: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 18} 
      height={size || 18} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 18h6"></path>
      <path d="M10 22h4"></path>
      <path d="M15.09 14.213A4.72 4.72 0 0 1 12 16 4.72 4.72 0 0 1 8.91 14.213"></path>
      <path d="M12 2v1"></path>
      <path d="M12 20v1"></path>
      <path d="M4.93 4.93l.7.7"></path>
      <path d="M19.07 4.93l-.7.7"></path>
      <path d="M2 12h1"></path>
      <path d="M21 12h1"></path>
      <path d="M4.93 19.07l-.7-.7"></path>
      <path d="M19.07 19.07l-.7-.7"></path>
    </svg>
  )
}

function Info({ size, className }: { size?: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 14} 
      height={size || 14} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
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

  const handleBack = useCallback(() => {
    const h = historyRef.current
    if (h.length <= 1) return
    historyRef.current = h.slice(0, -1)
    setAnswers(h[h.length - 2])
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
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-foreground">Something went wrong</h3>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 px-6"
              style={{ color: '#ffffff' }}
              onClick={() => { setScreen('welcome'); setAnswers([]); setSessionId(null); setError('') }}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {screen === 'results' && report && (
          <ResultsScreen report={report} onRetake={handleRetake} onSavePath={handleSavePath} locale={locale} />
        )}
      </DashboardShell>
    </AuthGate>
  )
}