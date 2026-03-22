'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQuery } from '@tanstack/react-query'
import { get, post } from '../../../../lib/api'
import { unwrapData, type ApiEnvelope } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { DashboardShell } from '../../../components/DashboardShell'
import { useToast } from '../../../../lib/toast'
import { Skeleton } from '../../../components/ui/Skeleton'
import { Button } from '../../../components/ui/Button'
import { AssessmentQuestion, type AssessmentQuestionModel } from '../../../components/AssessmentQuestion'
import { CourseCard, type CourseCardCourse } from '../../../components/CourseCard'

type CareerPath = { id: string; slug?: string; title?: string | null; titleAr?: string | null }

type StartAssessmentRes = { assessment?: { id: string } } | { assessment: { id: string } }

type NextQuestionRes = {
  question?: string
  options?: string[]
  current?: number
  total?: number
  isComplete?: boolean
  result?: unknown
} & Record<string, unknown>

type CompleteRes = {
  recommendedCareerPath?: { slug?: string; title?: string | null; titleAr?: string | null } | null
  recommendedCourses?: CourseCardCourse[]
  confidence?: number
  matchingSkills?: string[]
} & Record<string, unknown>

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function pickString(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

function pickNumber(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function pickStringArray(v: unknown): string[] | null {
  return Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : null
}

function parseQuestion(payload: unknown): {
  model: AssessmentQuestionModel | null
  current: number
  total: number
  isComplete: boolean
  result: unknown
} {
  const rec = asRecord(payload)
  const question = pickString(rec?.question)
  const options = pickStringArray(rec?.options) ?? []
  const current = pickNumber(rec?.current) ?? 1
  const total = pickNumber(rec?.total) ?? 10
  const isComplete = Boolean(rec?.isComplete)
  const result = rec?.result

  return {
    model: question ? { question, options } : null,
    current,
    total,
    isComplete,
    result,
  }
}

export default function DashboardAssessmentPage() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('assessment')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()

  const pathsQ = useQuery({
    queryKey: ['career-paths', locale],
    queryFn: async () => {
      const raw = (await get<ApiEnvelope<{ careerPaths: CareerPath[] }>>('/api/career/paths', { params: { language: locale } }))
        .data
      const data = unwrapData(raw)
      return (data as { careerPaths?: CareerPath[] }).careerPaths ?? []
    },
  })

  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [questionState, setQuestionState] = useState<ReturnType<typeof parseQuestion> | null>(null)
  const [completeData, setCompleteData] = useState<CompleteRes | null>(null)
  const [answers, setAnswers] = useState<string[]>([])

  const selectedCareerPathId = useMemo(() => pathsQ.data?.[0]?.id ?? null, [pathsQ.data])

  const startMutation = useMutation({
    mutationFn: async (careerPathId: string) => {
      const raw = (await post<ApiEnvelope<{ assessment: { id: string } }>>('/api/career/assessment/start', { careerPathId }))
        .data
      return unwrapData(raw) as StartAssessmentRes
    },
    onError: () => toast({ variant: 'danger', title: t('title'), description: e('network_error') }),
  })

  const nextQuestionMutation = useMutation({
    mutationFn: async (payload: { id: string; answer?: string }) => {
      const raw = (await post<ApiEnvelope<NextQuestionRes>>(`/api/career/assessment/${payload.id}/question`, { answer: payload.answer }))
        .data
      return unwrapData(raw) as NextQuestionRes
    },
    onError: () => toast({ variant: 'danger', title: t('title'), description: e('something_wrong') }),
  })

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const raw = (await post<ApiEnvelope<CompleteRes>>(`/api/career/assessment/${id}/complete`)).data
      return unwrapData(raw) as CompleteRes
    },
    onError: () => toast({ variant: 'danger', title: t('results_title'), description: e('something_wrong') }),
  })

  useEffect(() => {
    // If we already have an assessment id but no question yet, fetch the first question.
    if (assessmentId && !questionState && !nextQuestionMutation.isPending) {
      nextQuestionMutation.mutate(
        { id: assessmentId },
        {
          onSuccess: (res) => setQuestionState(parseQuestion(res)),
        },
      )
    }
  }, [assessmentId, questionState, nextQuestionMutation])

  const start = async () => {
    if (!selectedCareerPathId) return
    setCompleteData(null)
    setQuestionState(null)
    setAnswers([])
    const res = await startMutation.mutateAsync(selectedCareerPathId)
    const rec = asRecord(res)
    const assessment = asRecord((rec?.assessment as unknown) ?? null)
    const id = pickString(assessment?.id) ?? pickString((res as any)?.assessment?.id) ?? null
    if (!id) {
      toast({ variant: 'danger', title: t('title'), description: e('something_wrong') })
      return
    }
    setAssessmentId(id)
  }

  const onSelect = async (answer: string) => {
    if (!assessmentId) return
    setAnswers((prev) => [...prev, answer])
    const res = await nextQuestionMutation.mutateAsync({ id: assessmentId, answer })
    const parsed = parseQuestion(res)
    setQuestionState(parsed)

    if (parsed.isComplete) {
      toast({ title: t('analyzing'), description: t('analyzing') })
      const done = await completeMutation.mutateAsync(assessmentId)
      setCompleteData(done)
    }
  }

  const onBack = () => {
    // Server-driven flow: we only allow restart for now (prevents mismatch with backend state).
    setAssessmentId(null)
    setQuestionState(null)
    setAnswers([])
  }

  const isBusy = startMutation.isPending || nextQuestionMutation.isPending || completeMutation.isPending

  return (
    <AuthGate>
      <DashboardShell title={t('title')} subtitle={t('subtitle')}>
        {pathsQ.isLoading ? (
          <Skeleton className="h-28 rounded-2xl" />
        ) : pathsQ.isError ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
            <div className="text-sm text-[color:var(--muted)]">{c('empty')}</div>
            <button
              type="button"
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
              onClick={() => {
                toast({ title: c('loading'), description: c('loading') })
                pathsQ.refetch()
              }}
            >
              {c('retry')}
            </button>
          </div>
        ) : null}

        {!assessmentId && !completeData ? (
          <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
            <div className="text-sm font-bold text-foreground">{t('start')}</div>
            <p className="mt-2 text-sm text-[color:var(--muted)]">{t('subtitle')}</p>
            <Button className="mt-5 w-full sm:w-auto" onClick={() => void start()} disabled={isBusy || !selectedCareerPathId}>
              {isBusy ? c('loading') : t('start')}
            </Button>
          </div>
        ) : null}

        {assessmentId && !completeData ? (
          <div className="mt-6">
            {questionState?.model ? (
              <AssessmentQuestion
                model={questionState.model}
                current={questionState.current}
                total={questionState.total}
                onSelect={(a) => void onSelect(a)}
                onBack={onBack}
                backLabel={c('back')}
                isSubmitting={isBusy}
                backDisabled={answers.length === 0}
              />
            ) : (
              <Skeleton className="h-72 rounded-2xl" />
            )}
          </div>
        ) : null}

        {completeData ? (
          <div className="mt-6">
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
              <div className="text-lg font-extrabold text-foreground">{t('results_title')}</div>
              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                  <div className="text-xs font-semibold text-[color:var(--muted)]">{t('recommended_path')}</div>
                  <div className="mt-2 text-sm font-bold text-foreground">
                    {locale === 'ar'
                      ? completeData.recommendedCareerPath?.titleAr || completeData.recommendedCareerPath?.title || c('empty')
                      : completeData.recommendedCareerPath?.title || completeData.recommendedCareerPath?.titleAr || c('empty')}
                  </div>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                  <div className="text-xs font-semibold text-[color:var(--muted)]">{t('confidence')}</div>
                  <div className="mt-2 text-sm font-bold text-foreground">
                    {typeof completeData.confidence === 'number' ? `${Math.round(completeData.confidence)}%` : '-'}
                  </div>
                </div>
                <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                  <div className="text-xs font-semibold text-[color:var(--muted)]">{t('matching_skills')}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(completeData.matchingSkills ?? []).slice(0, 6).map((s) => (
                      <span key={s} className="rounded-full bg-[color:var(--surface-2)] px-2 py-1 text-xs text-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-end justify-between gap-4">
                  <div className="text-sm font-extrabold text-foreground">{t('view_courses')}</div>
                </div>

                {completeData.recommendedCourses?.length ? (
                  <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {completeData.recommendedCourses.slice(0, 6).map((course) => (
                      <CourseCard key={course.id} course={course} locale={locale} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-[color:var(--muted)]">{c('empty')}</div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => void start()} disabled={isBusy || !selectedCareerPathId}>
                  {t('start')}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DashboardShell>
    </AuthGate>
  )
}

